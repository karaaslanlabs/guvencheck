export const MANIPULATION_TACTICS = [
  "urgency_time_pressure",
  "authority_impersonation",
  "scarcity_too_good_to_be_true",
  "secrecy_isolation",
  "emotional_leverage",
  "trust_building_social_engineering",
  "payment_channel_redirection",
] as const;

export type ManipulationTactic = (typeof MANIPULATION_TACTICS)[number];

export const MANIPULATION_LABELS: Record<ManipulationTactic, string> = {
  urgency_time_pressure: "Aciliyet / zaman baskısı",
  authority_impersonation: "Otorite / kurum taklidi",
  scarcity_too_good_to_be_true: "Kıtlık / aşırı cazip fırsat",
  secrecy_isolation: "Gizlilik / yalnızlaştırma",
  emotional_leverage: "Duygusal baskı",
  trust_building_social_engineering: "Güven kurma / sosyal mühendislik",
  payment_channel_redirection: "Ödeme / kanal yönlendirme",
};

export function sanitizeManipulationTactics(value: unknown): ManipulationTactic[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(MANIPULATION_TACTICS);
  return Array.from(new Set(value.filter((item): item is ManipulationTactic => typeof item === "string" && allowed.has(item)))).slice(0, 4);
}