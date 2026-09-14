import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeRevenueEvidence } from "../lib/revenue-evidence.ts";

test("accepts bounded payer roles and payment interest", () => {
  assert.equal(sanitizeRevenueEvidence("payer_role", "self"), "self");
  assert.equal(sanitizeRevenueEvidence("payer_role", "family"), "family");
  assert.equal(sanitizeRevenueEvidence("payment_interest", "maybe"), "maybe");
});

test("rejects unexpected revenue evidence values", () => {
  assert.equal(sanitizeRevenueEvidence("payer_role", "other"), null);
  assert.equal(sanitizeRevenueEvidence("payment_interest", "price_9_99"), null);
  assert.equal(sanitizeRevenueEvidence("core_decision_value", undefined), undefined);
});
