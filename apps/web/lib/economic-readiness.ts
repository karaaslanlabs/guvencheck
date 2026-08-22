import { analyticsConfigured, estimatedSpendSince, insertEconomicEvent, type EconomicEventRow } from "./supabase-rest";

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
const SPEND_WARNING_RATIO = 0.8;

export function aiAnalysisEnabled() {
  const raw = process.env.AI_ANALYSIS_ENABLED?.trim().toLowerCase();
  return !raw || !["0", "false", "off", "no"].includes(raw);
}

export function configuredDailyCostLimitUsd(): number | null {
  const raw = process.env.AI_DAILY_ESTIMATED_COST_LIMIT_USD?.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function istanbulDayStartIso(now = new Date()) {
  const shifted = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - ISTANBUL_OFFSET_MS).toISOString();
}

export type EconomicGate = {
  allowed: boolean;
  reason?: "disabled" | "spend_limit" | "telemetry_unavailable";
  dailySpendUsd?: number;
  dailyLimitUsd?: number;
  approachingLimit?: boolean;
};

export async function checkEconomicGate(): Promise<EconomicGate> {
  if (!aiAnalysisEnabled()) return { allowed: false, reason: "disabled" };

  const limit = configuredDailyCostLimitUsd();
  if (!limit) return { allowed: true };

  // A configured spend ceiling is fail-safe: if persistent telemetry cannot be
  // read, new paid AI calls are blocked rather than spending blindly.
  if (!analyticsConfigured()) {
    return { allowed: false, reason: "telemetry_unavailable", dailyLimitUsd: limit };
  }

  try {
    const spent = await estimatedSpendSince(istanbulDayStartIso());
    if (spent >= limit) {
      return { allowed: false, reason: "spend_limit", dailySpendUsd: spent, dailyLimitUsd: limit };
    }
    return {
      allowed: true,
      dailySpendUsd: spent,
      dailyLimitUsd: limit,
      approachingLimit: spent >= limit * SPEND_WARNING_RATIO
    };
  } catch (error) {
    console.error("GUVENCHECK_ECONOMIC_GATE_READ_FAILED", error);
    return { allowed: false, reason: "telemetry_unavailable", dailyLimitUsd: limit };
  }
}

export async function persistEconomicEvent(row: EconomicEventRow) {
  if (!analyticsConfigured()) {
    console.error("GUVENCHECK_ECONOMIC_EVENT_NOT_PERSISTED", "Supabase analytics is not configured", row.analysis_request_id);
    return false;
  }

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await insertEconomicEvent(row);
      return true;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  console.error("GUVENCHECK_ECONOMIC_EVENT_PERSIST_FAILED", row.analysis_request_id, lastError);
  return false;
}
