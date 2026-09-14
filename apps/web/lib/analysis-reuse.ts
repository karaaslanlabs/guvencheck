import { createHmac } from 'node:crypto';

export const ANALYSIS_CONTRACT_VERSION = 'm3.2-2026-09-14.1';

const TRACKING_PARAMS = new Set([
  'fbclid', 'gclid', 'dclid', 'msclkid', 'mc_cid', 'mc_eid',
]);

export function canonicalizeLinkForReuse(value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    return url.toString();
  } catch {
    return null;
  }
}

export function createReuseFingerprint(value: string, secret: string) {
  const canonical = canonicalizeLinkForReuse(value);
  if (!canonical || secret.length < 16) return null;
  return createHmac('sha256', secret)
    .update(`${ANALYSIS_CONTRACT_VERSION}|link|${canonical}`)
    .digest('hex');
}

export function linkReuseTtlMs(result: any) {
  const level = result?.level;
  const webVerified = result?.webVerified === true || result?.verificationStatus === 'checked_no_strong_signal';
  if (level === 'high') return 7 * 24 * 60 * 60 * 1000;
  if (level === 'medium') return 12 * 60 * 60 * 1000;
  if (level === 'low' && webVerified) return 60 * 60 * 1000;
  return 0;
}

export function prepareResultForReuse(result: any) {
  if (!result || typeof result !== 'object') return null;
  const copy = JSON.parse(JSON.stringify(result));
  delete copy.requestId;
  delete copy.meta;
  delete copy.extractedUrls;
  return copy;
}

export function reuseAgeSeconds(createdAt: string | undefined, nowMs = Date.now()) {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime()) || created.getTime() > nowMs) return null;
  return Math.max(0, Math.round((nowMs - created.getTime()) / 1000));
}

export function directionalAvoidedCost(value: unknown) {
  const cost = Number(value);
  return Number.isFinite(cost) && cost >= 0 && cost <= 100 ? Number(cost.toFixed(6)) : null;
}
