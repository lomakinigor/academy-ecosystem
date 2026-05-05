import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context, SessionUser } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Глобальные роли — видят данные всех филиалов без ограничений.
 * Все остальные (директор/админ филиала, магистры, мастера, слушатели)
 * видят только свой branch_id (плюс события с branch_id=null —
 * «общеакадемические», которые видны всем).
 */
const GLOBAL_SYSTEM_ROLES: ReadonlyArray<string> = ["PRESIDENT", "VICE_PRESIDENT"];

export const isGlobalUser = (user: SessionUser): boolean =>
  GLOBAL_SYSTEM_ROLES.includes(user.system_role);

/**
 * Branch scope — что юзер имеет право видеть.
 * - mode: "global" — без ограничений.
 * - mode: "scoped" — только указанный branch_id или null-события.
 */
export type BranchScope = { mode: "global" } | { mode: "scoped"; branch_id: string | null };

export const computeBranchScope = (user: SessionUser): BranchScope =>
  isGlobalUser(user) ? { mode: "global" } : { mode: "scoped", branch_id: user.branch_id };

/**
 * protectedBranchProcedure — авторизованный вызов с прикреплённым
 * branchScope в контексте. Роутеры (event.list и т.п.) обязаны
 * учитывать его в where-фильтрах.
 */
export const protectedBranchProcedure = protectedProcedure.use(({ ctx, next }) =>
  next({
    ctx: {
      ...ctx,
      branchScope: computeBranchScope(ctx.user),
    },
  }),
);
