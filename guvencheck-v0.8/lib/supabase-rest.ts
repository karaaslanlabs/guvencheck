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
