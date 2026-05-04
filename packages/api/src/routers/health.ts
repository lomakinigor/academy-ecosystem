import { router, publicProcedure } from "../trpc";

export const healthRouter = router({
  ping: publicProcedure.query(() => ({
    ok: true,
    service: "academy-api",
    timestamp: new Date().toISOString(),
  })),
});
