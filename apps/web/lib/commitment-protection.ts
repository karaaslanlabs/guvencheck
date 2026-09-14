export const PROTECTION_KINDS = [
  "none",
  "trial",
  "subscription",
  "commitment",
  "purchase",
  "deadline",
] as const;

export type ProtectionKind = (typeof PROTECTION_KINDS)[number];

export type ProtectionCandidate = {
  eligible: boolean;
  kind: ProtectionKind;
  title: string;
  provider: string;
  deadline: string;
  nextAction: string;
  summary: string;
};

export type ProtectionObject = ProtectionCandidate & {
  id: string;
  savedAt: string;
};

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function validIsoDate(value: unknown) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const parsed = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text ? "" : text;
}
export function sanitizeProtectionCandidate(value: unknown): ProtectionCandidate {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const kind = PROTECTION_KINDS.includes(raw.kind as ProtectionKind)
    ? (raw.kind as ProtectionKind)
    : "none";
  const deadline = validIsoDate(raw.deadline);
  const candidate = {
    eligible: raw.eligible === true,
    kind,
    title: cleanText(raw.title, 120),
    provider: cleanText(raw.provider, 100),
    deadline,
    nextAction: cleanText(raw.nextAction, 220),
    summary: cleanText(raw.summary, 300),
  };
  if (!candidate.eligible || candidate.kind === "none" || !candidate.nextAction || !candidate.summary) {
    return { eligible: false, kind: "none", title: "", provider: "", deadline: "", nextAction: "", summary: "" };
  }
  return candidate;
}
