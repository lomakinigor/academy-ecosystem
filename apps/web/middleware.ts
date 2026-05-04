import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { matchRule, hasRoleAtLeast } from "@/lib/auth/rbac";

export default auth((req: NextRequest & { auth: import("next-auth").Session | null }) => {
  const { pathname, search } = req.nextUrl;
  const rule = matchRule(pathname);
  if (!rule) return NextResponse.next();

  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (!hasRoleAtLeast(session.user, rule.minRole)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/director/:path*", "/network/:path*", "/student/:path*"],
};
