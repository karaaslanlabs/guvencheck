import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    version: "0.4.2"
  });
}
