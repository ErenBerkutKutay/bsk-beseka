import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.includes("/admin");
  const isAdminLogin = pathname.includes("/admin/giris");
  const isB2BProtected =
    pathname.includes("/b2b/dashboard") || pathname.includes("/b2b/siparisler");

  if (isAdminRoute && !isAdminLogin) {
    if (!req.auth?.user || req.auth.user.role !== "ADMIN") {
      const locale = pathname.split("/")[1] || "tr";
      return NextResponse.redirect(new URL(`/${locale}/admin/giris`, req.url));
    }
  }

  if (isB2BProtected) {
    if (!req.auth?.user) {
      const locale = pathname.split("/")[1] || "tr";
      return NextResponse.redirect(new URL(`/${locale}/b2b`, req.url));
    }
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
