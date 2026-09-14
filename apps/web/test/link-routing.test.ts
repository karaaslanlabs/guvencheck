import assert from "node:assert/strict";
import test from "node:test";
import { linkEscalationReasons } from "../lib/link-routing.ts";

const cleanFacts = {
  hasUserInfo: false,
  hasPunycode: false,
  isIpHost: false,
  nonStandardPort: false,
  subdomainLabels: 0,
  queryParamCount: 0,
  pathLength: 1,
};

test("clear high-confidence links stay on fast path", () => {
  assert.deepEqual(linkEscalationReasons({ score: 12, confidence: "high" }, cleanFacts), []);
});

test("uncertain links escalate", () => {
  assert.ok(linkEscalationReasons({ score: 48, confidence: "high" }, cleanFacts).includes("gray_zone_score"));
  assert.ok(linkEscalationReasons({ score: 10, confidence: "low" }, cleanFacts).includes("low_confidence"));
});

test("strong deterministic URL anomalies force review unless already clearly high risk", () => {
  const anomalous = { ...cleanFacts, hasPunycode: true };
  assert.ok(linkEscalationReasons({ score: 10, confidence: "high" }, anomalous).includes("deterministic_url_anomaly"));
  assert.deepEqual(linkEscalationReasons({ score: 90, confidence: "high" }, anomalous), []);
});
