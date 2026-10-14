import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cuidSchema } from "../schemas/common";
import { isAcademyAdmin, protectedProcedure, router } from "../trpc";
import type { SessionUser } from "../context";

// Фиксированный ID настраивается на сервере, а не принимается из регистрации или JWT claims.
export const isConfiguredOwner = (id: string): boolean =>
  Boolean(process.env.OWNER_USER_ID) && id === process.env.OWNER_USER_ID;

const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!process.env.OWNER_USER_ID || !isOwner(ctx.user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Назначать администраторов может только владелец",
    });
  }
  return next();
});

export const isOwner = (user: SessionUser): boolean =>
  user.is_owner === true && isAcademyAdmin(user);

export const administrationRouter = router({
  list: ownerProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      where: { email: { not: null }, password_hash: { not: null } },
      select: { id: true, name: true, email: true, system_role: true, is_owner: true },
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
        where: {
          id: input.id,
          is_owner: false,
          email: { not: null },
          password_hash: { not: null },
        },
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
  setOwner: ownerProcedure
    .input(z.object({ id: cuidSchema, isOwner: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (!input.isOwner && isConfiguredOwner(input.id) && ctx.user.id !== input.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Снять свои права может только первичный владелец",
        });
      }
      return ctx.prisma.$transaction(
        async (tx) => {
          const actor = await tx.user.findFirst({
            where: {
              id: ctx.user.id,
              is_owner: true,
              email: { not: null },
              password_hash: { not: null },
            },
          });
          if (!actor)
            throw new TRPCError({ code: "FORBIDDEN", message: "Права владельца уже сняты" });
          const target = await tx.user.findFirst({
            where: { id: input.id, email: { not: null }, password_hash: { not: null } },
          });
          if (!target)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Сначала пользователь должен зарегистрироваться",
            });
          if (
            !input.isOwner &&
            (await tx.user.count({ where: { is_owner: true, id: { not: input.id } } })) === 0
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Нельзя снять права последнего владельца",
            });
          }
          await tx.user.update({
            where: { id: input.id },
            data: {
              is_owner: input.isOwner,
              ...(input.isOwner ? { system_role: "BRANCH_ADMIN" as const } : {}),
            },
          });
          return { id: input.id, is_owner: input.isOwner };
        },
        { isolationLevel: "Serializable" },
      );
    }),
});
