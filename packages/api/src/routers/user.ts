import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedBranchProcedure } from "../trpc";
import { cuidSchema } from "../schemas/common";

/**
 * userRouter — минимальный read-only роут для UI (форма создания
 * события показывает дропдаун спикеров).
 */
export const userRouter = router({
  /**
   * Список потенциальных спикеров (is_speaker=true).
   * Для scoped-юзера ограничиваем своим филиалом + общесетевые
   * (PRESIDENT/VP/founder без branch_id видны всем).
   */
  listSpeakers: protectedBranchProcedure.query(async ({ ctx }) => {
    const baseFilter = { is_speaker: true } as const;
    if (ctx.branchScope.mode === "global") {
      return ctx.prisma.user.findMany({
        where: baseFilter,
        select: {
          id: true,
          name: true,
          email: true,
          academic_level: true,
          branch_id: true,
        },
        orderBy: [{ academic_level: "asc" }, { name: "asc" }],
      });
    }

    return ctx.prisma.user.findMany({
      where: {
        ...baseFilter,
        OR: [{ branch_id: ctx.branchScope.branch_id }, { branch_id: null }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        academic_level: true,
        branch_id: true,
      },
      orderBy: [{ academic_level: "asc" }, { name: "asc" }],
    });
  }),

  createSpeaker: protectedBranchProcedure
    .input(z.object({ name: z.string().min(2).max(200), phone: z.string().max(50).optional() }))
    .mutation(async ({ ctx, input }) => {
      const placeholderEmail = `speaker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@noemail.local`;
      const branchId = ctx.branchScope.mode === "scoped" ? ctx.branchScope.branch_id : null;
      return ctx.prisma.user.create({
        data: {
          name: input.name,
          email: placeholderEmail,
          phone: input.phone,
          is_speaker: true,
          branch_id: branchId,
        },
        select: { id: true, name: true, email: true, academic_level: true, branch_id: true },
      });
    }),

  updateSpeaker: protectedBranchProcedure
    .input(
      z.object({
        id: cuidSchema,
        name: z.string().min(2).max(200),
        phone: z.string().max(50).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const speaker = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: { id: true, is_speaker: true },
      });
      if (!speaker?.is_speaker)
        throw new TRPCError({ code: "NOT_FOUND", message: "Спикер не найден" });
      return ctx.prisma.user.update({
        where: { id: input.id },
        data: { name: input.name, phone: input.phone },
        select: { id: true, name: true, email: true, academic_level: true, branch_id: true },
      });
    }),

  deleteSpeaker: protectedBranchProcedure
    .input(z.object({ id: cuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const speaker = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: { id: true, is_speaker: true },
      });
      if (!speaker?.is_speaker)
        throw new TRPCError({ code: "NOT_FOUND", message: "Спикер не найден" });
      await ctx.prisma.user.update({ where: { id: input.id }, data: { is_speaker: false } });
      return { id: input.id };
    }),
});
