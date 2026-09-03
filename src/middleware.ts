import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const protectedRoutes = ["/", "/chat", "/memories", "/timeline", "/notifications", "/settings", "/couple", "/profile"];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Forward the pathname as a request header so server components (e.g. layout)
  // can read the current route via headers().get("x-pathname").
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (session) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if ((session.user as Record<string, unknown>)?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});


export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)",],
};
