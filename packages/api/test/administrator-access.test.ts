import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../src/root";
import type { Context } from "../src/context";

const setup = (id = "owner1") => {
  const prisma = {
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const session = {
    user: {
      id,
      email: "not-used@example.test",
      name: "User",
      system_role: "BRANCH_ADMIN",
      academic_level: "LISTENER",
      branch_id: null,
      is_speaker: false,
    },
  };
  return { prisma, caller: appRouter.createCaller({ session, prisma } as unknown as Context) };
};
beforeEach(() => vi.stubEnv("OWNER_USER_ID", "owner1"));
afterEach(() => vi.unstubAllEnvs());

describe("Назначение администраторов владельцем", () => {
  it("владелец назначает один уровень админов без изменения пароля/филиала", async () => {
    const { caller, prisma } = setup();
    await caller.administration.setAdmin({ id: "client1", isAdmin: true });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "client1", email: { not: null }, password_hash: { not: null } },
      data: { system_role: "BRANCH_ADMIN" },
    });
  });
  it("снимает права до обычного клиента", async () => {
    const { caller, prisma } = setup();
    await caller.administration.setAdmin({ id: "client1", isAdmin: false });
    expect(prisma.user.updateMany.mock.calls[0]![0].data).toEqual({ system_role: "STUDENT" });
  });
  it("администратор не назначает других и не видит список управления", async () => {
    const { caller, prisma } = setup("admin1");
    await expect(caller.administration.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.administration.setAdmin({ id: "client1", isAdmin: true }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
  it("без настройки владельца fail closed", async () => {
    vi.stubEnv("OWNER_USER_ID", "");
    await expect(setup().caller.administration.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("не позволяет снять собственные права", async () => {
    const { caller, prisma } = setup();
    await expect(
      caller.administration.setAdmin({ id: "owner1", isAdmin: false }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
  it("не назначает карточку без регистрации", async () => {
    const { caller, prisma } = setup();
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      caller.administration.setAdmin({ id: "client1", isAdmin: true }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(prisma.user.updateMany.mock.calls[0]![0].where).toMatchObject({
      email: { not: null },
      password_hash: { not: null },
    });
  });
});
