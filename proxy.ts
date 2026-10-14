import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";
import { isAuthStub } from "./lib/auth";

const PUBLIC_PATHS = new Set(["/", "/favicon.ico"]);

export async function proxy(request: NextRequest) {
  if (isAuthStub()) {
    return NextResponse.next();
  }

  const authRes = await auth0.middleware(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/auth")) {
    return authRes;
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return authRes;
  }

  const session = await auth0.getSession(request);
  const needsAuth = pathname.startsWith("/play") || pathname.startsWith("/api/runs");

  if (needsAuth && !session) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("returnTo", pathname.startsWith("/api") ? "/play" : pathname);
    return NextResponse.redirect(login);
  }

  return authRes;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
