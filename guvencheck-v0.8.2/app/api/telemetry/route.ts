import { NextRequest, NextResponse } from "next/server";
import { analyticsConfigured, insertBetaEvent } from "../../../lib/supabase-rest";

export const runtime = "nodejs";

const allowedEvents = new Set(["page_view","analysis_started","analysis_completed","analysis_error","share_clicked","privacy_view"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!allowedEvents.has(body?.event)) return NextResponse.json({ error: "Geçersiz olay." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const event = {
      event: body.event,
      sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0,64) : undefined,
      analysisType: ["text","link","image"].includes(body.analysisType) ? body.analysisType : undefined,
      score: typeof body.score === "number" ? Math.max(0,Math.min(100,Math.round(body.score))) : undefined,
      level: ["low","medium","high"].includes(body.level) ? body.level : undefined,
      route: typeof body.route === "string" ? body.route.slice(0,120) : undefined,
      latencyMs: typeof body.latencyMs === "number" ? Math.max(0,Math.round(body.latencyMs)) : undefined,
      at: new Date().toISOString()
    };

    // İçerik, URL, telefon numarası veya görsel verisi hiçbir zaman analytics tablosuna yazılmaz.
    console.info("GUVENCHECK_EVENT", JSON.stringify(event));
    if (analyticsConfigured()) {
      try {
        await insertBetaEvent({
          event_type: event.event,
          session_id: event.sessionId,
          analysis_type: event.analysisType,
          score: event.score,
          risk_level: event.level,
          model_route: event.route,
          latency_ms: event.latencyMs
        });
      } catch (error) {
        console.error("GUVENCHECK_ANALYTICS_WRITE_ERROR", error instanceof Error ? error.message : String(error));
      }
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Olay kaydedilemedi." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
