import { beforeEach, describe, expect, it, vi } from "vitest";
const store = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => store }));
import { DEVICE_SESSION_COOKIE, prepareDeviceSession } from "@/auth/device-session";
beforeEach(() => vi.clearAllMocks());
describe("Cookie чужого устройства", () => {
  it("без срока хранения, HttpOnly и SameSite", async () => {
    const result = await prepareDeviceSession(false);
    expect(result.remember_device).toBe("false");
    expect(result.browser_session_id).toMatch(/^[a-f0-9]{64}$/);
    expect(store.set).toHaveBeenCalledWith(DEVICE_SESSION_COOKIE, result.browser_session_id, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
  });
  it("личный вход очищает старый временный маркер", async () => {
    expect(await prepareDeviceSession(true)).toEqual({ remember_device: "true" });
    expect(store.delete).toHaveBeenCalledWith(DEVICE_SESSION_COOKIE);
    expect(store.set).not.toHaveBeenCalled();
  });
});
