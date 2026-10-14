"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@academy/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventCardData } from "./event-card";
import { academyDay, dayLabel, rollingRange, shiftDay } from "@/lib/events/rolling-range";

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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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
  const select = (day: string) => {
    const daily = dailyEvents(day);
    if (!daily.length) onCreate(day);
    else if (daily.length === 1) onEdit(daily[0]!);
    else setSelectedDay(day);
  };
  const offset = (new Date(`${start}T00:00Z`).getUTCDay() + 6) % 7;
  const change = (day: string) => {
    setSelectedDay(null);
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
            <button
              key={day}
              type="button"
              aria-label={`${dayLabel(day)}, мероприятий: ${daily.length}`}
              title={`${dayLabel(day)}: ${daily.length ? `мероприятий ${daily.length}` : "создать мероприятие"}`}
              aria-current={day === academyDay() ? "date" : undefined}
              data-has-events={occupied ? "true" : "false"}
              onClick={() => select(day)}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:min-h-16 ${occupied ? "border-brand-accent/50 bg-brand-accent/20 hover:bg-brand-accent/35" : "border-border bg-background hover:bg-brand-warm"} ${day === academyDay() ? "ring-2 ring-inset ring-brand-accent" : ""}`}
            >
              <span
                className={`font-heading font-semibold ${weekday === 0 || weekday === 6 ? "text-brand-earth" : "text-brand-primary"}`}
              >
                {Number(day.slice(8))}
              </span>
              <span
                aria-hidden="true"
                className={`text-[11px] leading-none ${occupied ? "font-semibold text-brand-primary" : "text-foreground/40"}`}
              >
                {daily.length || "—"}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-foreground/60">
        Число под датой — количество мероприятий. Пустой день — создание.
      </p>
      <Dialog
        open={Boolean(selectedDay)}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
      >
        <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>
              {selectedDay
                ? `${dayLabel(selectedDay)} — выберите мероприятие`
                : "Выберите мероприятие"}
            </DialogTitle>
            <DialogDescription>Нажмите название, чтобы открыть редактирование.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selectedDay &&
              dailyEvents(selectedDay).map((event) => (
                <Button
                  key={event.id}
                  variant="outline"
                  className="h-auto min-h-11 w-full justify-start whitespace-normal text-left"
                  onClick={() => {
                    setSelectedDay(null);
                    onEdit(event);
                  }}
                >
                  {event.title}
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
