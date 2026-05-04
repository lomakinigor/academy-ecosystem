import { describe, it, expect, vi } from "vitest";
import { appRouter } from "../src/root";
import type { Context } from "../src/context";

const makePrisma = () => ({
  branch: {
    findMany: vi.fn().mockResolvedValue([{ id: "b1", city: "Москва" }]),
  },
  event: {
    findMany: vi.fn().mockResolvedValue([
      {
        id: "e1",
        title: "Тест",
        start_at: new Date(),
        branch: { id: "b1" },
        speaker: { id: "u1", name: "Спикер" },
      },
    ]),
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
  it("сортирует филиалы по city ASC", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const r = await caller.branch.list();
    expect(r).toHaveLength(1);
    expect(ctx.prisma.branch.findMany).toHaveBeenCalledWith({
      orderBy: { city: "asc" },
    });
  });
});

describe("eventRouter.list", () => {
  it("возвращает события, отсортированные по start_at ASC, лимит 50, со связями", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const r = await caller.event.list();
    expect(r).toHaveLength(1);
    expect(ctx.prisma.event.findMany).toHaveBeenCalledWith({
      orderBy: { start_at: "asc" },
      take: 50,
      include: {
        branch: true,
        speaker: { select: { id: true, name: true } },
      },
    });
  });
});
