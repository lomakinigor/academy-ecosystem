import { cookies } from "next/headers";

export const DEVICE_SESSION_COOKIE = "academy.browser-session";

export async function prepareDeviceSession(remember: boolean) {
  const store = cookies();
  if (remember) {
    store.delete(DEVICE_SESSION_COOKIE);
    return { remember_device: "true" as const };
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  store.set(DEVICE_SESSION_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return { remember_device: "false" as const, browser_session_id: nonce };
}
