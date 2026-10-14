"use client";

import { Button } from "@academy/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventCardData } from "./event-card";
import { academyDay, dayLabel, rollingRange, shiftDay } from "@/lib/events/rolling-range";
import { calendarTitle } from "@/lib/events/short-title";

export function AdminEventCalendar({
  events,
  start,
  onChange,
  onEdit,
  onCreate,
}: {
  events: EventCardData[];
  start: string;
  onChange: (date: string) => void;
  onEdit: (event: EventCardData) => void;
  onCreate: (date: string) => void;
}) {
  const range = rollingRange(start);
  const dailyEvents = (day: string) =>
    events
      .filter((event) => {
        const offset = event.is_all_day ? "Z" : "+05:00";
        return (
          event.start_at < new Date(`${shiftDay(day, 1)}T00:00:00${offset}`) &&
          event.end_at > new Date(`${day}T00:00:00${offset}`)
        );
      })
      .sort((a, b) => a.start_at.getTime() - b.start_at.getTime());
  const offset = (new Date(`${start}T00:00Z`).getUTCDay() + 6) % 7;
  const change = (day: string) => {
    onChange(day);
  };
  return (
    <section
      aria-label="Рабочий календарь на месяц"
      className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-card p-3 sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-semibold sm:text-base">
            {dayLabel(start)} — {dayLabel(range.end)}
          </h2>
          <p className="text-xs text-foreground/60">{events.length} мероприятий</p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            className="min-h-11 min-w-11 px-2"
            aria-label="Назад на неделю"
            onClick={() => change(shiftDay(start, -7))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" className="min-h-11 px-3" onClick={() => change(academyDay())}>
            Сегодня
          </Button>
          <Button
            variant="outline"
            className="min-h-11 min-w-11 px-2"
            aria-label="Вперёд на неделю"
            onClick={() => change(shiftDay(start, 7))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-foreground/60">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, index) => (
          <span key={day} className={index >= 5 ? "text-brand-earth" : ""}>
            {day}
          </span>
        ))}
      </div>
      <div role="group" aria-label="Дни календаря" className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: offset }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {range.days.map((day) => {
          const daily = dailyEvents(day);
          const weekday = new Date(`${day}T00:00Z`).getUTCDay();
          const occupied = daily.length > 0;
          return (
            <div
              key={day}
              aria-current={day === academyDay() ? "date" : undefined}
              data-has-events={occupied ? "true" : "false"}
              className={`flex h-20 min-w-0 flex-col items-stretch overflow-hidden rounded-lg border p-0.5 text-sm ${occupied ? "border-brand-accent/50 bg-brand-accent/20" : "border-border bg-background"} ${day === academyDay() ? "ring-2 ring-inset ring-brand-accent" : ""}`}
            >
              <button
                type="button"
                aria-label={`${dayLabel(day)} — создать мероприятие`}
                onClick={() => onCreate(day)}
                className={`h-6 shrink-0 font-heading font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent ${weekday === 0 || weekday === 6 ? "text-brand-earth" : "text-brand-primary"}`}
              >
                {Number(day.slice(8))}
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                {daily.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    title={event.title}
                    aria-label={`${event.title} — ${dayLabel(day)}, редактировать`}
                    onClick={() => onEdit(event)}
                    className="block h-6 w-full min-w-0 truncate rounded px-0.5 text-[10px] leading-6 font-medium text-brand-primary hover:bg-brand-accent/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent sm:text-xs"
                  >
                    {calendarTitle(event.title, event.calendar_title)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-foreground/60">
        Название — редактировать. Число даты — создать. Много событий — прокрутите список внутри
        дня.
      </p>
    </section>
  );
}
