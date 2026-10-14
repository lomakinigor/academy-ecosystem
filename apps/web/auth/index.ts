import NextAuth from "next-auth";
import { buildAuthConfig } from "./config";
import { cookies } from "next/headers";
import { DEVICE_SESSION_COOKIE } from "./device-session";

export const { handlers, auth, signIn, signOut } = NextAuth((request) => {
  const nonce = request
    ? request.headers
        .get("cookie")
        ?.split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${DEVICE_SESSION_COOKIE}=`))
        ?.slice(DEVICE_SESSION_COOKIE.length + 1)
    : cookies().get(DEVICE_SESSION_COOKIE)?.value;
  return buildAuthConfig(undefined, nonce);
});
