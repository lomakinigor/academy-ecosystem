import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@academy/ui";

import { auth } from "@/auth";
import { BrandMark } from "@/components/brand/brand-mark";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const session = await auth();
  if (session?.user) {
    redirect(searchParams?.callbackUrl || "/student");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-warm px-4 py-12">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur">
        <CardHeader className="items-center text-center">
          <BrandMark size={64} className="mb-4" />
          <CardTitle className="font-display text-2xl">Вход в Академию</CardTitle>
          <CardDescription>Используйте email и пароль, выданные при регистрации</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={searchParams?.callbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
