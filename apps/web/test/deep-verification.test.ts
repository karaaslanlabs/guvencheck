import assert from "node:assert/strict";
import test from "node:test";
import { deriveDeepVerification } from "../lib/deep-verification.ts";

test("offers deep verification only when uncertainty can matter", () => {
  const eligible = deriveDeepVerification({ level: "high", confidence: "low", verificationStatus: "not_checked" });
  assert.equal(eligible.eligible, true);
  assert.match(eligible.reason, /belirsizlik|kanıt/i);
});

test("does not upsell low-risk or already-clear cases", () => {
  assert.equal(deriveDeepVerification({ level: "low", confidence: "low", verificationStatus: "not_checked" }).eligible, false);
  assert.equal(deriveDeepVerification({
    level: "high",
    confidence: "high",
    verificationStatus: "checked_risk_signals",
    decisionSupport: { uncertainty: "low" },
  }).eligible, false);
});
