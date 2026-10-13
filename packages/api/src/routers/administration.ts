import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cuidSchema } from "../schemas/common";
import { isAcademyAdmin, protectedProcedure, router } from "../trpc";

// Фиксированный ID настраивается на сервере, а не принимается из регистрации или JWT claims.
export const isConfiguredOwner = (id: string): boolean =>
  Boolean(process.env.OWNER_USER_ID) && id === process.env.OWNER_USER_ID;

const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isConfiguredOwner(ctx.user.id) || !isAcademyAdmin(ctx.user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Назначать администраторов может только владелец",
    });
  }
  return next();
});

export const administrationRouter = router({
  list: ownerProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      where: { email: { not: null }, password_hash: { not: null } },
      select: { id: true, name: true, email: true, system_role: true },
      orderBy: { name: "asc" },
    }),
  ),
  setAdmin: ownerProcedure
    .input(z.object({ id: cuidSchema, isAdmin: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (isConfiguredOwner(input.id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Права владельца нельзя изменить здесь",
        });
      }
      const system_role = input.isAdmin ? "BRANCH_ADMIN" : "STUDENT";
      const result = await ctx.prisma.user.updateMany({
        where: { id: input.id, email: { not: null }, password_hash: { not: null } },
        data: { system_role },
      });
      if (result.count !== 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Сначала пользователь должен зарегистрироваться",
        });
      }
      return { id: input.id, system_role };
    }),
});
