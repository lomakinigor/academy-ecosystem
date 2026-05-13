import type { Prisma } from "@academy/db";
import { TRPCError } from "@trpc/server";
import { router, protectedBranchProcedure, publicProcedure } from "../trpc";
import {
  eventByIdSchema,
  eventCreateSchema,
  eventDeleteSchema,
  eventListInputSchema,
  eventPublicListInputSchema,
  eventUpdateSchema,
  type EventListInput,
} from "../schemas/event";
import type { BranchScope } from "../trpc";
import type { SessionUser } from "../context";

/**
 * Собирает Prisma where для event.list.
 * Соединяет пользовательские фильтры с branch isolation:
 * - global — без ограничения по филиалу (если фильтр не задан)
 * - scoped — branch_id юзера ИЛИ null (общеакадемические события)
 *   плюс пересечение с явным фильтром, если он указан.
 */
export const buildEventListWhere = (
  input: EventListInput,
  scope: BranchScope,
): Prisma.EventWhereInput => {
  const and: Prisma.EventWhereInput[] = [
    {
      start_at: { gte: input.from },
    },
    {
      // Событие пересекает диапазон, если start_at <= to.
      start_at: { lte: input.to },
    },
  ];

  // Branch isolation
  if (scope.mode === "scoped") {
    const ownClause: Prisma.EventWhereInput =
      scope.branch_id === null
        ? { branch_id: null }
        : { OR: [{ branch_id: scope.branch_id }, { branch_id: null }] };

    if (input.branch_id !== undefined) {
      // Юзер запросил конкретный филиал — пересекаем с разрешённым.
      const allowed = scope.branch_id === null ? [null] : [scope.branch_id, null];
      if (!allowed.includes(input.branch_id)) {
        // Фильтр недопустим — вернём заведомо пустой результат.
        and.push({ id: "__never__" });
      } else {
        and.push({ branch_id: input.branch_id });
      }
    } else {
      and.push(ownClause);
    }
  } else if (input.branch_id !== undefined) {
    and.push({ branch_id: input.branch_id });
  }

  if (input.types && input.types.length > 0) {
    and.push({ type: { in: input.types } });
  }
  if (input.speaker_id) {
    and.push({ speaker_id: input.speaker_id });
  }
  if (typeof input.is_online === "boolean") {
    and.push({ is_online: input.is_online });
  }
  if (input.tags && input.tags.length > 0) {
    and.push({ tags: { hasSome: input.tags } });
  }
  if (input.search) {
    and.push({
      OR: [
        { title: { contains: input.search, mode: "insensitive" } },
        { description: { contains: input.search, mode: "insensitive" } },
      ],
    });
  }

  return { AND: and };
};

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Кто имеет право создавать/редактировать/удалять события.
 * - PRESIDENT/VP — везде
 * - BRANCH_DIRECTOR/BRANCH_ADMIN — только свой филиал и общеакадемические
 * - Магистры/Мастера (academic_level >= MASTER) — только свой филиал и общеакадемические
 * - Все остальные — UNAUTHORIZED
 */
const ACADEMIC_LEVEL_RANK: Record<string, number> = {
  LISTENER: 0,
  MASTER: 1,
  MAGISTER: 2,
  FOUNDER: 3,
};

const SYSTEM_ROLE_RANK: Record<string, number> = {
  STUDENT: 0,
  BRANCH_ADMIN: 1,
  BRANCH_DIRECTOR: 2,
  VICE_PRESIDENT: 3,
  PRESIDENT: 4,
};

export const canAuthorEvents = (user: SessionUser): boolean => {
  const adminEnough = (SYSTEM_ROLE_RANK[user.system_role] ?? 0) >= 1; // BRANCH_ADMIN+
  const academicEnough = (ACADEMIC_LEVEL_RANK[user.academic_level] ?? 0) >= 1; // MASTER+
  return adminEnough || academicEnough;
};

/**
 * Может ли юзер писать в указанный branch_id (с учётом scope).
 * branch_id=null (общеакадемическое) могут редактировать только global-юзеры.
 * undefined здесь невалидное значение — резолвится до этой проверки.
 */
export const canWriteToBranch = (scope: BranchScope, branchId: string | null): boolean => {
  if (scope.mode === "global") return true;
  if (branchId === null) return false; // только global редактирует общие
  return branchId === scope.branch_id;
};

/**
 * Резолвит branch_id для create/update с учётом scope.
 * Если input не указан — для global → null (общее), для scoped → свой филиал.
 */
export const resolveBranchId = (
  scope: BranchScope,
  input: string | null | undefined,
): string | null => {
  if (input !== undefined) return input;
  if (scope.mode === "global") return null;
  return scope.branch_id;
};

const assertCanAuthor = (user: SessionUser) => {
  if (!canAuthorEvents(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Недостаточно прав для управления событиями",
    });
  }
};

const assertBranchWrite = (scope: BranchScope, branchId: string | null) => {
  if (!canWriteToBranch(scope, branchId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        branchId === null
          ? "Только PRESIDENT/VICE_PRESIDENT может управлять общеакадемическими событиями"
          : "Можно управлять только событиями своего филиала",
    });
  }
};

/**
 * Публичный список событий — для главной страницы и публичных календарей.
 * Без auth, без branch isolation (показываем все филиалы), только опубликованное:
 * status IN (PLANNED, ACTIVE).
 */
const PUBLIC_VISIBLE_STATUSES = ["PLANNED", "ACTIVE"] as const;

export const eventRouter = router({
  publicList: publicProcedure.input(eventPublicListInputSchema).query(async ({ ctx, input }) => {
    const and: Prisma.EventWhereInput[] = [
      { start_at: { gte: input.from } },
      { start_at: { lte: input.to } },
      { status: { in: [...PUBLIC_VISIBLE_STATUSES] } },
    ];

    if (input.branch_id !== undefined) {
      and.push({ branch_id: input.branch_id });
    }
    if (input.types && input.types.length > 0) {
      and.push({ type: { in: input.types } });
    }
    if (typeof input.is_online === "boolean") {
      and.push({ is_online: input.is_online });
    }
    if (input.tags && input.tags.length > 0) {
      and.push({ tags: { hasSome: input.tags } });
    }
    if (input.search) {
      and.push({
        OR: [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ],
      });
    }

    const events = await ctx.prisma.event.findMany({
      where: { AND: and },
      orderBy: { start_at: "asc" },
      include: {
        branch: { select: { id: true, name: true, city: true } },
        speaker: { select: { id: true, name: true, avatar: true } },
        _count: { select: { bookings: true } },
      },
    });

    const byDay: Record<string, typeof events> = {};
    for (const ev of events) {
      const key = isoDay(ev.start_at);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(ev);
    }

    return { events, total: events.length, byDay };
  }),

  publicById: publicProcedure.input(eventByIdSchema).query(async ({ ctx, input }) => {
    const event = await ctx.prisma.event.findUnique({
      where: { id: input.id },
      include: {
        branch: { select: { id: true, name: true, city: true } },
        speaker: { select: { id: true, name: true, avatar: true } },
        _count: { select: { bookings: true } },
      },
    });
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Событие не найдено" });
    }
    if (
      !PUBLIC_VISIBLE_STATUSES.includes(event.status as (typeof PUBLIC_VISIBLE_STATUSES)[number])
    ) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Событие недоступно" });
    }
    return event;
  }),

  list: protectedBranchProcedure.input(eventListInputSchema).query(async ({ ctx, input }) => {
    const where = buildEventListWhere(input, ctx.branchScope);

    const events = await ctx.prisma.event.findMany({
      where,
      orderBy: { start_at: "asc" },
      include: {
        branch: { select: { id: true, name: true, city: true } },
        speaker: { select: { id: true, name: true, avatar: true } },
        _count: { select: { bookings: true } },
      },
    });

    const byDay: Record<string, typeof events> = {};
    for (const ev of events) {
      const key = isoDay(ev.start_at);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(ev);
    }

    return {
      events,
      total: events.length,
      byDay,
    };
  }),

  byId: protectedBranchProcedure.input(eventByIdSchema).query(async ({ ctx, input }) => {
    const event = await ctx.prisma.event.findUnique({
      where: { id: input.id },
      include: {
        branch: { select: { id: true, name: true, city: true } },
        speaker: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Событие не найдено" });
    }
    // Branch isolation для read: scoped юзер видит только свой + null
    if (ctx.branchScope.mode === "scoped") {
      if (event.branch_id !== null && event.branch_id !== ctx.branchScope.branch_id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }
    return event;
  }),

  create: protectedBranchProcedure.input(eventCreateSchema).mutation(async ({ ctx, input }) => {
    assertCanAuthor(ctx.user);
    const branchId = resolveBranchId(ctx.branchScope, input.branch_id);
    assertBranchWrite(ctx.branchScope, branchId);

    const end_at = input.end_at ?? new Date(input.start_at.getTime() + 2 * 60 * 60 * 1000);

    const created = await ctx.prisma.event.create({
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        status: input.status,
        start_at: input.start_at,
        end_at,
        speaker_id: input.speaker_id,
        branch_id: branchId,
        max_participants: input.max_participants,
        pricing_type: input.pricing_type,
        price: input.price,
        pricing_note: input.pricing_note,
        is_online: input.is_online,
        is_hybrid: input.is_hybrid,
        venue: input.venue,
        tags: input.tags,
        is_grading: input.is_grading,
        program_id: input.program_id,
      },
    });
    return created;
  }),

  update: protectedBranchProcedure.input(eventUpdateSchema).mutation(async ({ ctx, input }) => {
    assertCanAuthor(ctx.user);

    const existing = await ctx.prisma.event.findUnique({
      where: { id: input.id },
      select: { id: true, branch_id: true },
    });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Событие не найдено" });
    }

    // Юзер должен иметь права на ТЕКУЩИЙ branch события
    assertBranchWrite(ctx.branchScope, existing.branch_id);
    // И на НОВЫЙ branch если он меняется
    if (input.branch_id !== undefined) {
      assertBranchWrite(ctx.branchScope, input.branch_id);
    }

    const { id, ...rest } = input;
    const updated = await ctx.prisma.event.update({
      where: { id },
      data: rest,
    });
    return updated;
  }),

  delete: protectedBranchProcedure.input(eventDeleteSchema).mutation(async ({ ctx, input }) => {
    assertCanAuthor(ctx.user);

    const existing = await ctx.prisma.event.findUnique({
      where: { id: input.id },
      select: { id: true, branch_id: true },
    });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Событие не найдено" });
    }
    assertBranchWrite(ctx.branchScope, existing.branch_id);

    // Удаляем связанные booking'и (cascade-эмуляция, т.к. в schema нет onDelete)
    await ctx.prisma.booking.deleteMany({ where: { event_id: input.id } });
    await ctx.prisma.event.delete({ where: { id: input.id } });
    return { id: input.id };
  }),
});
