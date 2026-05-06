import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { branchRouter } from "./routers/branch";
import { eventRouter } from "./routers/event";
import { userRouter } from "./routers/user";

export const appRouter = router({
  health: healthRouter,
  branch: branchRouter,
  event: eventRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
