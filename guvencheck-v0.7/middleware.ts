import { NextRequest, NextResponse } from "next/server";

function basicPassword(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(auth.slice(6));
    const separator = decoded.indexOf(":");
    return separator >= 0 ? decoded.slice(separator + 1) : "";
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/lab")) {
    const expected = process.env.LAB_ACCESS_KEY?.trim();
    if (!expected) return new NextResponse("Not Found", { status: 404 });
    if (basicPassword(request) === expected) return NextResponse.next();
    return new NextResponse("GüvenCheck Lab erişimi gerekiyor.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="GüvenCheck Lab", charset="UTF-8"', "Cache-Control": "no-store" } });
  }

  // İsteğe bağlı kapalı-beta kapısı. Anahtar tanımlanmazsa site normal çalışır.
  const betaKey = process.env.BETA_ACCESS_KEY?.trim();
  const publicPath = pathname === "/privacy" || pathname.startsWith("/api/health") || pathname.startsWith("/_next") || pathname === "/icon.svg" || pathname === "/manifest.webmanifest";
  if (betaKey && !publicPath) {
    if (basicPassword(request) === betaKey) return NextResponse.next();
    return new NextResponse("GüvenCheck Kapalı Beta", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="GüvenCheck Kapalı Beta", charset="UTF-8"', "Cache-Control": "no-store" } });
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!favicon.ico).*)"] };
