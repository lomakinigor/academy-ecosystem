import "server-only";
import { appRouter, createContextInner, type SessionUser } from "@academy/api";
import { auth } from "@/auth";

/**
 * Server-side tRPC caller — для RSC / server components / server actions.
 * Использовать вместо HTTP, чтобы избежать лишнего round-trip.
 *
 * Пример: `const events = await getServerCaller().then(c => c.event.list({...}));`
 */
export async function getServerCaller() {
  const session = await auth();
  const sessionUser: SessionUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? "",
        system_role: session.user.system_role,
        academic_level: session.user.academic_level,
        branch_id: session.user.branch_id,
        is_speaker: session.user.is_speaker,
      }
    : null;

  const ctx = createContextInner({
    session: sessionUser ? { user: sessionUser } : null,
  });

  return appRouter.createCaller(ctx);
}
