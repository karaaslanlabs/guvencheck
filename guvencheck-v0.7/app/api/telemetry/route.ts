import { NextRequest, NextResponse } from "next/server";

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
      route: typeof body.route === "string" ? body.route.slice(0,80) : undefined,
      latencyMs: typeof body.latencyMs === "number" ? Math.max(0,Math.round(body.latencyMs)) : undefined,
      at: new Date().toISOString()
    };
    // İçerik, URL, telefon numarası veya görsel verisi loglanmaz.
    console.info("GUVENCHECK_EVENT", JSON.stringify(event));
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Olay kaydedilemedi." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
