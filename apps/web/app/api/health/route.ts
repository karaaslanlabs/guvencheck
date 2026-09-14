import { NextResponse } from "next/server";
import { analyticsConfigured } from "../../../lib/supabase-rest";
import { reuseConfigured } from "../../../lib/analysis-reuse-store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    analyticsConfigured: analyticsConfigured(),
    reuseConfigured: reuseConfigured(),
    version: "0.8.3"
  }, { headers: { "Cache-Control": "no-store" } });
}
