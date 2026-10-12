import { TRPCError } from "@trpc/server";

import type { SessionUser } from "../context";
import { clientCreateSchema } from "../schemas/client";
import { protectedProcedure, router } from "../trpc";

const CLIENT_MANAGER_ROLES = new Set([
  "PRESIDENT",
  "VICE_PRESIDENT",
  "BRANCH_DIRECTOR",
  "BRANCH_ADMIN",
]);

export const canManageClients = (user: SessionUser): boolean =>
  CLIENT_MANAGER_ROLES.has(user.system_role);

const assertCanManageClients = (user: SessionUser) => {
  if (!canManageClients(user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Нет доступа к базе клиентов" });
  }
};

const normalizeContactValue = (
  channel: "EMAIL" | "TELEGRAM" | "WHATSAPP" | "MAX",
  value: string,
) => {
  const trimmed = value.trim();
  if (channel === "EMAIL") return trimmed.toLowerCase();
  if (channel === "TELEGRAM") return trimmed.replace(/^@/, "").toLowerCase();
  return trimmed.replace(/[^\d+]/g, "");
};

/** Клиентская база MVP. Доступна только BRANCH_ADMIN и выше. */
export const clientRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    assertCanManageClients(ctx.user);

    return ctx.prisma.user.findMany({
      where: { is_speaker: false },
      select: {
        id: true,
        name: true,
        createdAt: true,
        contacts: {
          select: { channel: true, value: true, verified_at: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure.input(clientCreateSchema).mutation(async ({ ctx, input }) => {
    assertCanManageClients(ctx.user);

    return ctx.prisma.user.create({
      data: {
        name: input.name,
        email: null,
        password_hash: null,
        contacts: {
          create: input.contacts.map((contact) => ({
            channel: contact.channel,
            value: contact.value.trim(),
            normalized_value: normalizeContactValue(contact.channel, contact.value),
          })),
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        contacts: {
          select: { channel: true, value: true, verified_at: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }),
});
