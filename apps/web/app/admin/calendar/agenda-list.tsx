import { Calendar } from "lucide-react";

import { EventCard, type EventCardData } from "./event-card";

interface AgendaListProps {
  events: EventCardData[];
  onEventClick?: (event: EventCardData) => void;
  /**
   * Если задан — карточки рендерятся как <Link href=...> вместо клика.
   * Используется на публичной /calendar и публичной главной.
   */
  hrefBuilder?: (event: EventCardData) => string;
  from?: Date;
  to?: Date;
}

const isoDay = (d: Date, allDay = false): string =>
  allDay
    ? d.toISOString().slice(0, 10)
    : d.toLocaleDateString("en-CA", { timeZone: "Asia/Yekaterinburg" });

const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  const dayPart = d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
  const weekdayPart = d.toLocaleDateString("ru-RU", { weekday: "long", timeZone: "UTC" });
  return `${dayPart}, ${weekdayPart}`;
};

export function AgendaList({ events, onEventClick, hrefBuilder, from, to }: AgendaListProps) {
  if (events.length === 0) {
    return (
      <div
        data-testid="agenda-empty"
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center"
      >
        <div className="rounded-full bg-brand-warm p-4">
          <Calendar className="size-8 text-brand-earth" aria-hidden />
        </div>
        <h3 className="mt-4 font-heading text-lg font-semibold text-brand-primary">
          Нет событий в выбранном периоде
        </h3>
        <p className="mt-1 max-w-md text-sm text-foreground/60">
          Попробуйте расширить диапазон дат или очистить фильтры.
        </p>
      </div>
    );
  }

  // Группировка по дню
  const groups = new Map<string, EventCardData[]>();
  for (const ev of events) {
    const first = isoDay(ev.start_at, ev.is_all_day);
    const last = isoDay(
      new Date(Math.max(ev.start_at.getTime(), (ev.end_at ?? ev.start_at).getTime() - 1)),
      ev.is_all_day,
    );
    const lower = from ? isoDay(from) : first;
    const upper = to ? isoDay(to) : last;
    const cursor = new Date(`${first < lower ? lower : first}T00:00Z`);
    const final = last > upper ? upper : last;
    for (
      let key = cursor.toISOString().slice(0, 10);
      key <= final;
      cursor.setUTCDate(cursor.getUTCDate() + 1), key = cursor.toISOString().slice(0, 10)
    ) {
      const list = groups.get(key) ?? [];
      list.push(ev);
      groups.set(key, list);
    }
  }

  const sortedKeys = Array.from(groups.keys()).sort();

  return (
    <div className="space-y-8" data-testid="agenda-list">
      {sortedKeys.map((iso) => {
        const dayEvents = groups.get(iso) ?? [];
        return (
          <section key={iso} aria-labelledby={`day-${iso}`}>
            <h2
              id={`day-${iso}`}
              className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground/60"
            >
              {dayLabel(iso)}
            </h2>
            <div className="mt-3 space-y-3">
              {dayEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  displayDay={iso}
                  href={hrefBuilder ? hrefBuilder(ev) : undefined}
                  onClick={!hrefBuilder && onEventClick ? () => onEventClick(ev) : undefined}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
