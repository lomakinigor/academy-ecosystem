import { router, publicProcedure } from "../trpc";

/**
 * Заглушка eventRouter — плейсхолдер для CRUD мероприятий (Этап 1, Agent CRUD).
 */
export const eventRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.event.findMany({
      orderBy: { start_at: "asc" },
      take: 50,
      include: { branch: true, speaker: { select: { id: true, name: true } } },
    });
  }),
});
