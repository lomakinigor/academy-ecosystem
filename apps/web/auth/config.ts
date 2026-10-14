import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { encode } from "next-auth/jwt";

import { defaultUserRepository, type UserRepository } from "./user-repository";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  remember_device: z.enum(["true", "false"]).default("true"),
  browser_session_id: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
});

export function buildAuthConfig(
  repository: UserRepository = defaultUserRepository,
  browserSession?: string,
): NextAuthConfig {
  return {
    session: { strategy: "jwt", maxAge: 90 * 86400 },
    jwt: {
      encode: (params) =>
        encode({
          ...params,
          maxAge:
            typeof params.token?.valid_until === "number"
              ? Math.max(1, Math.floor((params.token.valid_until - Date.now()) / 1000))
              : params.maxAge,
        }),
    },
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
          if (parsed.data.remember_device === "false" && !parsed.data.browser_session_id)
            return null;

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
            remember_device: parsed.data.remember_device === "true",
            browser_session_id: parsed.data.browser_session_id,
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
          token.remember_device = user.remember_device !== false;
          token.browser_session_id = token.remember_device ? undefined : user.browser_session_id;
          token.valid_until = Date.now() + (token.remember_device ? 90 * 86400 : 8 * 3600) * 1000;
        }
        if (!user && token.valid_until === undefined && typeof token.exp === "number") {
          token.valid_until = token.exp * 1000;
        }
        if (typeof token.valid_until === "number" && token.valid_until <= Date.now()) return null;
        if (
          !user &&
          token.remember_device === false &&
          (!browserSession || browserSession !== token.browser_session_id)
        )
          return null;
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
