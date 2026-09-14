import { NextResponse } from "next/server";
import { analyticsConfigured } from "../../../lib/supabase-rest";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    analyticsConfigured: analyticsConfigured(),
    reuseConfigured: Boolean(process.env.ANALYSIS_REUSE_SECRET?.trim() && process.env.ANALYSIS_REUSE_SECRET.trim().length >= 16),
    version: "0.8.3"
  }, { headers: { "Cache-Control": "no-store" } });
}
