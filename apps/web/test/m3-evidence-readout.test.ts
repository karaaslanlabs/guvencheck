import assert from "node:assert/strict";
import test from "node:test";
import { summarizeM3Evidence } from "../lib/m3-evidence-readout.ts";
import type { BetaEventRow } from "../lib/supabase-rest.ts";

const row = (event_type: string, analysis_request_id: string, event_value?: string): BetaEventRow => ({
  event_type,
  analysis_request_id,
  event_value,
});

test("summarizes request-linked M3.2 evidence without double-counting repeat views", () => {
  const rows = [
    row("protection_candidate_eligible", "a1"), row("protection_saved", "a1"),
    row("protection_action_due_view", "a1"), row("protection_action_due_view", "a1"),
    row("protection_event_useful", "a1"), row("deep_verification_eligible", "d1"),
    row("deep_verification_interest", "d1"), row("payer_role", "d1", "self"),
    row("payment_interest", "d1", "yes"), row("payment_interest", "d1", "no"),
    row("payer_role", "d1", "family"), row("trusted_helper_share", "d1"),
  ];
  const result = summarizeM3Evidence(rows);
  assert.equal(result.protectionEligible, 1);
  assert.equal(result.protectionSaved, 1);
  assert.equal(result.protectionDueViews, 1);
  assert.equal(result.protectionUseful, 1);
  assert.equal(result.deepEligible, 1);
  assert.equal(result.deepInterested, 1);
  assert.deepEqual(result.paymentInterest, { yes: 1 });
  assert.deepEqual(result.payerRoles, { self: 1 });
});

test("summarizes reuse evidence and ignores malformed avoided-cost values", () => {
  const rows = [
    row("analysis_reuse_miss", "r1", "{}"),
    row("analysis_reuse_hit", "r2", JSON.stringify({ avoidedCostUsd: 0.125303 })),
    row("analysis_reuse_hit", "r2", JSON.stringify({ avoidedCostUsd: 0.125303 })),
    row("analysis_reuse_hit", "r3", "not-json"),
    row("curated_intelligence_hit", "c1", "{}"),
  ];
  const result = summarizeM3Evidence(rows);
  assert.equal(result.reuseMisses, 1);
  assert.equal(result.reuseHits, 2);
  assert.equal(result.curatedHits, 1);
  assert.equal(result.avoidedCostUsd, 0.125303);
});
