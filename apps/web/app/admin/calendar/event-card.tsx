"use client";

import Link from "next/link";
import { Globe2, MapPin, User2, Users } from "lucide-react";

import { Badge, Card, CardContent } from "@academy/ui";

import { EVENT_TYPE_LABELS, type EventTypeValue } from "./filters";

export interface EventCardData {
  id: string;
  title: string;
  description: string | null;
  type: EventTypeValue;
  status: "DRAFT" | "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  start_at: Date;
  end_at: Date;
  is_online: boolean;
  pricing_type: "FIXED" | "DONATION" | "FREE";
  price: number | null;
  pricing_note: string | null;
  tags: string[];
  max_participants: number | null;
  branch: { id: string; name: string; city: string } | null;
  speaker: { id: string; name: string; avatar: string | null };
  bookings_count: number;
}

interface EventCardProps {
  event: EventCardData;
  onClick?: () => void;
  /**
   * Если задан — карточка рендерится как ссылка-обёртка (публичный режим).
   * Взаимоисключающе с onClick: при наличии href onClick игнорируется.
   */
  href?: string;
}

const TYPE_BADGE_VARIANT: Record<
  EventTypeValue,
  "default" | "accent" | "outline" | "success" | "warning" | "muted"
> = {
  SEMINAR: "default",
  PRACTICE: "accent",
  WEBINAR: "success",
  COURSE: "warning",
  RETREAT: "outline",
  TRIP: "muted",
  MASTERCLASS: "accent",
  GRADING: "warning",
};

const monthShort = (d: Date): string =>
  d.toLocaleDateString("ru-RU", { month: "short" }).replace(/\.$/, "").toUpperCase();

const formatTime = (d: Date): string =>
  d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const formatPrice = (e: EventCardData): string => {
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

export function EventCard({ event, onClick, href }: EventCardProps) {
  const dayNum = event.start_at.getDate();
  const monthLabel = monthShort(event.start_at);
  const startTime = formatTime(event.start_at);
  const endTime = formatTime(event.end_at);
  const capacityPct =
    event.max_participants && event.max_participants > 0
      ? Math.min(100, Math.round((event.bookings_count / event.max_participants) * 100))
      : null;

  const isClickable = Boolean(onClick) || Boolean(href);
  const handleKey = (e: React.KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const cardClass = `overflow-hidden transition-shadow duration-250 hover:shadow-soft-md ${
    isClickable
      ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
      : ""
  }`;

  const cardInner = (
    <CardContent className="flex gap-4 p-4 sm:p-5">
      {/* Date column */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-start rounded-lg bg-brand-warm px-2 py-3 text-brand-primary sm:w-16">
        <span className="font-heading text-3xl font-bold leading-none">{dayNum}</span>
        <span className="mt-1 font-heading text-[10px] font-semibold tracking-wider text-foreground/70">
          {monthLabel}
        </span>
        <span className="mt-2 text-[11px] text-foreground/60">{startTime}</span>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={TYPE_BADGE_VARIANT[event.type]}>{EVENT_TYPE_LABELS[event.type]}</Badge>
          {event.is_online && (
            <Badge variant="outline" className="gap-1">
              <Globe2 className="size-3" />
              Онлайн
            </Badge>
          )}
          {event.tags.map((tag) => (
            <Badge key={tag} variant="muted">
              {tag}
            </Badge>
          ))}
        </div>

        <h3 className="mt-2 font-heading text-lg font-semibold text-brand-primary">
          {event.title}
        </h3>

        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{event.description}</p>
        )}

        <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-foreground/80">
            <User2 className="size-4 text-foreground/50" aria-hidden />
            <span>{event.speaker.name}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <MapPin className="size-4 text-foreground/50" aria-hidden />
            <span>{event.branch ? event.branch.city : "Все филиалы"}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <span className="text-xs text-foreground/50">Время</span>
            <span>
              {startTime}–{endTime}
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <span className="text-xs text-foreground/50">Стоимость</span>
            <span>{formatPrice(event)}</span>
          </div>
        </div>

        {capacityPct !== null && event.max_participants && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden />
                {event.bookings_count} / {event.max_participants} записано
              </span>
              <span>{capacityPct}%</span>
            </div>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={`Заполненность ${capacityPct}%`}
              {...{
                "aria-valuenow": capacityPct,
                "aria-valuemin": 0,
                "aria-valuemax": 100,
              }}
            >
              <div
                className="h-full bg-brand-accent transition-[width] duration-350"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block" data-testid="event-card-link">
        <Card data-testid="event-card" className={cardClass}>
          {cardInner}
        </Card>
      </Link>
    );
  }

  return (
    <Card
      data-testid="event-card"
      onClick={onClick}
      onKeyDown={handleKey}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cardClass}
    >
      {cardInner}
    </Card>
  );
}
