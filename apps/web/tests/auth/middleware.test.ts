import { describe, it, expect, vi } from "vitest";

// Lazy Auth.js beta config returns its wrapper asynchronously, despite the static types.
vi.mock("@/auth", () => ({
  auth: async (handler: unknown) => handler,
}));

import middleware, { config } from "@/middleware";

describe("middleware module — smoke", () => {
  it("admin-layout проверяет актуальную роль, а не отклоняется по старому JWT после назначения", async () => {
    const handler = middleware as unknown as (req: unknown) => Promise<Response>;
    const response = await handler({
      nextUrl: new URL("https://example.test/admin/calendar"),
      url: "https://example.test/admin/calendar",
      auth: { user: { system_role: "STUDENT" } },
    });
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
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
