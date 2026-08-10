import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type FeedbackBody = {
  helpful: boolean;
  reason?: string;
  analysisType?: "text" | "link" | "image";
  score?: number;
  level?: "low" | "medium" | "high";
  route?: string;
  requestId?: string;
};

const allowedReasons = new Set(["dogru", "fazla_supheci", "riski_az_gosterdi", "anlasilmadi", "diger"]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FeedbackBody;
    if (typeof body?.helpful !== "boolean") {
      return NextResponse.json({ error: "Geçersiz geri bildirim." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const event = {
      event: "analysis_feedback",
      helpful: body.helpful,
      reason: allowedReasons.has(body.reason || "") ? body.reason : undefined,
      analysisType: body.analysisType,
      score: typeof body.score === "number" ? Math.max(0, Math.min(100, Math.round(body.score))) : undefined,
      level: body.level,
      route: typeof body.route === "string" ? body.route.slice(0, 80) : undefined,
      analysisRequestId: typeof body.requestId === "string" ? body.requestId.slice(0, 32) : undefined,
      at: new Date().toISOString()
    };

    // Beta aşamasında içerik değil, yalnızca anonim ürün sinyali loglanır.
    console.info("GUVENCHECK_FEEDBACK", JSON.stringify(event));
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Geri bildirim alınamadı." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
