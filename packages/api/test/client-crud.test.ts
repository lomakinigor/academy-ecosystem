import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

import { appRouter } from "../src/root";
import type { Context, SessionUser } from "../src/context";

const session = (overrides: Partial<SessionUser> = {}) => ({
  user: {
    id: "u_admin",
    email: "admin@academy.ru",
    name: "Администратор",
    system_role: "BRANCH_ADMIN",
    academic_level: "LISTENER",
    branch_id: null,
    is_speaker: false,
    ...overrides,
  } satisfies SessionUser,
});

const makePrisma = () => ({
  user: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({
      id: "client_1",
      name: "Ирина Иванова",
      createdAt: new Date("2026-10-12T10:00:00Z"),
      contacts: [{ channel: "TELEGRAM", value: "@irina", verified_at: null }],
    }),
  },
});

const makeCtx = (sess: Context["session"], prisma = makePrisma()): Context => ({
  session: sess,
  prisma: prisma as unknown as Context["prisma"],
});

describe("clientRouter", () => {
  it("BRANCH_ADMIN создаёт ручную клиентскую карточку без доступа по паролю", async () => {
    const prisma = makePrisma();
    const ctx = makeCtx(session(), prisma);

    await expect(
      appRouter.createCaller(ctx).clients.create({
        name: "Ирина Иванова",
        contacts: [{ channel: "TELEGRAM", value: "@irina" }],
      }),
    ).resolves.toEqual(expect.objectContaining({ id: "client_1" }));

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Ирина Иванова",
          email: null,
          password_hash: null,
        }),
      }),
    );
  });

  it("список клиентов доступен только администратору и выше", async () => {
    const ctx = makeCtx(session({ system_role: "STUDENT" }));

    await expect(appRouter.createCaller(ctx).clients.list()).rejects.toThrow(TRPCError);
  });
});
