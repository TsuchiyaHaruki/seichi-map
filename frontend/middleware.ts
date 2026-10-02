import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * access_token Cookieの有無による画面遷移の補助のみを行う。
 * Cookieの中身(JWT)は検証しない。認証・権限の最終判定は必ずBackend(Spring Security)が行う。
 */
export function middleware(request: NextRequest) {
  if (!request.cookies.has("access_token")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/mypage/:path*", "/spots/new", "/spots/:id/edit", "/admin/:path*"],
};
