import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@academy/ui";

import { auth } from "@/auth";
import { SystemRole, SYSTEM_ROLE_RANK } from "@/lib/auth/types";
import { BrandMark } from "@/components/brand/brand-mark";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; registered?: string };
}) {
  const session = await auth();
  if (session?.user) {
    const role = (session.user as { system_role?: SystemRole }).system_role;
    const rank = role ? (SYSTEM_ROLE_RANK[role] ?? 0) : 0;
    const dest =
      searchParams?.callbackUrl ??
      (rank >= SYSTEM_ROLE_RANK[SystemRole.BRANCH_ADMIN] ? "/admin/calendar" : "/student");
    redirect(dest);
  }

  const callbackUrl = searchParams?.callbackUrl;
  const signupHref = callbackUrl
    ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/signup";
  const justRegistered = searchParams?.registered === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-warm px-4 py-12">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur">
        <CardHeader className="items-center text-center">
          <BrandMark size={64} className="mb-4" />
          <CardTitle className="font-display text-2xl">Вход в Академию</CardTitle>
          <CardDescription>Используйте email и пароль, чтобы войти</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {justRegistered ? (
            <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              Аккаунт создан. Войдите, используя ваш email и пароль.
            </p>
          ) : null}
          <LoginForm callbackUrl={callbackUrl} />
          <p className="text-center text-sm text-foreground/70">
            Нет аккаунта?{" "}
            <Link
              href={signupHref}
              className="font-medium text-brand-primary underline-offset-4 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
