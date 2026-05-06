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
}

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  const dayPart = d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
  });
  const weekdayPart = d.toLocaleDateString("ru-RU", { weekday: "long" });
  return `${dayPart}, ${weekdayPart}`;
};

export function AgendaList({ events, onEventClick, hrefBuilder }: AgendaListProps) {
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
          Попробуйте расширить диапазон дат, очистить фильтры или выбрать другой филиал.
        </p>
      </div>
    );
  }

  // Группировка по дню
  const groups = new Map<string, EventCardData[]>();
  for (const ev of events) {
    const key = isoDay(ev.start_at);
    const list = groups.get(key) ?? [];
    list.push(ev);
    groups.set(key, list);
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
