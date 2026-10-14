import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../src/root";
import type { Context } from "../src/context";

const setup = (id = "owner1") => {
  const prisma = {
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi.fn().mockResolvedValue({ id: "client1" }),
      count: vi.fn().mockResolvedValue(1),
      update: vi.fn().mockResolvedValue({ id: "client1", is_owner: true }),
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
      is_owner: id === "owner1" || id === "coowner1",
    },
  };
  const db = {
    ...prisma,
    $transaction: vi.fn(async (fn: (tx: typeof prisma) => unknown) => fn(prisma)),
  };
  return { prisma, caller: appRouter.createCaller({ session, prisma: db } as unknown as Context) };
};
beforeEach(() => vi.stubEnv("OWNER_USER_ID", "owner1"));
afterEach(() => vi.unstubAllEnvs());

describe("Назначение администраторов владельцем", () => {
  it("совладелец может управлять администраторами", async () => {
    await expect(setup("coowner1").caller.administration.list()).resolves.toEqual([]);
  });
  it("совладелец не может снять права первичного владельца", async () => {
    const { caller } = setup("coowner1");
    await expect(
      caller.administration.setOwner({ id: "owner1", isOwner: false }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("первичный владелец может снять себя, когда есть другой владелец", async () => {
    const { caller, prisma } = setup();
    await caller.administration.setOwner({ id: "owner1", isOwner: false });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "owner1" },
      data: { is_owner: false },
    });
  });
  it("нельзя снять последнего владельца", async () => {
    const { caller, prisma } = setup();
    prisma.user.count.mockResolvedValue(0);
    await expect(
      caller.administration.setOwner({ id: "owner1", isOwner: false }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it("новый владелец получает административные права", async () => {
    const { caller, prisma } = setup();
    await caller.administration.setOwner({ id: "client1", isOwner: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "client1" },
      data: { is_owner: true, system_role: "BRANCH_ADMIN" },
    });
  });
  it("владелец назначает один уровень админов без изменения пароля/филиала", async () => {
    const { caller, prisma } = setup();
    await caller.administration.setAdmin({ id: "client1", isAdmin: true });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "client1", is_owner: false, email: { not: null }, password_hash: { not: null } },
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
