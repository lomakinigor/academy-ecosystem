import { describe, it, expect, vi } from "vitest";
import { appRouter } from "../src/root";
import type { Context } from "../src/context";

const makePrisma = () => ({
  branch: {
    findMany: vi
      .fn()
      .mockResolvedValue([{ id: "b1", name: "Москва", city: "Москва", timezone: "Europe/Moscow" }]),
  },
  event: {
    findMany: vi.fn().mockResolvedValue([]),
  },
});

const makeCtx = (session: Context["session"] = null): Context => ({
  session,
  prisma: makePrisma() as unknown as Context["prisma"],
});

describe("healthRouter.ping", () => {
  it("возвращает ok=true и service=academy-api", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const r = await caller.health.ping();
    expect(r.ok).toBe(true);
    expect(r.service).toBe("academy-api");
    expect(typeof r.timestamp).toBe("string");
  });
});

describe("branchRouter.list", () => {
  it("возвращает филиалы с минимальным select для дропдауна", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const r = await caller.branch.list();
    expect(r).toHaveLength(1);
    expect(ctx.prisma.branch.findMany).toHaveBeenCalledWith({
      orderBy: { city: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        timezone: true,
      },
    });
  });
});
