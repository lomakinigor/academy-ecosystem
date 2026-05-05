import type { Prisma } from "@academy/db";
import { router, protectedBranchProcedure } from "../trpc";
import { eventListInputSchema, type EventListInput } from "../schemas/event";
import type { BranchScope } from "../trpc";

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

export const eventRouter = router({
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
});
