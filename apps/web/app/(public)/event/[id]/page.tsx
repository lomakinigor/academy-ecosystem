import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Globe2, MapPin, User2, Users } from "lucide-react";

import { Badge, Button, Card, CardContent } from "@academy/ui";
import { TRPCError } from "@trpc/server";

import { getCurrentUser } from "@/lib/auth/helpers";
import { getServerCaller } from "@/lib/trpc/server";

import { EVENT_TYPE_LABELS, type EventTypeValue } from "../../../admin/calendar/filters";

import { bookEventAction, cancelBookingAction } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}

const formatDate = (d: Date): string =>
  d.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (d: Date): string =>
  d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const formatPriceLong = (e: {
  pricing_type: "FIXED" | "DONATION" | "FREE";
  price: number | null;
  pricing_note: string | null;
}): string => {
  if (e.pricing_type === "FREE") return "Бесплатно";
  if (e.pricing_type === "DONATION") {
    return e.pricing_note ? `Донат · ${e.pricing_note}` : "Донат";
  }
  if (e.price == null || e.price === 0) {
    return e.pricing_note ?? "Цена не указана";
  }
  const rub = new Intl.NumberFormat("ru-RU").format(Number(e.price));
  return e.pricing_note ? `${rub} ₽ · ${e.pricing_note}` : `${rub} ₽`;
};

export default async function PublicEventPage({ params, searchParams }: PageProps) {
  const caller = await getServerCaller();
  let event;
  try {
    event = await caller.event.publicById({ id: params.id });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const user = await getCurrentUser();
  const myBooking = user
    ? await caller.booking.myForEvent({ event_id: event.id }).catch(() => null)
    : null;

  const eventType = event.type as EventTypeValue;
  const eventPrice = event.price ? Number(event.price) : null;

  const justBooked = searchParams.booked === "1";
  const justCancelled = searchParams.cancelled === "1";
  const startInPast = event.start_at.getTime() < Date.now();

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-brand-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />К расписанию
      </Link>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge>{EVENT_TYPE_LABELS[eventType]}</Badge>
            {event.is_online && (
              <Badge variant="outline" className="gap-1">
                <Globe2 className="size-3" aria-hidden />
                Онлайн
              </Badge>
            )}
            {event.tags.map((tag) => (
              <Badge key={tag} variant="muted">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="mt-3 font-heading text-3xl font-bold text-brand-primary sm:text-4xl">
            {event.title}
          </h1>

          {event.description && (
            <p className="mt-4 whitespace-pre-line text-base text-foreground/80">
              {event.description}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-foreground/50" aria-hidden />
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground/50">Дата</div>
                <div className="font-medium text-brand-primary">{formatDate(event.start_at)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Время</span>
              <span className="font-medium text-brand-primary">
                {formatTime(event.start_at)}–{formatTime(event.end_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User2 className="size-4 text-foreground/50" aria-hidden />
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground/50">Спикер</div>
                <div className="font-medium text-brand-primary">{event.speaker.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-foreground/50" aria-hidden />
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground/50">Место</div>
                <div className="font-medium text-brand-primary">
                  {event.branch ? `${event.branch.city} · ${event.branch.name}` : "Все филиалы"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Стоимость</span>
              <span className="font-medium text-brand-primary">
                {formatPriceLong({
                  pricing_type: event.pricing_type,
                  price: eventPrice,
                  pricing_note: event.pricing_note,
                })}
              </span>
            </div>
            {event.max_participants && (
              <div className="flex items-center gap-2">
                <Users className="size-4 text-foreground/50" aria-hidden />
                <div>
                  <div className="text-xs uppercase tracking-wider text-foreground/50">
                    Записано
                  </div>
                  <div className="font-medium text-brand-primary">
                    {event._count.bookings} / {event.max_participants}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-border pt-6">
            {justBooked && (
              <div className="mb-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                Заявка принята. Подробности появятся в личном кабинете.
              </div>
            )}
            {justCancelled && (
              <div className="mb-4 rounded-lg bg-muted px-4 py-3 text-sm text-foreground/80">
                Запись отменена.
              </div>
            )}

            {startInPast ? (
              <p className="text-sm text-foreground/60">Событие уже прошло.</p>
            ) : !user ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-foreground/70">
                  Чтобы записаться, войдите в аккаунт или зарегистрируйтесь.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="outline" size="lg">
                    <Link href={`/login?callbackUrl=${encodeURIComponent(`/event/${event.id}`)}`}>
                      Войти
                    </Link>
                  </Button>
                  <Button asChild variant="accent" size="lg">
                    <Link href={`/signup?callbackUrl=${encodeURIComponent(`/event/${event.id}`)}`}>
                      Зарегистрироваться
                    </Link>
                  </Button>
                </div>
              </div>
            ) : myBooking ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-foreground/80">
                  Вы записаны
                  {myBooking.status === "WAITLIST" ? " в лист ожидания" : ""}.
                </p>
                <form action={cancelBookingAction}>
                  <input type="hidden" name="event_id" value={event.id} />
                  <Button type="submit" variant="outline" size="lg">
                    Отменить запись
                  </Button>
                </form>
              </div>
            ) : (
              <form action={bookEventAction} className="flex justify-end">
                <input type="hidden" name="event_id" value={event.id} />
                <Button type="submit" variant="accent" size="lg">
                  Записаться
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
