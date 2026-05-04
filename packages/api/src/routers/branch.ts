import { router, publicProcedure } from "../trpc";

/**
 * Заглушка branchRouter — плейсхолдер для будущего CRUD филиалов.
 * Полная реализация — после Auth (изоляция по branch_id).
 */
export const branchRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.branch.findMany({
      orderBy: { city: "asc" },
    });
  }),
});
