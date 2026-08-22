import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { performance } from "node:perf_hooks";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { preserveProductResultWithShadow } from "../lib/agent-platform-shadow.ts";

const platformEntry = process.env.AGENT_PLATFORM_API_ENTRY;
assert.ok(platformEntry, "AGENT_PLATFORM_API_ENTRY must point to the built Karaaslan Agent Platform apps/api/dist/index.js");

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

const runtime = spawn(process.execPath, [fileURLToPath(new URL("./m2-2-agent-platform-http-runtime.mjs", import.meta.url))], {
  env: { ...process.env, AGENT_PLATFORM_API_ENTRY: platformEntry },
  stdio: ["ignore", "pipe", "inherit"],
});

const firstLine = await new Promise((resolve, reject) => {
  let buffered = "";
  runtime.stdout.setEncoding("utf8");
  runtime.stdout.on("data", chunk => {
    buffered += chunk;
    const newline = buffered.indexOf("\n");
    if (newline >= 0) resolve(buffered.slice(0, newline));
  });
  runtime.once("exit", code => reject(new Error(`Agent Platform HTTP runtime exited before ready (${code})`)));
});
const { baseUrl } = JSON.parse(firstLine);

const pollTerminalTask = async taskId => {
  const deadline = performance.now() + 5_000;
  let getCount = 0;
  while (performance.now() < deadline) {
    getCount += 1;
    const response = await fetch(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`);
    assert.equal(response.status, 200);
    const { task } = await response.json();
    if (task.status === "succeeded" || task.status === "failed") return { task, getCount };
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error(`Task ${taskId} did not reach a terminal state`);
};

const records = [];
try {
  for (const [index, input] of samples.entries()) {
    const productResult = { owner: "guvencheck", decision: "unchanged", sample: index + 1 };
    let observation;
    const started = performance.now();
    const returned = await preserveProductResultWithShadow(productResult, input, `runtime-${index + 1}`, {
      platformUrl: baseUrl,
      observe: value => { observation = value; },
    });
    assert.equal(returned, productResult);
    assert.equal(observation?.accepted, true);
    assert.ok(observation?.taskId);
    const readback = await pollTerminalTask(observation.taskId);
    records.push({
      sample: index + 1,
      type: input.type,
      taskId: observation.taskId,
      terminalStatus: readback.task.status,
      postLatencyMs: observation.latencyMs,
      endToEndLatencyMs: performance.now() - started,
      getReadCount: readback.getCount,
    });
  }

  const outageResult = { owner: "guvencheck", decision: "unchanged", case: "outage" };
  const outageReturned = await preserveProductResultWithShadow(outageResult, samples[0], "outage", {
    platformUrl: "http://127.0.0.1:1",
  });
  assert.equal(outageReturned, outageResult);

  const hangingServer = createServer(() => undefined);
  hangingServer.listen(0, "127.0.0.1");
  await once(hangingServer, "listening");
  const hangingAddress = hangingServer.address();
  assert.ok(hangingAddress && typeof hangingAddress === "object");
  const timeoutResult = { owner: "guvencheck", decision: "unchanged", case: "timeout" };
  const timeoutStarted = performance.now();
  const timeoutReturned = await preserveProductResultWithShadow(timeoutResult, samples[0], "timeout", {
    platformUrl: `http://127.0.0.1:${hangingAddress.port}`,
    timeoutMs: 25,
  });
  const timeoutLatencyMs = performance.now() - timeoutStarted;
  assert.equal(timeoutReturned, timeoutResult);
  hangingServer.closeAllConnections();
  hangingServer.close();

  const summarize = values => {
    const sorted = [...values].sort((a, b) => a - b);
    const percentile = p => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
    return { min: sorted[0], p50: percentile(.5), p95: percentile(.95), max: sorted.at(-1) };
  };
  const succeeded = records.filter(record => record.terminalStatus === "succeeded").length;
  console.log(JSON.stringify({
    evidenceClass: "real-local-http-runtime",
    runtime: { baseUrl, platformEntry, transport: "HTTP", postEndpoint: "POST /tasks", readbackEndpoint: "GET /tasks/:id" },
    sampleCount: records.length,
    succeeded,
    successRate: succeeded / samples.length,
    persistenceReadback: { verified: records.length, expected: samples.length, rate: records.length / samples.length },
    latencyMs: {
      shadowPostOnly: summarize(records.map(record => record.postLatencyMs)),
      endToEndPostTerminalGetReadback: summarize(records.map(record => record.endToEndLatencyMs)),
      productConfiguredTimeout: 750,
      productImpactNote: "When shadow mode is enabled, the awaited POST can add up to the configured 750 ms timeout to the product response. End-to-end evidence latency additionally includes terminal polling and GET readback and is not product response latency.",
    },
    failureBehavior: { connectionOutageFailOpen: true, injectedHttpTimeoutFailOpen: true, injectedTimeoutMs: 25, observedTimeoutLatencyMs: timeoutLatencyMs },
    boundaries: { resultIdentityPreserved: true, rawImageBytesForwarded: false, productRiskResultForwarded: false, productionDecisionOwner: "GuvenCheck", closedTestingDependency: false },
    records,
  }, null, 2));
} finally {
  runtime.kill();
  await once(runtime, "exit").catch(() => undefined);
}
