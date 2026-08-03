import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "locale";
const supportedLocales = ["en", "ar"];

function parseAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [lang] = trimmed.split(";q=");
    if (!lang) continue;
    const code = lang.split("-")[0]?.toLowerCase() ?? "";
    if (supportedLocales.includes(code)) return code;
  }
  return null;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const hasLocaleCookie = request.cookies.has(COOKIE_NAME);
  if (!hasLocaleCookie) {
    const acceptLang = request.headers.get("Accept-Language") ?? request.headers.get("accept-language");
    const detected = parseAcceptLanguage(acceptLang);
    if (detected) {
      response.cookies.set(COOKIE_NAME, detected, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|robots.txt).*)",
  ],
};
