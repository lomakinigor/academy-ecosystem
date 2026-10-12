import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { branchRouter } from "./routers/branch";
import { bookingRouter } from "./routers/booking";
import { clientRouter } from "./routers/client";
import { eventRouter } from "./routers/event";
import { userRouter } from "./routers/user";

export const appRouter = router({
  health: healthRouter,
  branch: branchRouter,
  booking: bookingRouter,
  clients: clientRouter,
  event: eventRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
