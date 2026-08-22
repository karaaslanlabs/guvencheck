export type BetaEventRow = {
  id?: number;
  created_at?: string;
  event_type: string;
  session_id?: string | null;
  analysis_type?: "text" | "link" | "image" | null;
  score?: number | null;
  risk_level?: "low" | "medium" | "high" | null;
  model_route?: string | null;
  latency_ms?: number | null;
  helpful?: boolean | null;
  feedback_reason?: string | null;
  analysis_request_id?: string | null;
};

export type EconomicEventRow = {
  id?: number;
  created_at?: string;
  analysis_request_id: string;
  analysis_type?: "text" | "link" | "image" | null;
  provider: string;
  model?: string | null;
  model_route?: string | null;
  input_tokens?: number | null;
  cached_input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  web_search_calls?: number | null;
  estimated_cost_usd?: number | null;
  latency_ms?: number | null;
  success: boolean;
  error_class?: string | null;
};

function config() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  return url && key ? { url, key } : null;
}

export function analyticsConfigured() {
  return Boolean(config());
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const cfg = config();
  if (!cfg) throw new Error("Supabase analytics is not configured");
  const headers = new Headers(init?.headers);
  headers.set("apikey", cfg.key);
  headers.set("Content-Type", "application/json");
  return fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}

export async function insertBetaEvent(row: BetaEventRow) {
  const res = await supabaseFetch("beta_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new Error(`Supabase insert failed (${res.status}): ${detail}`);
  }
}

export async function readBetaEvents(limit = 5000): Promise<BetaEventRow[]> {
  const safeLimit = Math.max(1, Math.min(10000, Math.round(limit)));
  const fields = "id,created_at,event_type,session_id,analysis_type,score,risk_level,model_route,latency_ms,helpful,feedback_reason,analysis_request_id";
  const res = await supabaseFetch(`beta_events?select=${fields}&order=created_at.desc&limit=${safeLimit}`);
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new Error(`Supabase select failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as BetaEventRow[];
}

export async function insertEconomicEvent(row: EconomicEventRow) {
  const res = await supabaseFetch("economic_events", {
    method: "POST",
    headers: { Prefer: "return=minimal,resolution=ignore-duplicates" },
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new Error(`Economic telemetry insert failed (${res.status}): ${detail}`);
  }
}

export async function readEconomicEvents(limit = 10000): Promise<EconomicEventRow[]> {
  const safeLimit = Math.max(1, Math.min(20000, Math.round(limit)));
  const fields = "id,created_at,analysis_request_id,analysis_type,provider,model,model_route,input_tokens,cached_input_tokens,output_tokens,total_tokens,web_search_calls,estimated_cost_usd,latency_ms,success,error_class";
  const res = await supabaseFetch(`economic_events?select=${fields}&order=created_at.desc&limit=${safeLimit}`);
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new Error(`Economic telemetry select failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as EconomicEventRow[];
}

export async function readEconomicEventsSince(sinceIso: string, limit = 10000): Promise<EconomicEventRow[]> {
  const safeLimit = Math.max(1, Math.min(20000, Math.round(limit)));
  const fields = "id,created_at,analysis_request_id,analysis_type,provider,model,model_route,input_tokens,cached_input_tokens,output_tokens,total_tokens,web_search_calls,estimated_cost_usd,latency_ms,success,error_class";
  const encodedSince = encodeURIComponent(sinceIso);
  const res = await supabaseFetch(`economic_events?select=${fields}&created_at=gte.${encodedSince}&order=created_at.desc&limit=${safeLimit}`);
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new Error(`Economic telemetry range select failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as EconomicEventRow[];
}

export async function estimatedSpendSince(sinceIso: string): Promise<number> {
  const rows = await readEconomicEventsSince(sinceIso);
  return Number(rows.reduce((sum, row) => sum + Number(row.estimated_cost_usd || 0), 0).toFixed(6));
}
