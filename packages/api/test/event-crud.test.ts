import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../src/root";
import {
  canAuthorEvents,
  canWriteToBranch,
  findEventConflicts,
  resolveBranchId,
} from "../src/routers/event";
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
  it("STUDENT/MASTER — нет: academic_level не даёт доступ к управлению", () => {
    expect(
      canAuthorEvents(session({ system_role: "STUDENT", academic_level: "MASTER" }).user),
    ).toBe(false);
  });
  it("STUDENT/LISTENER — нет", () => {
    expect(
      canAuthorEvents(session({ system_role: "STUDENT", academic_level: "LISTENER" }).user),
    ).toBe(false);
  });
});

describe("findEventConflicts", () => {
  const candidate = {
    id: "evt_new",
    start_at: new Date("2026-06-01T10:00:00Z"),
    end_at: new Date("2026-06-01T13:00:00Z"),
    speaker_id: "u_speaker",
    venue: "Екатеринбург, 8 Марта, 194Б",
  };

  it("находит пересечение по одному спикеру", () => {
    const conflicts = findEventConflicts(candidate, [
      {
        id: "evt_speaker",
        title: "Другой семинар",
        start_at: new Date("2026-06-01T12:00:00Z"),
        end_at: new Date("2026-06-01T14:00:00Z"),
        speaker_id: "u_speaker",
        venue: "Другой адрес",
      },
    ]);

    expect(conflicts).toEqual([
      expect.objectContaining({ id: "evt_speaker", reasons: ["SPEAKER"] }),
    ]);
  });

  it("находит пересечение по адресу, игнорируя регистр и лишние пробелы", () => {
    const conflicts = findEventConflicts(candidate, [
      {
        id: "evt_venue",
        title: "Практика",
        start_at: new Date("2026-06-01T09:00:00Z"),
        end_at: new Date("2026-06-01T11:00:00Z"),
        speaker_id: "another_speaker",
        venue: "  екатеринбург, 8   марта, 194б  ",
      },
    ]);

    expect(conflicts).toEqual([expect.objectContaining({ id: "evt_venue", reasons: ["VENUE"] })]);
  });

  it("не считает конфликтом границу времени и само редактируемое событие", () => {
    const conflicts = findEventConflicts(candidate, [
      {
        id: "evt_new",
        title: "То же событие",
        start_at: candidate.start_at,
        end_at: candidate.end_at,
        speaker_id: candidate.speaker_id,
        venue: candidate.venue,
      },
      {
        id: "evt_after",
        title: "Следующее событие",
        start_at: candidate.end_at,
        end_at: new Date("2026-06-01T15:00:00Z"),
        speaker_id: candidate.speaker_id,
        venue: candidate.venue,
      },
    ]);

    expect(conflicts).toEqual([]);
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

describe("event.conflicts", () => {
  const input = {
    start_at: new Date("2026-07-01T10:00:00Z"),
    end_at: new Date("2026-07-01T13:00:00Z"),
    speaker_id: "u_speaker",
    venue: "Екатеринбург, 8 Марта, 194Б",
    branch_id: null,
  };

  it("возвращает предупреждение, но не создаёт и не изменяет событие", async () => {
    const prisma = makePrisma();
    prisma.event.findMany.mockResolvedValue([
      {
        id: "evt_conflict",
        title: "Ранее созданная практика",
        start_at: new Date("2026-07-01T12:00:00Z"),
        end_at: new Date("2026-07-01T14:00:00Z"),
        speaker_id: "u_speaker",
        venue: "Другой адрес",
      },
    ]);
    const ctx = makeCtx(session(), prisma);

    await expect(appRouter.createCaller(ctx).event.conflicts(input)).resolves.toEqual([
      expect.objectContaining({ id: "evt_conflict", reasons: ["SPEAKER"] }),
    ]);
    expect(prisma.event.create).not.toHaveBeenCalled();
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it("не открывает проверку конфликтов слушателю", async () => {
    const ctx = makeCtx(session({ system_role: "STUDENT", academic_level: "LISTENER" }));

    await expect(appRouter.createCaller(ctx).event.conflicts(input)).rejects.toThrow(/прав/);
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

  it("BRANCH_ADMIN может создавать события со старой меткой другого филиала", async () => {
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }));
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.event.create({ ...baseInput, branch_id: "branch_chel" }),
    ).resolves.toBeDefined();
  });

  it("BRANCH_ADMIN может создавать общеакадемическое (null)", async () => {
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }));
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.create({ ...baseInput, branch_id: null })).resolves.toBeDefined();
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

  it("BRANCH_ADMIN без явного branch_id → общее событие", async () => {
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }));
    const caller = appRouter.createCaller(ctx);
    await caller.event.create({ ...baseInput });
    const create = ctx.prisma.event.create as ReturnType<typeof vi.fn>;
    expect(create.mock.calls[0][0].data.branch_id).toBeNull();
  });
});

describe("event.update — RBAC", () => {
  it("отклоняет изменение только окончания раньше сохранённого начала", async () => {
    const prisma = makePrisma();
    const caller = appRouter.createCaller(makeCtx(session(), prisma));
    await expect(
      caller.event.update({ id: baseEvent.id, end_at: baseEvent.start_at }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it("отклоняет изменение только начала после сохранённого окончания", async () => {
    const prisma = makePrisma();
    const caller = appRouter.createCaller(makeCtx(session(), prisma));
    await expect(
      caller.event.update({ id: baseEvent.id, start_at: baseEvent.end_at }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it("принимает корректные новые границы", async () => {
    const prisma = makePrisma();
    const caller = appRouter.createCaller(makeCtx(session(), prisma));
    const start_at = new Date("2026-07-01T10:00:00Z");
    const end_at = new Date("2026-07-01T13:00:00Z");
    await caller.event.update({ id: baseEvent.id, start_at, end_at });
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: baseEvent.id },
      data: { start_at, end_at },
    });
  });
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

  it("BRANCH_ADMIN может обновлять событие другого филиала", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_chel",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.event.update({ id: "evt1", title: "Общее расписание" }),
    ).resolves.toBeDefined();
  });

  it("BRANCH_ADMIN может изменить старую метку филиала", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_msk",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.event.update({ id: "evt1", branch_id: "branch_chel" }),
    ).resolves.toBeDefined();
  });

  it("BRANCH_ADMIN может сделать событие общеакадемическим", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_msk",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.update({ id: "evt1", branch_id: null })).resolves.toBeDefined();
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

  it("BRANCH_ADMIN может удалить событие из общей базы", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "evt1",
      branch_id: "branch_chel",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.delete({ id: "evt1" })).resolves.toEqual({ id: "evt1" });
  });
});

describe("event.byId — branch isolation для read", () => {
  it("BRANCH_ADMIN видит событие другого филиала", async () => {
    const prisma = makePrisma();
    (prisma.event.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseEvent,
      branch_id: "branch_chel",
    });
    const ctx = makeCtx(session({ system_role: "BRANCH_ADMIN", branch_id: "branch_msk" }), prisma);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.event.byId({ id: "evt1" })).resolves.toMatchObject({
      branch_id: "branch_chel",
    });
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
