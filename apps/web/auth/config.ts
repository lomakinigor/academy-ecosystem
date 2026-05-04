import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { defaultUserRepository, type UserRepository } from "./user-repository";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export function buildAuthConfig(
  repository: UserRepository = defaultUserRepository,
): NextAuthConfig {
  return {
    session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
    pages: {
      signIn: "/login",
      error: "/login",
    },
    providers: [
      Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(rawCredentials) {
          const parsed = credentialsSchema.safeParse(rawCredentials);
          if (!parsed.success) return null;

          const user = await repository.findByEmail(parsed.data.email);
          if (!user) return null;

          const ok = await bcrypt.compare(parsed.data.password, user.password_hash);
          if (!ok) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            system_role: user.system_role,
            academic_level: user.academic_level,
            branch_id: user.branch_id,
            is_speaker: user.is_speaker,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user && user.id) {
          token.id = user.id;
          token.system_role = user.system_role;
          token.academic_level = user.academic_level;
          token.branch_id = user.branch_id;
          token.is_speaker = user.is_speaker;
        }
        return token;
      },
      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = token.id;
          session.user.system_role = token.system_role;
          session.user.academic_level = token.academic_level;
          session.user.branch_id = token.branch_id;
          session.user.is_speaker = token.is_speaker;
        }
        return session;
      },
    },
  };
}

export const authConfig = buildAuthConfig();
