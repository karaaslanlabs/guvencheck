import { readAnalysisReuse, upsertAnalysisReuse } from './supabase-rest';
import { ANALYSIS_CONTRACT_VERSION, createReuseFingerprint, linkReuseTtlMs, prepareResultForReuse } from './analysis-reuse';

function secret() {
  return process.env.ANALYSIS_REUSE_SECRET?.trim() || '';
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
      result_json: reusable,
    });
    return true;
  } catch (error) {
    console.warn('GUVENCHECK_REUSE_STORE_SKIPPED', error instanceof Error ? error.message : String(error));
    return false;
  }
}
