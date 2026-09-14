export const TELEMETRY_EVENTS = [
  "page_view", "analysis_started", "analysis_completed", "analysis_error",
  "share_clicked", "privacy_view",
  "protection_candidate_eligible", "protection_save_intent", "protection_saved",
  "protection_removed", "protection_status_view", "protection_event_useful", "repeat_protection",
  "deep_verification_eligible", "deep_verification_interest", "trusted_helper_share",
  "core_decision_value", "payer_role", "payment_interest",
] as const;

export type TelemetryEvent = (typeof TELEMETRY_EVENTS)[number];

const TELEMETRY_EVENT_SET = new Set<string>(TELEMETRY_EVENTS);

export function isTelemetryEvent(value: unknown): value is TelemetryEvent {
  return typeof value === "string" && TELEMETRY_EVENT_SET.has(value);
}
