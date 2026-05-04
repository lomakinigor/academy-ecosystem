import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { branchRouter } from "./routers/branch";
import { eventRouter } from "./routers/event";

export const appRouter = router({
  health: healthRouter,
  branch: branchRouter,
  event: eventRouter,
});

export type AppRouter = typeof appRouter;
