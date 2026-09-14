export const REVENUE_EVIDENCE_EVENTS = [
  'core_decision_value',
  'payer_role',
  'payment_interest',
] as const;

export type RevenueEvidenceEvent = (typeof REVENUE_EVIDENCE_EVENTS)[number];

const PAYER_ROLES = new Set(['self', 'family', 'work']);
const PAYMENT_INTEREST = new Set(['yes', 'maybe', 'no']);

export function sanitizeRevenueEvidence(event: string, value: unknown): string | null | undefined {
  if (event === 'core_decision_value') return undefined;
  if (event === 'payer_role') {
    return typeof value === 'string' && PAYER_ROLES.has(value) ? value : null;
  }
  if (event === 'payment_interest') {
    return typeof value === 'string' && PAYMENT_INTEREST.has(value) ? value : null;
  }
  return undefined;
}

export function sanitizeAnalysisRequestId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return /^[A-Za-z0-9_-]{4,64}$/.test(trimmed) ? trimmed : undefined;
}
