import { router, protectedBranchProcedure } from "../trpc";

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
});
