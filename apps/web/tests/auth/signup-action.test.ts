import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/auth/device-session", () => ({
  prepareDeviceSession: vi.fn(async (remember: boolean) => ({ remember_device: String(remember) })),
}));

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  userContact: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@academy/db", () => ({
  prisma: prismaMock,
  Prisma: { PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {} },
}));

vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("password-hash") } }));

vi.mock("@/auth", () => ({ signIn: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import { signupAction } from "@/app/signup/actions";
import { signIn } from "@/auth";

const signInMock = vi.mocked(signIn);

const form = (data: Record<string, string>): FormData => {
  const result = new FormData();
  for (const [key, value] of Object.entries(data)) result.append(key, value);
  return result;
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.userContact.findUnique.mockResolvedValue(null);
  prismaMock.user.create.mockResolvedValue({ id: "new_client" });
  prismaMock.user.update.mockResolvedValue({ id: "manual_client" });
  signInMock.mockResolvedValue(undefined as never);
});

describe("signupAction — единая клиентская карточка", () => {
  it("добавляет email и пароль к ручной карточке с тем же email-контактом", async () => {
    prismaMock.userContact.findUnique.mockResolvedValue({ user_id: "manual_client" });

    await expect(
      signupAction(
        {},
        form({
          email: "Irina@Example.ru",
          name: "Ирина Иванова",
          password: "correct-password",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/student");

    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "manual_client" },
        data: expect.objectContaining({
          email: "irina@example.ru",
          password_hash: "password-hash",
        }),
      }),
    );
  });
});
