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

function requireBasic(request: NextRequest, expected: string | undefined, realm: string) {
  const key = expected?.trim();
  if (!key) return new NextResponse("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (basicPassword(request) === key) return NextResponse.next();
  return new NextResponse(`${realm} eriÅŸimi gerekiyor.`, {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"`, "Cache-Control": "no-store" }
  });
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/lab")) return requireBasic(request, process.env.LAB_ACCESS_KEY, "GÃ¼venCheck Lab");
  if (pathname.startsWith("/admin")) return requireBasic(request, process.env.ADMIN_ACCESS_KEY, "GÃ¼venCheck Admin");

  // Ä°steÄŸe baÄŸlÄ± kapalÄ±-beta kapÄ±sÄ±. Anahtar tanÄ±mlanmazsa site normal Ã§alÄ±ÅŸÄ±r.
  const betaKey = process.env.BETA_ACCESS_KEY?.trim();
  const publicPath = pathname === "/privacy" || pathname.startsWith("/api/health") || pathname.startsWith("/_next") || pathname === "/icon.svg" || pathname === "/manifest.webmanifest";
  if (betaKey && !publicPath) {
    if (basicPassword(request) === betaKey) return NextResponse.next();
    return new NextResponse("GÃ¼venCheck KapalÄ± Beta", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="GÃ¼venCheck KapalÄ± Beta", charset="UTF-8"', "Cache-Control": "no-store" } });
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!favicon.ico).*)"] };

