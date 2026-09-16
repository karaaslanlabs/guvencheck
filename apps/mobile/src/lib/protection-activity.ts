import type { LiveGuardAssessment, LiveGuardDecision, LiveGuardReason } from './live-guard-policy.ts';

export type ProtectionActivityEntry = {
  id: string;
  checkedAt: string;
  decision: LiveGuardDecision;
  confidence: 'low' | 'medium' | 'high';
  reasonCodes: LiveGuardReason[];
  sourcePackage?: string;
};

export type ProtectionActivitySummary = {
  checked: number;
  warnings: number;
  reviews: number;
  quietPasses: number;
  lastCheckedAt?: string;
};

function safePackage(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim().slice(0, 180);
  return /^[a-zA-Z0-9._-]+$/.test(cleaned) ? cleaned : undefined;
}
export function createProtectionActivityEntry(input: {
  id: string;
  checkedAt: string;
  assessment: LiveGuardAssessment;
  sourcePackage?: unknown;
}): ProtectionActivityEntry | null {
  const checkedAt = new Date(input.checkedAt);
  if (!input.id.trim() || Number.isNaN(checkedAt.getTime())) return null;

  return {
    id: input.id.trim().slice(0, 120),
    checkedAt: checkedAt.toISOString(),
    decision: input.assessment.decision,
    confidence: input.assessment.confidence,
    reasonCodes: [...input.assessment.reasonCodes].slice(0, 8),
    sourcePackage: safePackage(input.sourcePackage),
  };
}

export function summarizeProtectionActivity(
  entries: readonly ProtectionActivityEntry[],
): ProtectionActivitySummary {
  const ordered = [...entries].sort((a, b) => Date.parse(b.checkedAt) - Date.parse(a.checkedAt));
  return {
    checked: entries.length,
    warnings: entries.filter((entry) => entry.decision === 'warn').length,
    reviews: entries.filter((entry) => entry.decision === 'review').length,
    quietPasses: entries.filter((entry) => entry.decision === 'ignore').length,
    lastCheckedAt: ordered[0]?.checkedAt,
  };
}
