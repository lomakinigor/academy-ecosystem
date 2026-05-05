import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../src/root";
import type { Context, SessionUser } from "../src/context";

const range = {
  from: new Date("2026-05-01T00:00:00Z"),
  to: new Date("2026-05-31T23:59:59Z"),
};

const sampleEvents = [
  {
    id: "evt1",
    title: "Храм-3: день 1",
    type: "SEMINAR",
    start_at: new Date("2026-05-04T07:00:00Z"),
    end_at: new Date("2026-05-04T16:00:00Z"),
    branch_id: "branch_msk",
    branch: { id: "branch_msk", name: "Москва", city: "Москва" },
    speaker_id: "u_founder",
    speaker: { id: "u_founder", name: "Светлов", avatar: null },
    _count: { bookings: 12 },
  },
  {
    id: "evt2",
    title: "Храм-3: день 2",
    type: "SEMINAR",
    start_at: new Date("2026-05-05T07:00:00Z"),
    end_at: new Date("2026-05-05T16:00:00Z"),
    branch_id: "branch_msk",
    branch: { id: "branch_msk", name: "Москва", city: "Москва" },
    speaker_id: "u_founder",
    speaker: { id: "u_founder", name: "Светлов", avatar: null },
    _count: { bookings: 12 },
  },
  {
    id: "evt3",
    title: "Вебинар СВЕТЛОЯР",
    type: "WEBINAR",
    start_at: new Date("2026-05-06T17:00:00Z"),
    end_at: new Date("2026-05-06T18:30:00Z"),
    branch_id: null,
    branch: null,
    speaker_id: "u_vp",
    speaker: { id: "u_vp", name: "ВП", avatar: null },
    _count: { bookings: 0 },
  },
];

const makePrisma = (events = sampleEvents) => ({
  event: {
    findMany: vi.fn().mockResolvedValue(events),
  },
  branch: { findMany: vi.fn() },
});

const session = (overrides: Partial<SessionUser> = {}) => ({
  user: {
    id: "u_test",
    email: "u@a.ru",
    name: "User",
    system_role: "PRESIDENT",
    academic_level: "FOUNDER",
    branch_id: null,
    is_speaker: false,
    ...overrides,
  } satisfies SessionUser,
});

const makeCtx = (
  sess: Context["session"] = session(),
  prismaOverride?: ReturnType<typeof makePrisma>,
): Context => ({
  session: sess,
  prisma: (prismaOverride ?? makePrisma()) as unknown as Context["prisma"],
});

describe("eventRouter.list — авторизация", () => {
  it("без сессии бросает UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.event.list(range)).rejects.toThrow(TRPCError);
  });
});

describe("eventRouter.list — выходной формат", () => {
  it("возвращает {events, total, byDay}", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const r = await caller.event.list(range);
    expect(r.events).toHaveLength(3);
    expect(r.total).toBe(3);
    expect(Object.keys(r.byDay)).toEqual(
      expect.arrayContaining(["2026-05-04", "2026-05-05", "2026-05-06"]),
    );
    expect(r.byDay["2026-05-04"]).toHaveLength(1);
  });

  it("включает branch, speaker и _count.bookings в include", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await caller.event.list(range);

    const findMany = ctx.prisma.event.findMany as ReturnType<typeof vi.fn>;
    const callArg = findMany.mock.calls[0][0];
    expect(callArg.include).toEqual({
      branch: { select: { id: true, name: true, city: true } },
      speaker: { select: { id: true, name: true, avatar: true } },
      _count: { select: { bookings: true } },
    });
    expect(callArg.orderBy).toEqual({ start_at: "asc" });
  });
});

describe("eventRouter.list — фильтры в where", () => {
  const callWith = async (
    input: Partial<{
      from: Date;
      to: Date;
      branch_id: string | null;
      types: string[];
      speaker_id: string;
      search: string;
      is_online: boolean;
      tags: string[];
    }>,
    sess: Context["session"] = session(),
  ) => {
    const ctx = makeCtx(sess);
    const caller = appRouter.createCaller(ctx);
    await caller.event.list({ ...range, ...input });
    const findMany = ctx.prisma.event.findMany as ReturnType<typeof vi.fn>;
    return findMany.mock.calls[0][0].where as { AND: Array<Record<string, unknown>> };
  };

  it("фильтр по диапазону дат всегда включён", async () => {
    const where = await callWith({});
    const dateClauses = where.AND.filter((c) => "start_at" in c);
    expect(dateClauses).toHaveLength(2);
  });

  it("фильтр по типам", async () => {
    const where = await callWith({ types: ["SEMINAR", "PRACTICE"] });
    expect(where.AND).toEqual(expect.arrayContaining([{ type: { in: ["SEMINAR", "PRACTICE"] } }]));
  });

  it("фильтр по спикеру", async () => {
    const where = await callWith({ speaker_id: "u_founder" });
    expect(where.AND).toEqual(expect.arrayContaining([{ speaker_id: "u_founder" }]));
  });

  it("полнотекстовый search по title/description", async () => {
    const where = await callWith({ search: "храм" });
    const or = where.AND.find((c) => "OR" in c) as {
      OR: Array<Record<string, unknown>>;
    };
    expect(or.OR[0]).toEqual({ title: { contains: "храм", mode: "insensitive" } });
  });

  it("фильтр is_online", async () => {
    const where = await callWith({ is_online: true });
    expect(where.AND).toEqual(expect.arrayContaining([{ is_online: true }]));
  });

  it("фильтр по тегам через hasSome", async () => {
    const where = await callWith({ tags: ["с детьми"] });
    expect(where.AND).toEqual(expect.arrayContaining([{ tags: { hasSome: ["с детьми"] } }]));
  });
});

describe("eventRouter.list — RBAC по филиалам", () => {
  const collectWhere = async (sess: Context["session"], branch_id?: string | null) => {
    const ctx = makeCtx(sess);
    const caller = appRouter.createCaller(ctx);
    await caller.event.list({
      ...range,
      ...(branch_id !== undefined ? { branch_id } : {}),
    });
    const findMany = ctx.prisma.event.findMany as ReturnType<typeof vi.fn>;
    const where = findMany.mock.calls[0][0].where as {
      AND: Array<Record<string, unknown>>;
    };
    return where.AND;
  };

  it("PRESIDENT без явного фильтра → нет ограничения по филиалу", async () => {
    const and = await collectWhere(session({ system_role: "PRESIDENT" }));
    const branchClause = and.find(
      (c) => "branch_id" in c || ("OR" in c && (c as { OR: unknown[] }).OR.length === 2),
    );
    expect(branchClause).toBeUndefined();
  });

  it("BRANCH_ADMIN без явного фильтра → OR(свой, null)", async () => {
    const sess = session({
      system_role: "BRANCH_ADMIN",
      branch_id: "branch_msk",
    });
    const and = await collectWhere(sess);
    const or = and.find((c) => "OR" in c && Array.isArray((c as { OR: unknown[] }).OR)) as
      | { OR: Array<Record<string, unknown>> }
      | undefined;
    expect(or?.OR).toEqual([{ branch_id: "branch_msk" }, { branch_id: null }]);
  });

  it("BRANCH_ADMIN при попытке смотреть чужой филиал → never-фильтр", async () => {
    const sess = session({
      system_role: "BRANCH_ADMIN",
      branch_id: "branch_msk",
    });
    const and = await collectWhere(sess, "branch_alien");
    const never = and.find((c) => "id" in c);
    expect(never).toEqual({ id: "__never__" });
  });

  it("BRANCH_ADMIN при явном своём филиале → точечный фильтр", async () => {
    const sess = session({
      system_role: "BRANCH_ADMIN",
      branch_id: "branch_msk",
    });
    const and = await collectWhere(sess, "branch_msk");
    const branch = and.find((c) => "branch_id" in c);
    expect(branch).toEqual({ branch_id: "branch_msk" });
  });

  it("STUDENT (магистр) видит свой филиал и общеакадемические события", async () => {
    const sess = session({
      system_role: "STUDENT",
      academic_level: "MAGISTER",
      branch_id: "branch_chel",
    });
    const and = await collectWhere(sess);
    const or = and.find((c) => "OR" in c && Array.isArray((c as { OR: unknown[] }).OR)) as
      | { OR: Array<Record<string, unknown>> }
      | undefined;
    expect(or?.OR).toEqual([{ branch_id: "branch_chel" }, { branch_id: null }]);
  });
});
