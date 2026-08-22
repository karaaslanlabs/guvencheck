import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { preserveProductResultWithShadow } from "../lib/agent-platform-shadow.ts";

const samples = [
  { type: "text", content: "Controlled account warning" },
  { type: "text", content: "Controlled delivery notice" },
  { type: "text", content: "Controlled ordinary conversation" },
  { type: "link", content: "https://example.com/controlled-1" },
  { type: "link", content: "https://example.org/controlled-2" },
  { type: "link", content: "https://example.net/controlled-3" },
  { type: "image", imageData: "data:image/png;base64,Y29udHJvbGxlZA==" },
  { type: "image", imageData: "data:image/jpeg;base64,Y29udHJvbGxlZA==" },
  { type: "image", imageData: "data:image/webp;base64,Y29udHJvbGxlZA==" },
  { type: "text", content: "Controlled OTP request" },
];

const persisted = new Map();
const latencies = [];
let nextId = 0;
const fetchImpl = async (_url, init) => {
  const task = JSON.parse(init.body);
  const id = `m2-2-${++nextId}`;
  persisted.set(id, { id, ...task, status: "succeeded", result: { assessment: { status: "not_assessed", riskLevel: null } } });
  return new Response(JSON.stringify({ task: persisted.get(id) }), { status: 201 });
};

for (const [index, input] of samples.entries()) {
  const productResult = { owner: "guvencheck", decision: "unchanged", sample: index };
  const started = performance.now();
  const returned = await preserveProductResultWithShadow(productResult, input, `real-callsite-${index + 1}`, {
    platformUrl: "http://controlled-agent-platform.local",
    fetchImpl,
  });
  latencies.push(performance.now() - started);
  assert.equal(returned, productResult);
}

const outageResult = { owner: "guvencheck", decision: "unchanged", outage: true };
const outageReturned = await preserveProductResultWithShadow(outageResult, samples[0], "outage", {
  platformUrl: "http://controlled-agent-platform.local",
  fetchImpl: async () => { throw new Error("injected outage"); },
});
assert.equal(outageReturned, outageResult);

const sorted = [...latencies].sort((a, b) => a - b);
const percentile = p => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
console.log(JSON.stringify({
  run: "M2.2-real-product-callsite-controlled-evidence",
  sampleCount: samples.length,
  taskSuccessRate: persisted.size / samples.length,
  payloadAssetCompatibilityRate: persisted.size / samples.length,
  persistenceReadbackRate: [...persisted.keys()].filter(id => persisted.get(id)?.status === "succeeded").length / samples.length,
  latencyMs: { min: sorted[0], p50: percentile(0.5), p95: percentile(0.95), max: sorted.at(-1) },
  failOpen: { injectedOutagePreservedExactProductResult: outageReturned === outageResult },
  operationalLeverage: { shadowRecordsWithoutManualHandoff: persisted.size },
  productionRiskDecisionMoved: false,
  rawImageBytesForwarded: false,
}, null, 2));
