import { router, publicProcedure } from "../trpc";

/**
 * branch.list — для дропдауна филиала в сайдбаре календаря.
 * Возвращает только публично-нужные поля.
 */
export const branchRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.branch.findMany({
      orderBy: { city: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        timezone: true,
      },
    });
  }),
});
