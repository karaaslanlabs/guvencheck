import { NextResponse } from "next/server";
import { analyticsConfigured } from "../../../lib/supabase-rest";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    analyticsConfigured: analyticsConfigured(),
    version: "0.7.2"
  }, { headers: { "Cache-Control": "no-store" } });
}
