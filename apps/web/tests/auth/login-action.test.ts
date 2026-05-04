import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthError } from "next-auth";

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import { loginAction } from "@/app/login/actions";
import { signIn } from "@/auth";

const signInMock = vi.mocked(signIn);

function form(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) fd.append(key, value);
  return fd;
}

class CredentialsSignin extends AuthError {
  constructor() {
    super("CredentialsSignin");
  }
}

beforeEach(() => {
  signInMock.mockReset();
});

describe("loginAction — Zod validation", () => {
  it("rejects an invalid email format", async () => {
    const result = await loginAction(
      {},
      form({ email: "not-an-email", password: "validpass1" }),
    );
    expect(result.fieldErrors?.email).toBeTruthy();
    expect(result.error).toBe("Проверьте введённые данные");
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const result = await loginAction(
      {},
      form({ email: "user@academy.ru", password: "short" }),
    );
    expect(result.fieldErrors?.password).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("collects errors for both fields when both are invalid", async () => {
    const result = await loginAction({}, form({ email: "x", password: "y" }));
    expect(result.fieldErrors?.email).toBeTruthy();
    expect(result.fieldErrors?.password).toBeTruthy();
  });

  it("treats missing fields as invalid input", async () => {
    const result = await loginAction({}, form({}));
    expect(result.error).toBe("Проверьте введённые данные");
    expect(signInMock).not.toHaveBeenCalled();
  });
});

describe("loginAction — sign-in flow", () => {
  it("returns a generic Russian error message on AuthError", async () => {
    signInMock.mockRejectedValueOnce(new CredentialsSignin());
    const result = await loginAction(
      {},
      form({ email: "user@academy.ru", password: "validpass1" }),
    );
    expect(result.error).toBe("Неверный email или пароль");
    expect(result.fieldErrors).toBeUndefined();
  });

  it("rethrows non-AuthError exceptions (do not mask infra failures)", async () => {
    signInMock.mockRejectedValueOnce(new Error("database unreachable"));
    await expect(
      loginAction({}, form({ email: "user@academy.ru", password: "validpass1" })),
    ).rejects.toThrowError("database unreachable");
  });

  it("redirects to /student by default on success", async () => {
    signInMock.mockResolvedValueOnce(undefined as never);
    await expect(
      loginAction({}, form({ email: "user@academy.ru", password: "validpass1" })),
    ).rejects.toThrowError(/NEXT_REDIRECT:\/student/);
  });

  it("redirects to callbackUrl when provided", async () => {
    signInMock.mockResolvedValueOnce(undefined as never);
    await expect(
      loginAction(
        {},
        form({
          email: "user@academy.ru",
          password: "validpass1",
          callbackUrl: "/admin/users",
        }),
      ),
    ).rejects.toThrowError(/NEXT_REDIRECT:\/admin\/users/);
  });

  it("invokes signIn with credentials provider and redirect:false", async () => {
    signInMock.mockResolvedValueOnce(undefined as never);
    try {
      await loginAction(
        {},
        form({ email: "user@academy.ru", password: "validpass1" }),
      );
    } catch {
      /* swallow the mocked redirect */
    }
    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "user@academy.ru",
      password: "validpass1",
      redirect: false,
    });
  });
});
