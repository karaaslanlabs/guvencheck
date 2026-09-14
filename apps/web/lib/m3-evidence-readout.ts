import type { BetaEventRow } from "./supabase-rest";

function rowsOf(rows: BetaEventRow[], eventType: string) {
  return rows.filter((row) => row.event_type === eventType);
}

function uniqueRequestCount(rows: BetaEventRow[], eventType: string) {
  return new Set(rowsOf(rows, eventType).map((row) => row.analysis_request_id).filter(Boolean)).size;
}

function valueCounts(rows: BetaEventRow[], eventType: string) {
  const out: Record<string, number> = {};
  const seen = new Set<string>();
  for (const row of rowsOf(rows, eventType)) {
    const requestId = row.analysis_request_id;
    if (!requestId || seen.has(requestId) || !row.event_value) continue;
    seen.add(requestId);
    out[row.event_value] = (out[row.event_value] || 0) + 1;
  }
  return out;
}

function avoidedCostUsd(rows: BetaEventRow[]) {
  let total = 0;
  const seen = new Set<string>();
  for (const row of rowsOf(rows, "analysis_reuse_hit")) {
    const requestId = row.analysis_request_id;
    if (!requestId || seen.has(requestId)) continue;
    seen.add(requestId);
    try {
      const parsed = JSON.parse(row.event_value || "{}") as { avoidedCostUsd?: unknown };
      const value = Number(parsed.avoidedCostUsd);
      if (Number.isFinite(value) && value >= 0 && value <= 100) total += value;
    } catch { /* malformed evidence is ignored */ }
  }
  return Number(total.toFixed(6));
}

export function summarizeM3Evidence(rows: BetaEventRow[]) {
  return {
    coreDecisionValue: uniqueRequestCount(rows, "core_decision_value"),
    protectionEligible: uniqueRequestCount(rows, "protection_candidate_eligible"),
    protectionSaved: uniqueRequestCount(rows, "protection_saved"),
    protectionDueViews: uniqueRequestCount(rows, "protection_action_due_view"),
    protectionUseful: uniqueRequestCount(rows, "protection_event_useful"),
    repeatProtection: uniqueRequestCount(rows, "repeat_protection"),
    deepEligible: uniqueRequestCount(rows, "deep_verification_eligible"),
    deepInterested: uniqueRequestCount(rows, "deep_verification_interest"),
    trustedHelperShares: uniqueRequestCount(rows, "trusted_helper_share"),
    payerRoles: valueCounts(rows, "payer_role"),
    paymentInterest: valueCounts(rows, "payment_interest"),
    reuseHits: uniqueRequestCount(rows, "analysis_reuse_hit"),
    reuseMisses: uniqueRequestCount(rows, "analysis_reuse_miss"),
    curatedHits: uniqueRequestCount(rows, "curated_intelligence_hit"),
    avoidedCostUsd: avoidedCostUsd(rows),
  };
}
