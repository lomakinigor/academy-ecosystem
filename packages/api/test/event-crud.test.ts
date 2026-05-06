import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../src/root";
import { canAuthorEvents, canWriteToBranch, resolveBranchId } from "../src/routers/event";
import type { Context, SessionUser } from "../src/context";
import type { BranchScope } from "../src/trpc";

const baseEvent = {
  id: "evt1",
  title: "Test event",
  description: "desc",
  type: "SEMINAR",
  status: "PLANNED",
  start_at: new Date("2026-06-01T10:00:00Z"),
  end_at: new Date("2026-06-01T13:00:00Z"),
  speaker_id: "u_speaker",
  branch_id: "branch_msk",
  max_participants: 50,
  pricing_type: "FIXED",
  price: 5000,
  pricing_note: null,
  is_online: false,
  tags: [],
  is_grading: false,
  program_id: null,
};

const makePrisma = (overrides: Partial<Record<string, unknown>> = {}) => ({
  event: {
    findUnique: vi.fn().mockResolvedValue(baseEvent),
    create: vi.fn().mockResolvedValue({ ...baseEvent, id: "evt_new" }),
    update: vi.fn().mockResolvedValue({ ...baseEvent }),
    delete: vi.fn().mockResolvedValue(baseEvent),
    findMany: vi.fn().mockResolvedValue([]),
  },
  booking: {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  branch: { findMany: vi.fn() },
  ...overrides,
});

const session = (overrides: Partial<SessionUser> = {}) => ({
  user: {
    id: "u_test",
    email: "u@a.ru",
    name: "Tester",
    system_role: "PRESIDENT",
    academic_level: "FOUNDER",
    branch_id: null,
    is_speaker: false,
    ...overrides,
  } satisfies SessionUser,
});

const makeCtx = (
  sess: Context["session"],
  prismaOverride?: ReturnType<typeof makePrisma>,
): Context => ({
  session: sess,
  prisma: (prismaOverride ?? makePrisma()) as unknown as Context["prisma"],
});

describe("canAuthorEvents", () => {
  it("PRESIDENT — да", () => {
    expect(canAuthorEvents(session({ system_role: "PRESIDENT" }).user)).toBe(true);
  });
  it("BRANCH_ADMIN/STUDENT/MASTER — да (admin enough)", () => {
    expect(canAuthorEvents(session({ system_role: "BRANCH_ADMIN" }).user)).toBe(true);
  });
  it("STUDENT/MASTER — да (academic enough)", () => {
    expect(
      canAuthorEvents(session({ system_role: "STUDENT", academic_level: "MASTER" }).user),
    ).toBe(true);
  });
  it("STUDENT/LISTENER — нет", () => {
    expect(
      canAuthorEvents(session({ system_role: "STUDENT", academic_level: "LISTENER" }).user),
    ).toBe(false);
  });
});

describe("canWriteToBranch", () => {
  const global: BranchScope = { mode: "global" };
  const scopedMsk: BranchScope = { mode: "scoped", branch_id: "branch_msk" };

  it("global — везде да", () => {
    expect(canWriteToBranch(global, "branch_chel")).toBe(true);
    expect(canWriteToBranch(global, null)).toBe(true);
  });

  it("scoped + свой branch — да", () => {
    expect(canWriteToBranch(scopedMsk, "branch_msk")).toBe(true);
  });

  it("scoped + чужой branch — нет", () => {
    expect(canWriteToBranch(scopedMsk, "branch_chel")).toBe(false);
  });

  it("scoped + null (общеакадемическое) — нет", () => {
    expect(canWriteToBranch(scopedMsk, null)).toBe(false);
  });
});

describe("resolveBranchId", () => {
  const global: BranchScope = { mode: "global" };
  const scopedMsk: BranchScope = { mode: "scoped", branch_id: "branch_msk" };

  it("input явный — отдаёт его", () => {
    expect(resolveBranchId(global, "branch_chel")).toBe("branch_chel");
    expect(resolveBranchId(scopedMsk, "branch_msk")).toBe("branch_msk");
    expect(resolveBranchId(global, null)).toBe(null);
  });

  it("undefined + global → null", () => {
    expect(resolveBranchId(global, undefined)).toBe(null);
  });

  it("undefined + scoped → свой branch", () => {
    expect(resolveBranchId(scopedMsk, undefined)).toBe("branch_msk");
  });
});

describe("event.create — RBAC", () => {
  const baseInput = {
    title: "Новое событие",
    type: "SEMINAR" as const,
    speaker_id: "u_speaker",
    start_at: new Date("2026-07-01T10:00:00Z"),
    end_at: new Date("2026-07-01T13:00:00Z"),
  };

  it("PRESIDENT может создавать общеакадемическое (branch_id=null)", async () => {
    const ctx = makeCtx(session({ system_role: "PRESIDENT" }));
    const caller = appRouter.createCaller(ctx);
    await caller.event.create({ ...baseInput, branch_id: null });
    const create = ctx.prisma.event.create as ReturnType<typeof vi.fn>;
    expect(create).toHaveBeenCalled();
    expect(create.mock.calls[0][0].data.branch_id).toBeNull();
  });

  it("BRANCH_ADMIN может создавать в своём филиале", async () => {
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }));
    const caller = appRouter.createCaller(ctx);
    await caller.event.create({ ...baseInput, branch_id: "branch_msk" });
    const create = ctx.prisma.event.create as ReturnType<typeof vi.fn>;
    expect(create.mock.calls[0][0].data.branch_id).toBe("branch_msk");
  });

  it("BRANCH_ADMIN не может создавать в чужом филиале", async () => {
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }));
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.create({ ...baseInput, branch_id: "branch_chel" })).rejects.toThrow(
      TRPCError,
    );
  });

  it("BRANCH_ADMIN не может создавать общеакадемическое (null)", async () => {
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }));
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.create({ ...baseInput, branch_id: null })).rejects.toThrow(TRPCError);
  });

  it("LISTENER не может создавать", async () => {
    const ctx = makeCtx(
      session({
        system_role: "STUDENT",
        academic_level: "LISTENER",
        branch_id: "branch_msk",
      }),
    );
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.create({ ...baseInput, branch_id: "branch_msk" })).rejects.toThrow(
      /прав/,
    );
  });

  it("BRANCH_ADMIN без явного branch_id → подставляется свой", async () => {
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }));
    const caller = appRouter.createCaller(ctx);
    await caller.event.create({ ...baseInput });
    const create = ctx.prisma.event.create as ReturnType<typeof vi.fn>;
    expect(create.mock.calls[0][0].data.branch_id).toBe("branch_msk");
  });
});

describe("event.update — RBAC", () => {
  it("BRANCH_ADMIN может обновлять событие своего филиала", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_msk",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await caller.event.update({ id: "evt1", title: "Обновлённое" });
    expect(prisma.event.update).toHaveBeenCalled();
  });

  it("BRANCH_ADMIN не может обновлять чужое событие", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_chel",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.update({ id: "evt1", title: "Захват" })).rejects.toThrow(TRPCError);
  });

  it("BRANCH_ADMIN не может перевести своё событие в чужой филиал", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_msk",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.update({ id: "evt1", branch_id: "branch_chel" })).rejects.toThrow(
      TRPCError,
    );
  });

  it("BRANCH_ADMIN не может сделать своё событие общеакадемическим", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_msk",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.update({ id: "evt1", branch_id: null })).rejects.toThrow(TRPCError);
  });

  it("404 при отсутствии события", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const ctx = makeCtx(session({ system_role: "PRESIDENT" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.update({ id: "evt_404" })).rejects.toThrow(/не найдено/);
  });
});

describe("event.delete — RBAC", () => {
  it("PRESIDENT может удалить любое событие", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_msk",
    });
    const ctx = makeCtx(session({ system_role: "PRESIDENT" }), prisma);
    const caller = appRouter.createCaller(ctx);
    const r = await caller.event.delete({ id: "evt1" });
    expect(r).toEqual({ id: "evt1" });
    expect(prisma.booking.deleteMany).toHaveBeenCalledWith({
      where: { event_id: "evt1" },
    });
    expect(prisma.event.delete).toHaveBeenCalled();
  });

  it("BRANCH_ADMIN не может удалить чужое событие", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_chel",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.delete({ id: "evt1" })).rejects.toThrow(TRPCError);
  });
});

describe("event.byId — branch isolation для read", () => {
  it("scoped юзер не видит чужое событие (404)", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseEvent,
      branch_id: "branch_chel",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.byId({ id: "evt1" })).rejects.toThrow(/NOT_FOUND/i);
  });

  it("scoped юзер видит общеакадемические события (branch_id=null)", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseEvent,
      branch_id: null,
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    const r = await caller.event.byId({ id: "evt1" });
    expect(r.branch_id).toBeNull();
  });

  it("global юзер видит любое событие", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseEvent,
      branch_id: "branch_chel",
    });
    const ctx = makeCtx(session({ system_role: "PRESIDENT" }), prisma);
    const caller = appRouter.createCaller(ctx);
    const r = await caller.event.byId({ id: "evt1" });
    expect(r.branch_id).toBe("branch_chel");
  });
});
