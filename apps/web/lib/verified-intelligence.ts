export type CuratedIntelligenceRecord = {
  id: string;
  match: { kind: 'exact_url' | 'domain'; value: string };
  verifiedAt: string;
  expiresAt: string;
  provenance: string;
  result: Record<string, unknown>;
};

// Founder-reviewed records can be added here without changing routing logic.
// Empty by default: never invent intelligence merely to create a cache hit.
export const CURATED_INTELLIGENCE: CuratedIntelligenceRecord[] = [];

function usableResult(result: Record<string, unknown>) {
  return typeof result.score === 'number'
    && ['low', 'medium', 'high'].includes(String(result.level))
    && Array.isArray(result.signals)
    && Array.isArray(result.actions)
    && typeof result.summary === 'string';
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    return url;
  } catch {
    return null;
  }
}

export function lookupCuratedIntelligence(
  value: string,
  records = CURATED_INTELLIGENCE,
  now = new Date(),
) {
  const url = normalizeUrl(value);
  if (!url) return null;

  for (const record of records) {
    const verified = new Date(record.verifiedAt);
    const expires = new Date(record.expiresAt);
    if (!record.id.trim() || !record.provenance.trim() || !usableResult(record.result)) continue;
    if (Number.isNaN(verified.getTime()) || verified > now) continue;
    if (Number.isNaN(expires.getTime()) || expires <= now || expires <= verified) continue;

    if (record.match.kind === 'exact_url') {
      const target = normalizeUrl(record.match.value);
      if (target && target.toString() === url.toString()) return record;
    }

    if (record.match.kind === 'domain') {
      const domain = record.match.value.toLowerCase().replace(/^www\./, '');
      const host = url.hostname.replace(/^www\./, '');
      if (host === domain || host.endsWith(`.${domain}`)) return record;
    }
  }

  return null;
}
