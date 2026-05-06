import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@academy/ui";

import { auth } from "@/auth";
import { BrandMark } from "@/components/brand/brand-mark";

import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const session = await auth();
  if (session?.user) {
    redirect(searchParams?.callbackUrl || "/student");
  }

  const callbackUrl = searchParams?.callbackUrl;
  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-warm px-4 py-12">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur">
        <CardHeader className="items-center text-center">
          <BrandMark size={64} className="mb-4" />
          <CardTitle className="font-display text-2xl">Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт, чтобы записываться на мероприятия академии
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SignupForm callbackUrl={callbackUrl} />
          <p className="text-center text-sm text-foreground/70">
            Уже есть аккаунт?{" "}
            <Link
              href={loginHref}
              className="font-medium text-brand-primary underline-offset-4 hover:underline"
            >
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
