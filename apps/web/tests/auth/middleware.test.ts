import { describe, it, expect, vi } from "vitest";

// next-auth's `auth(handler)` higher-order wrapper — replace with identity so we
// can import middleware.ts in a Node test env without booting the full auth stack.
vi.mock("@/auth", () => ({
  auth: (handler: unknown) => handler,
}));

import middleware, { config } from "@/middleware";

describe("middleware module — smoke", () => {
  it("exports a default handler function", () => {
    expect(typeof middleware).toBe("function");
  });

  it("guards exactly the four protected route trees", () => {
    expect(config.matcher).toEqual([
      "/admin/:path*",
      "/director/:path*",
      "/network/:path*",
      "/student/:path*",
    ]);
  });

  it("matcher does not include public surfaces (login, unauthorized, api/auth)", () => {
    const joined = config.matcher.join("|");
    expect(joined).not.toMatch(/\/login/);
    expect(joined).not.toMatch(/\/unauthorized/);
    expect(joined).not.toMatch(/\/api\/auth/);
  });

  it("each matcher entry uses the :path* wildcard, never a bare prefix", () => {
    for (const pattern of config.matcher) {
      expect(pattern).toMatch(/:path\*$/);
    }
  });
});
