import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../src/root";
import type { Context, SessionUser } from "../src/context";

const setup = (system_role = "BRANCH_ADMIN", academic_level = "LISTENER") => {
  const user = {
    id: "user1",
    email: "admin@example.test",
    name: "Администратор",
    system_role,
    academic_level,
    branch_id: "branch1",
    is_speaker: false,
  } as SessionUser;
  const prisma = {
    event: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  const ctx = { session: { user }, prisma } as unknown as Context;
  return { caller: appRouter.createCaller(ctx), prisma };
};
const range = { from: new Date("2026-06-01"), to: new Date("2026-06-30") };
const conflict = {
  start_at: range.from,
  end_at: range.to,
  speaker_id: "speaker1",
  branch_id: "branch2",
};

describe("Общее расписание MVP", () => {
  it("администратору не добавляет филиальный фильтр даже из старого URL", async () => {
    const { caller, prisma } = setup();
    await caller.event.list({ ...range, branch_id: "branch2" });
    const where = prisma.event.findMany.mock.calls[0]![0].where;
    expect(JSON.stringify(where)).not.toMatch(/branch_id|__never__/);
  });
  it("проверяет конфликты во всей базе", async () => {
    const { caller, prisma } = setup();
    await caller.event.conflicts(conflict);
    expect(prisma.event.findMany.mock.calls[0]![0].where.branch_id).toBeUndefined();
  });
  it("список спикеров администратора общий", async () => {
    const { caller, prisma } = setup();
    await caller.user.listSpeakers();
    expect(prisma.user.findMany.mock.calls[0]![0].where).toEqual({ is_speaker: true });
  });
  it.each(["LISTENER", "MASTER", "MAGISTER", "FOUNDER"])(
    "STUDENT/%s не получает право записи",
    async (level) => {
      const { caller, prisma } = setup("STUDENT", level);
      await expect(
        caller.event.create({
          title: "Семинар",
          type: "SEMINAR",
          speaker_id: "speaker1",
          start_at: range.from,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.event.update({ id: "event1", title: "Изменение" })).rejects.toMatchObject(
        { code: "FORBIDDEN" },
      );
      await expect(caller.event.delete({ id: "event1" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller.event.conflicts(conflict)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.user.createSpeaker({ name: "Спикер" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        caller.user.updateSpeaker({ id: "speaker1", name: "Спикер" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.user.deleteSpeaker({ id: "speaker1" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(prisma.event.create).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    },
  );
});
