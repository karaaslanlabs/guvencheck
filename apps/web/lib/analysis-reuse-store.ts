import { insertBetaEvent, readAnalysisReuse, upsertAnalysisReuse, type AnalysisReuseRow } from './supabase-rest';
import { ANALYSIS_CONTRACT_VERSION, createReuseFingerprint, directionalAvoidedCost, linkReuseTtlMs, prepareResultForReuse, reuseAgeSeconds, reuseSecretConfigured } from './analysis-reuse';

function secret() {
  return process.env.ANALYSIS_REUSE_SECRET?.trim() || '';
}

export function reuseConfigured() {
  return reuseSecretConfigured(process.env.ANALYSIS_REUSE_SECRET);
}

async function persistReuseEvidence(eventType: string, requestId: string, route: string, value: Record<string, unknown>) {
  try {
    await insertBetaEvent({
      event_type: eventType,
      event_value: JSON.stringify(value).slice(0, 500),
      analysis_type: 'link',
      model_route: route,
      analysis_request_id: requestId,
    });
  } catch (error) {
    console.warn('GUVENCHECK_REUSE_EVIDENCE_SKIPPED', error instanceof Error ? error.message : String(error));
  }
}

export async function lookupReusableLink(value: string) {
  const fingerprint = createReuseFingerprint(value, secret());
  if (!fingerprint) return null;
  try {
    const row = await readAnalysisReuse(fingerprint, ANALYSIS_CONTRACT_VERSION);
    return row ? { ...row, fingerprint } : null;
  } catch (error) {
    console.warn('GUVENCHECK_REUSE_LOOKUP_SKIPPED', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function recordReuseMiss(requestId: string) {
  await persistReuseEvidence('analysis_reuse_miss', requestId, 'link-reuse-miss', { reason: 'no_reusable_result' });
}

export async function recordReuseHit(requestId: string, row: AnalysisReuseRow) {
  await persistReuseEvidence('analysis_reuse_hit', requestId, 'link-reuse', {
    sourceRequestId: row.source_request_id,
    ageSeconds: reuseAgeSeconds(row.created_at),
    avoidedCostUsd: directionalAvoidedCost(row.source_estimated_cost_usd),
  });
}

export async function recordCuratedHit(requestId: string, intelligenceId: string, verifiedAt: string) {
  await persistReuseEvidence('curated_intelligence_hit', requestId, 'curated-intelligence', {
    intelligenceId,
    ageSeconds: reuseAgeSeconds(verifiedAt),
  });
}

export async function storeReusableLink(value: string, result: any, sourceRequestId: string) {
  const fingerprint = createReuseFingerprint(value, secret());
  const ttlMs = linkReuseTtlMs(result);
  const reusable = prepareResultForReuse(result);
  if (!fingerprint || !ttlMs || !reusable) return false;
  try {
    await upsertAnalysisReuse({
      fingerprint,
      contract_version: ANALYSIS_CONTRACT_VERSION,
      source_request_id: sourceRequestId,
      expires_at: new Date(Date.now() + ttlMs).toISOString(),
      risk_level: reusable.level,
      source_estimated_cost_usd: directionalAvoidedCost(result?.meta?.estimatedCostUsd),
      result_json: reusable,
    });
    return true;
  } catch (error) {
    console.warn('GUVENCHECK_REUSE_STORE_SKIPPED', error instanceof Error ? error.message : String(error));
    return false;
  }
}
