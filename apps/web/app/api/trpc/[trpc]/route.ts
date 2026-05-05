import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContextInner, type SessionUser } from "@academy/api";
import { auth } from "@/auth";

const handler = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
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

      return createContextInner({
        session: sessionUser ? { user: sessionUser } : null,
      });
    },
    onError({ error, path }) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error(`[tRPC error] ${path ?? "<unknown>"}: ${error.message}`);
      }
    },
  });
};

export { handler as GET, handler as POST };
