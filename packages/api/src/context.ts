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
}

export interface CreateContextOptions {
  session: { user: SessionUser } | null;
}

export const createContextInner = (opts: CreateContextOptions) => ({
  session: opts.session,
  prisma,
});

export const createContext = async (
  opts: CreateContextOptions,
): Promise<ReturnType<typeof createContextInner>> => createContextInner(opts);

export type Context = inferAsyncReturnType<typeof createContext>;
