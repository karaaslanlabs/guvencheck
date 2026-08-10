import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/lab")) return NextResponse.next();

  const expected = process.env.LAB_ACCESS_KEY?.trim();
  if (!expected) {
    // Lab is closed by default in production unless an access key is configured.
    return new NextResponse("Not Found", { status: 404 });
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const separator = decoded.indexOf(":");
      const password = separator >= 0 ? decoded.slice(separator + 1) : "";
      if (password === expected) return NextResponse.next();
    } catch {
      // fall through to challenge
    }
  }

  return new NextResponse("GüvenCheck Lab erişimi gerekiyor.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="GüvenCheck Lab", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/lab/:path*"],
};
