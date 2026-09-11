import assert from "node:assert/strict";
import test from "node:test";
import { deriveDecisionSupport, withDecisionSupport } from "../lib/decision-support.ts";

test("high risk becomes a stop-oriented decision implication", () => {
  const result = deriveDecisionSupport({
    level: "high",
    confidence: "high",
    verificationStatus: "checked_risk_signals",
    actions: ["Para gönderme."],
  });
  assert.equal(result.uncertainty, "low");
  assert.match(result.implication, /ilerletme/);
  assert.equal(result.nextAction, "Para gönderme.");
});

test("unverified or low-confidence analysis preserves uncertainty", () => {
  assert.equal(deriveDecisionSupport({ level: "medium", confidence: "high", verificationStatus: "not_checked", actions: [] }).uncertainty, "medium");
  assert.equal(deriveDecisionSupport({ level: "low", confidence: "low", verificationStatus: "checked_no_strong_signal", actions: [] }).uncertainty, "high");
});

test("decision support decorates without changing the existing risk result", () => {
  const original = { level: "low" as const, confidence: "medium" as const, score: 18, actions: ["Resmî kanaldan doğrula."] };
  const decorated = withDecisionSupport(original);
  assert.equal(decorated.score, 18);
  assert.equal(decorated.level, "low");
  assert.equal(decorated.decisionSupport.nextAction, "Resmî kanaldan doğrula.");
});
