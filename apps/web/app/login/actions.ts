"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/auth";
import { auth } from "@/auth";
import { SystemRole, SYSTEM_ROLE_RANK } from "@/lib/auth/types";

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль не короче 8 символов"),
  callbackUrl: z.string().optional(),
});

export type LoginState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        fieldErrors[field] = issue.message;
      }
    }
    return { error: "Проверьте введённые данные", fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Неверный email или пароль" };
    }
    throw err;
  }

  if (parsed.data.callbackUrl) {
    redirect(parsed.data.callbackUrl);
  }

  const session = await auth();
  const role = (session?.user as { system_role?: SystemRole } | undefined)?.system_role;
  const rank = role ? (SYSTEM_ROLE_RANK[role] ?? 0) : 0;
  redirect(rank >= SYSTEM_ROLE_RANK[SystemRole.BRANCH_ADMIN] ? "/admin/calendar" : "/student");
}
