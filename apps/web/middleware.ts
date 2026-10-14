import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent, NextMiddleware } from "next/server";

import { auth } from "@/auth";
import { matchRule, hasRoleAtLeast } from "@/lib/auth/rbac";

const authenticatedMiddleware = auth(
  (req: NextRequest & { auth: import("next-auth").Session | null }) => {
    const { pathname, search } = req.nextUrl;
    const rule = matchRule(pathname);
    if (!rule) return NextResponse.next();

    const session = req.auth;

    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    // В /admin актуальные права из БД проверяет server layout и каждый API-запрос.
    // JWT может ещё содержать роль до назначения/снятия администратором.
    const adminTree = pathname === "/admin" || pathname.startsWith("/admin/");
    if (!adminTree && !hasRoleAtLeast(session.user, rule.minRole)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
);

// Auth.js beta lazy config wraps middleware asynchronously.
export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const handler = (await authenticatedMiddleware) as unknown as NextMiddleware;
  return handler(request, event);
}

export const config = {
  matcher: ["/admin/:path*", "/director/:path*", "/network/:path*", "/student/:path*"],
};
