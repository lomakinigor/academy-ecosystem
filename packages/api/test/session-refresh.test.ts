import { describe, expect, it, vi } from "vitest";
import { refreshSessionUser, type SessionUser } from "../src/context";

const user: SessionUser = {
  id: "user1",
  email: "user@example.test",
  name: "User",
  system_role: "BRANCH_ADMIN",
  academic_level: "LISTENER",
  branch_id: null,
  is_speaker: false,
};
describe("Текущие права вместо старых JWT claims", () => {
  it("снятый владелец не сохраняет права из старой сессии", async () => {
    const db = { user: { findFirst: vi.fn().mockResolvedValue({ ...user, is_owner: false }) } };
    const current = await refreshSessionUser({ ...user, is_owner: true }, db as never);
    expect(current?.is_owner).toBe(false);
    expect(db.user.findFirst.mock.calls[0]![0].select.is_owner).toBe(true);
  });
  it("использует актуальную роль STUDENT из базы после снятия админа", async () => {
    const db = {
      user: { findFirst: vi.fn().mockResolvedValue({ ...user, system_role: "STUDENT" }) },
    };
    const current = await refreshSessionUser(user, db as never);
    expect(current?.system_role).toBe("STUDENT");
    expect(db.user.findFirst.mock.calls[0]![0].where.id).toBe(user.id);
  });
  it("удалённый/неактивный аккаунт не сохраняет прежние права", async () => {
    const db = { user: { findFirst: vi.fn().mockResolvedValue(null) } };
    expect(await refreshSessionUser(user, db as never)).toBeNull();
  });
  it("при сбое базы не возвращает старую роль", async () => {
    const db = {
      user: { findFirst: vi.fn().mockRejectedValue(new Error("database unavailable")) },
    };
    await expect(refreshSessionUser(user, db as never)).rejects.toThrow("database unavailable");
  });
});
