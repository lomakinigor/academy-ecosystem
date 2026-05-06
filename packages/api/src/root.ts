import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { branchRouter } from "./routers/branch";
import { bookingRouter } from "./routers/booking";
import { eventRouter } from "./routers/event";
import { userRouter } from "./routers/user";

export const appRouter = router({
  health: healthRouter,
  branch: branchRouter,
  booking: bookingRouter,
  event: eventRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
