"use client";
import { Button } from "@academy/ui";
import { ChevronLeft, ChevronRight, Plus, MapPin, User2 } from "lucide-react";
import type { EventCardData } from "./event-card";
import { academyDay, dayLabel, rollingRange, shiftDay } from "@/lib/events/rolling-range";
import { dateOnlyLabel } from "@/lib/events/dates";

const statuses = {
  DRAFT: "Черновик",
  PLANNED: "Запланировано",
  ACTIVE: "Идёт",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
};
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
  const weeks: string[][] = [];
  for (const day of range.days) {
    if (!weeks.length || new Date(`${day}T00:00Z`).getUTCDay() === 1) weeks.push([]);
    weeks[weeks.length - 1]!.push(day);
  }
  const time = (date: Date) =>
    date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Yekaterinburg",
    });
  return (
    <section aria-label="Рабочий календарь на месяц" className="space-y-5">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
        <div>
          <h2 className="font-heading font-semibold">
            {dayLabel(start)} — {dayLabel(range.end)}
          </h2>
          <p className="text-xs text-foreground/60">
            {events.length} мероприятий · месяц от выбранной даты
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="min-h-11 min-w-11"
            aria-label="Назад на неделю"
            onClick={() => onChange(shiftDay(start, -7))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" className="min-h-11" onClick={() => onChange(academyDay())}>
            Сегодня
          </Button>
          <Button
            variant="outline"
            className="min-h-11 min-w-11"
            aria-label="Вперёд на неделю"
            onClick={() => onChange(shiftDay(start, 7))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      {weeks.map((week, index) => (
        <section key={week[0]} aria-label={`Неделя ${index + 1}`}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
            {dayLabel(week[0]!)} — {dayLabel(week[week.length - 1]!)}
          </h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
            {week.map((day) => {
              const weekday = new Date(`${day}T00:00Z`).getUTCDay();
              const daily = events
                .filter((event) => {
                  const from = new Date(`${day}T00:00:00${event.is_all_day ? "Z" : "+05:00"}`);
                  const to = new Date(
                    `${shiftDay(day, 1)}T00:00:00${event.is_all_day ? "Z" : "+05:00"}`,
                  );
                  return event.start_at < to && event.end_at > from;
                })
                .sort(
                  (a, b) =>
                    Number(Boolean(b.is_all_day)) - Number(Boolean(a.is_all_day)) ||
                    a.start_at.getTime() - b.start_at.getTime(),
                );
              return (
                <section
                  key={day}
                  aria-label={dayLabel(day)}
                  data-weekend={weekday === 0 || weekday === 6}
                  className={`min-w-0 rounded-xl border border-border p-3 ${weekday === 0 || weekday === 6 ? "bg-brand-warm/60" : "bg-card"} ${day === academyDay() ? "ring-2 ring-brand-accent/50" : ""}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase text-foreground/60">
                        {new Date(`${day}T00:00Z`).toLocaleDateString("ru-RU", {
                          weekday: "long",
                          timeZone: "UTC",
                        })}
                      </span>
                      <p className="font-heading font-bold">{dayLabel(day)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      className="min-h-11 min-w-11 px-2"
                      aria-label={`Создать на ${dayLabel(day)}`}
                      onClick={() => onCreate(day)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {daily.length === 0 && (
                      <p className="text-xs text-foreground/50">Нет мероприятий</p>
                    )}
                    {daily.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEdit(event)}
                        className="w-full min-w-0 rounded-lg border border-brand-accent/30 bg-brand-warm/40 p-3 text-left text-sm transition-colors hover:bg-brand-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent lg:p-2 lg:text-xs"
                      >
                        <span className="block text-xs font-semibold text-brand-primary">
                          {event.is_all_day
                            ? dateOnlyLabel(event.start_at, event.end_at)
                            : `${time(event.start_at)}–${time(event.end_at)}`}
                        </span>
                        {event.is_all_day && (
                          <span className="block text-xs text-foreground/60">
                            Без указания времени
                          </span>
                        )}
                        <span className="mt-2 block break-words font-heading font-semibold text-brand-primary">
                          {event.title}
                        </span>
                        <span className="mt-2 inline-block rounded-md border border-border bg-card px-2 py-1 text-[11px]">
                          {statuses[event.status]}
                        </span>
                        <span className="mt-2 flex items-start gap-1 break-words">
                          <User2 className="mt-0.5 size-3 shrink-0" />
                          {event.speaker.name}
                        </span>
                        <span className="mt-1 flex items-start gap-1 break-words">
                          <MapPin className="mt-0.5 size-3 shrink-0" />
                          {event.venue ||
                            (event.is_online ? "Онлайн: ссылка не указана" : "Место не указано")}
                        </span>
                        <span className="mt-2 block">
                          Подтверждено: {event.confirmed_count ?? 0}
                          {event.max_participants
                            ? ` / ${event.max_participants} · Свободно: ${Math.max(0, event.max_participants - (event.confirmed_count ?? 0))}`
                            : " · без лимита"}
                        </span>
                        {(event.waitlist_count ?? 0) > 0 && (
                          <span className="block">Ожидают: {event.waitlist_count}</span>
                        )}
                        {event.updated_at && (
                          <span className="mt-2 block text-[10px] text-foreground/60">
                            Изменено:{" "}
                            {event.updated_at.toLocaleDateString("ru-RU", {
                              timeZone: "Asia/Yekaterinburg",
                            })}
                          </span>
                        )}
                        <span className="mt-2 block font-medium text-brand-primary underline">
                          Открыть карточку
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
