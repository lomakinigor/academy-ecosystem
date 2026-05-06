import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { bookingByEventSchema, bookingCancelSchema, bookingCreateSchema } from "../schemas/booking";

const PUBLIC_VISIBLE_STATUSES = ["PLANNED", "ACTIVE"] as const;
const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "WAITLIST"] as const;

export const bookingRouter = router({
  /**
   * Записаться на событие.
   * - Событие должно быть в статусе PLANNED|ACTIVE
   * - Если у юзера уже есть активная бронь — возвращаем её (идемпотентно)
   * - Если max_participants исчерпан → WAITLIST, иначе CONFIRMED
   */
  create: protectedProcedure.input(bookingCreateSchema).mutation(async ({ ctx, input }) => {
    const event = await ctx.prisma.event.findUnique({
      where: { id: input.event_id },
      select: { id: true, status: true, max_participants: true, start_at: true },
    });
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Событие не найдено" });
    }
    if (
      !PUBLIC_VISIBLE_STATUSES.includes(event.status as (typeof PUBLIC_VISIBLE_STATUSES)[number])
    ) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Запись на это событие закрыта" });
    }
    if (event.start_at.getTime() < Date.now()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Событие уже началось" });
    }

    const existing = await ctx.prisma.booking.findUnique({
      where: { user_id_event_id: { user_id: ctx.user.id, event_id: input.event_id } },
    });
    if (existing && existing.status !== "CANCELLED") {
      return existing;
    }

    let nextStatus: "CONFIRMED" | "WAITLIST" = "CONFIRMED";
    if (event.max_participants && event.max_participants > 0) {
      const activeCount = await ctx.prisma.booking.count({
        where: {
          event_id: input.event_id,
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
        },
      });
      if (activeCount >= event.max_participants) {
        nextStatus = "WAITLIST";
      }
    }

    if (existing) {
      return ctx.prisma.booking.update({
        where: { id: existing.id },
        data: { status: nextStatus },
      });
    }

    return ctx.prisma.booking.create({
      data: {
        user_id: ctx.user.id,
        event_id: input.event_id,
        status: nextStatus,
      },
    });
  }),

  cancel: protectedProcedure.input(bookingCancelSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.booking.findUnique({
      where: { user_id_event_id: { user_id: ctx.user.id, event_id: input.event_id } },
    });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Бронь не найдена" });
    }
    return ctx.prisma.booking.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
    });
  }),

  /**
   * Текущая бронь юзера на конкретное событие — для UI кнопки на /event/[id].
   * Возвращает null, если брони нет или она CANCELLED.
   */
  myForEvent: protectedProcedure.input(bookingByEventSchema).query(async ({ ctx, input }) => {
    const existing = await ctx.prisma.booking.findUnique({
      where: { user_id_event_id: { user_id: ctx.user.id, event_id: input.event_id } },
    });
    if (!existing || existing.status === "CANCELLED") return null;
    return existing;
  }),
});
