import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@academy/ui";

import { BrandMark } from "@/components/brand/brand-mark";
import { Wordmark } from "@/components/brand/wordmark";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-warm px-6 py-16">
      <section className="flex w-full max-w-5xl flex-col items-center gap-10 md:flex-row md:items-center md:justify-center md:gap-12">
        <BrandMark size={240} isPriority className="shrink-0" />
        <Wordmark variant="three-line" />
      </section>

      <Card className="mt-16 w-full max-w-2xl bg-white/70 backdrop-blur">
        <CardHeader className="items-center text-center">
          <Badge variant="success" className="mb-3">
            Этап 0 завершён
          </Badge>
          <CardTitle className="font-display text-2xl">
            Интеллектуальная экосистема академии
          </CardTitle>
          <CardDescription className="max-w-md text-base">
            Платформа управления мероприятиями, академическим прогрессом и финансовым учётом. Для
            слушателей, мастеров, магистров и администрации сети филиалов.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button asChild variant="accent" size="lg">
            <Link href="/login">Войти в кабинет</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="https://svetlov.academy/" target="_blank" rel="noreferrer">
              Сайт академии
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
