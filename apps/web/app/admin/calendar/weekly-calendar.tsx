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
  const eventsByDay = new Map<string, EventCardData[]>();
  for (const event of events) {
    const key = dayKey(event.start_at);
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), event]);
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
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="grid min-w-[840px] grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = eventsByDay.get(dayKey(day)) ?? [];
            const isWeekend = index >= 5;
            return (
              <div
                key={dayKey(day)}
                className={`min-h-44 border-r border-border p-2 last:border-r-0 ${isWeekend ? "bg-brand-warm/50" : ""}`}
              >
                <div className="mb-2 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
                    {day.toLocaleDateString("ru-RU", { weekday: "short" })}
                  </div>
                  <div className="font-heading text-xl font-bold text-brand-primary">
                    {day.getDate()}
                  </div>
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick?.(event)}
                      className="w-full rounded-lg border border-brand-accent/30 bg-brand-warm p-2 text-left text-xs transition-colors hover:bg-brand-accent/15"
                    >
                      <span className="block font-semibold text-brand-primary">
                        {formatTime(event.start_at)}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-foreground">{event.title}</span>
                      <span className="mt-1 block truncate text-foreground/60">
                        {event.speaker.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
