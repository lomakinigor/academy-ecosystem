import type { inferAsyncReturnType } from "@trpc/server";
import { prisma } from "@academy/db";

/**
 * Сессия пользователя — placeholder.
 * Agent AUTH заполнит реальной формой из NextAuth (id, system_role, academic_level, branch_id, is_speaker).
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  system_role: string;
  academic_level: string;
  branch_id: string | null;
  is_speaker: boolean;
  is_owner?: boolean;
}

export interface CreateContextOptions {
  session: { user: SessionUser } | null;
}

export const createContextInner = (opts: CreateContextOptions) => ({
  session: opts.session,
  prisma,
});

/** Роль JWT не является источником прав после их изменения владельцем. */
export const refreshSessionUser = async (
  user: SessionUser,
  db: Pick<typeof prisma, "user"> = prisma,
): Promise<SessionUser | null> => {
  const current = await db.user.findFirst({
    where: { id: user.id, email: { not: null }, password_hash: { not: null } },
    select: {
      id: true,
      email: true,
      name: true,
      system_role: true,
      academic_level: true,
      branch_id: true,
      is_speaker: true,
      is_owner: true,
    },
  });
  return current?.email ? { ...current, email: current.email } : null;
};

export const createContext = async (
  opts: CreateContextOptions,
): Promise<ReturnType<typeof createContextInner>> => {
  const user = opts.session?.user ? await refreshSessionUser(opts.session.user) : null;
  return createContextInner({ session: user ? { user } : null });
};

export type Context = inferAsyncReturnType<typeof createContext>;
