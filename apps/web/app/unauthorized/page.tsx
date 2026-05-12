import Link from "next/link";
import { Lock } from "lucide-react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@academy/ui";

import { BrandMark } from "@/components/brand/brand-mark";
import { logoutAction } from "../logout/actions";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-warm px-4 py-12">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur">
        <CardHeader className="items-center text-center">
          <BrandMark size={64} className="mb-4" />
          <div
            aria-hidden
            className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
          >
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="font-display text-2xl">Доступ ограничен</CardTitle>
          <CardDescription>
            У вашей роли недостаточно прав для просмотра этой страницы. Если это ошибка — обратитесь
            к администратору филиала.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/student">В личный кабинет</Link>
          </Button>
          <form action={logoutAction}>
            <Button type="submit" variant="accent" size="lg">
              Сменить аккаунт
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
