"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@academy/db";
import { prisma } from "@academy/db";
import { z } from "zod";

import { signIn } from "@/auth";

const signupSchema = z.object({
  email: z.string().email("Некорректный email").max(254),
  name: z.string().trim().min(2, "Минимум 2 символа").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Невалидный телефон")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  password: z
    .string()
    .min(8, "Пароль не короче 8 символов")
    .max(128, "Пароль не длиннее 128 символов"),
  callbackUrl: z.string().optional(),
});

export type SignupState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "name" | "phone" | "password", string>>;
};

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const rawPhone = formData.get("phone");
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    phone: typeof rawPhone === "string" ? rawPhone : undefined,
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: SignupState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "name" || field === "phone" || field === "password") {
        fieldErrors[field] = issue.message;
      }
    }
    return { error: "Проверьте введённые данные", fieldErrors };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password_hash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        phone: parsed.data.phone,
        password_hash,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Этот email уже зарегистрирован",
        fieldErrors: { email: "Email уже используется" },
      };
    }
    throw err;
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      // Аккаунт создался, но авто-логин не прошёл — пусть юзер залогинится вручную
      redirect(
        `/login?registered=1${parsed.data.callbackUrl ? `&callbackUrl=${encodeURIComponent(parsed.data.callbackUrl)}` : ""}`,
      );
    }
    throw err;
  }

  redirect(parsed.data.callbackUrl || "/student");
}
