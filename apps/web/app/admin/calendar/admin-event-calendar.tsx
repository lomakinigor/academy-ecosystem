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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const range = rollingRange(start);
  const dailyEvents = (day: string) =>
    events
      .filter((event) => {
        const offset = event.is_all_day ? "Z" : "+05:00";
        return (
          event.start_at < new Date(`${shiftDay(day, 1)}T00:00:00${offset}`) &&
          (event.end_at
            ? event.end_at > new Date(`${day}T00:00:00${offset}`)
            : event.start_at >= new Date(`${day}T00:00:00${offset}`))
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
      className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-card p-2 sm:p-5"
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <div>
          <h2 className="font-heading text-xs font-semibold sm:text-base">
            {dayLabel(start)} — {dayLabel(range.end)}
          </h2>
          <p className="text-xs text-foreground/60">{events.length} мероприятий</p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            className="h-8 min-w-8 px-1 sm:min-h-11 sm:min-w-11"
            aria-label="Назад на неделю"
            onClick={() => change(shiftDay(start, -7))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 px-2 text-xs sm:min-h-11"
            onClick={() => change(academyDay())}
          >
            Сегодня
          </Button>
          <Button
            variant="outline"
            className="h-8 min-w-8 px-1 sm:min-h-11 sm:min-w-11"
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
              type="button"
              key={day}
              aria-label={`${dayLabel(day)} — ${daily.length} мероприятий${occupied ? "" : ", создать мероприятие"}`}
              onClick={() =>
                daily.length === 1
                  ? onEdit(daily[0]!)
                  : occupied
                    ? setSelectedDay(day)
                    : onCreate(day)
              }
              aria-current={day === academyDay() ? "date" : undefined}
              data-has-events={occupied ? "true" : "false"}
              className={`mx-auto flex aspect-square w-full max-w-11 min-w-0 flex-col items-center justify-center rounded-full border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:max-w-14 ${occupied ? "border-brand-accent/50 bg-brand-accent/20" : "border-border bg-background"} ${day === academyDay() ? "ring-2 ring-inset ring-brand-accent" : ""}`}
            >
              <span
                className={`font-heading font-semibold leading-none ${weekday === 0 || weekday === 6 ? "text-brand-earth" : "text-brand-primary"}`}
              >
                {Number(day.slice(8))}
              </span>
              <span className="mt-0.5 text-[10px] leading-none text-foreground/60">
                {daily.length}
              </span>
            </button>
          );
        })}
      </div>
      <Dialog
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDay ? dayLabel(selectedDay) : "Мероприятия"}</DialogTitle>
            <DialogDescription>Выберите мероприятие для редактирования.</DialogDescription>
          </DialogHeader>
          {selectedDay &&
            dailyEvents(selectedDay).map((event) => (
              <Button
                key={event.id}
                variant="outline"
                className="h-auto min-h-11 justify-start whitespace-normal text-left"
                onClick={() => {
                  setSelectedDay(null);
                  onEdit(event);
                }}
              >
                {event.title}
              </Button>
            ))}
          <Button
            onClick={() => {
              if (selectedDay) {
                const day = selectedDay;
                setSelectedDay(null);
                onCreate(day);
              }
            }}
          >
            Создать мероприятие
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
