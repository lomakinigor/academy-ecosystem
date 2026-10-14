"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@academy/ui";

import type { EventCardData } from "./event-card";

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const startOfWeekMonday = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
};

export const getWeekDays = (weekStart: Date): Date[] =>
  Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

const formatTime = (date: Date) =>
  date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export function WeeklyCalendar({
  events,
  weekStart,
  onPreviousWeek,
  onNextWeek,
  onEventClick,
}: {
  events: EventCardData[];
  weekStart: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onEventClick?: (event: EventCardData) => void;
}) {
  const days = getWeekDays(weekStart);
  const todayKey = dayKey(new Date());
  const eventsByDay = new Map<string, EventCardData[]>();
  for (const event of events) {
    for (const day of days) {
      const start = event.is_all_day ? new Date(`${dayKey(day)}T00:00:00Z`) : new Date(day);
      if (!event.is_all_day) start.setHours(0, 0, 0, 0);
      const next = event.is_all_day ? new Date(start.getTime() + 86400000) : addDays(start, 1);
      if (
        event.start_at < next &&
        (event.end_at ? event.end_at > start : event.start_at >= start)
      ) {
        const key = dayKey(day);
        eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), event]);
      }
    }
  }

  const rangeLabel = `${days[0]?.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} — ${days[6]?.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <section aria-label="Недельный календарь">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreviousWeek}
          aria-label="Предыдущая неделя"
          className="min-h-11 min-w-11 shrink-0"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-center font-heading text-sm font-semibold text-brand-primary sm:text-base">
          {rangeLabel}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNextWeek}
          aria-label="Следующая неделя"
          className="min-h-11 min-w-11 shrink-0"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="grid grid-cols-1 lg:grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = (eventsByDay.get(dayKey(day)) ?? []).sort(
              (a, b) => a.start_at.getTime() - b.start_at.getTime(),
            );
            const isWeekend = index >= 5;
            const isToday = dayKey(day) === todayKey;
            return (
              <section
                key={dayKey(day)}
                aria-label={day.toLocaleDateString("ru-RU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                aria-current={isToday ? "date" : undefined}
                data-weekend={isWeekend ? "true" : "false"}
                className={`grid min-w-0 grid-cols-[3rem,minmax(0,1fr)] gap-3 border-b border-border p-3 last:border-b-0 lg:block lg:min-h-44 lg:border-b-0 lg:border-r lg:last:border-r-0 ${isWeekend ? "bg-brand-warm/50" : ""} ${isToday ? "ring-2 ring-inset ring-brand-accent/50" : ""}`}
              >
                <div className="text-center lg:mb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
                    {day.toLocaleDateString("ru-RU", { weekday: "short" })}
                  </div>
                  <div className="font-heading text-xl font-bold text-brand-primary">
                    {day.getDate()}
                  </div>
                  {isToday && (
                    <span className="block text-[10px] font-semibold text-brand-primary">
                      Сегодня
                    </span>
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  {dayEvents.length === 0 && (
                    <p className="py-2 text-xs text-foreground/60">Нет мероприятий</p>
                  )}
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick?.(event)}
                      className="min-h-11 w-full rounded-lg border border-brand-accent/30 bg-brand-warm p-3 text-left text-sm transition-colors hover:bg-brand-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent lg:p-2 lg:text-xs"
                    >
                      <span className="block font-semibold text-brand-primary">
                        {event.is_all_day
                          ? "Весь день"
                          : event.end_at
                            ? `${formatTime(event.start_at)} — ${formatTime(event.end_at)}`
                            : formatTime(event.start_at)}
                      </span>
                      <span className="mt-1 block break-words text-foreground">{event.title}</span>
                      <span className="mt-1 block break-words text-foreground/60">
                        {event.speaker.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
