import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeeklyCalendar } from "@/app/admin/calendar/weekly-calendar";
import type { EventCardData } from "@/app/admin/calendar/event-card";

const event = (id: string, hour: number): EventCardData => ({
  id,
  title: `Длинное название мероприятия ${id}`,
  description: null,
  type: "SEMINAR",
  status: "PLANNED",
  start_at: new Date(2026, 9, 13, hour),
  end_at: new Date(2026, 9, 13, hour + 1),
  is_online: false,
  pricing_type: "FREE",
  price: null,
  pricing_note: null,
  tags: [],
  max_participants: null,
  branch: null,
  speaker: { id: "speaker1", name: "Спикер с длинным именем", avatar: null },
  bookings_count: 0,
});

describe("Недельный календарь на телефоне", () => {
  it("показывает продолжающееся мероприятие на следующей неделе", () => {
    render(
      <WeeklyCalendar
        events={[
          {
            ...event("nextweek", 10),
            is_all_day: true,
            start_at: new Date("2026-10-17T00:00Z"),
            end_at: new Date("2026-10-21T00:00Z"),
          },
        ]}
        weekStart={new Date(2026, 9, 19)}
        onPreviousWeek={vi.fn()}
        onNextWeek={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Длинное название мероприятия nextweek")).toHaveLength(2);
  });
  it("показывает один семинар без часов во всех трёх днях, не включая 18-е", () => {
    render(
      <WeeklyCalendar
        events={[
          {
            ...event("retreat", 10),
            start_at: new Date("2026-10-15T00:00Z"),
            end_at: new Date("2026-10-18T00:00Z"),
            ...{ is_all_day: true },
          },
        ]}
        weekStart={new Date(2026, 9, 12)}
        onPreviousWeek={vi.fn()}
        onNextWeek={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Длинное название мероприятия retreat")).toHaveLength(3);
    expect(screen.getAllByText("Без указания времени")).toHaveLength(3);
    expect(
      within(screen.getByRole("region", { name: /воскресенье, 18 октября/i })).queryByRole(
        "button",
      ),
    ).toBeNull();
  });
  it("показывает все мероприятия дня без обрезки и фиксированной ширины", () => {
    render(
      <WeeklyCalendar
        events={[event("e2", 18), event("e1", 10)]}
        weekStart={new Date(2026, 9, 12)}
        onPreviousWeek={vi.fn()}
        onNextWeek={vi.fn()}
      />,
    );
    const day = screen.getByRole("region", { name: /вторник, 13 октября/i });
    expect(within(day).getAllByRole("button")).toHaveLength(2);
    expect(within(day).getAllByRole("button")[0]).toHaveTextContent("e1");
    expect(screen.getByText("Длинное название мероприятия e1").className).not.toMatch(
      /line-clamp|truncate/,
    );
    expect(screen.getByRole("region", { name: "Недельный календарь" }).innerHTML).not.toContain(
      "min-w-[840px]",
    );
    expect(screen.getByRole("region", { name: /суббота, 17 октября/i })).toHaveAttribute(
      "data-weekend",
      "true",
    );
  });

  it("сохраняет навигацию и открытие выбранного мероприятия", async () => {
    const previous = vi.fn();
    const next = vi.fn();
    const open = vi.fn();
    const item = event("e1", 10);
    render(
      <WeeklyCalendar
        events={[item]}
        weekStart={new Date(2026, 9, 12)}
        onPreviousWeek={previous}
        onNextWeek={next}
        onEventClick={open}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Предыдущая неделя" }));
    await userEvent.click(screen.getByRole("button", { name: "Следующая неделя" }));
    await userEvent.click(screen.getByRole("button", { name: /Длинное название мероприятия e1/i }));
    expect(previous).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith(item);
  });

  it("явно показывает пустые дни, сохраняя все семь дней недели", () => {
    render(
      <WeeklyCalendar
        events={[]}
        weekStart={new Date(2026, 9, 12)}
        onPreviousWeek={vi.fn()}
        onNextWeek={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Нет мероприятий")).toHaveLength(7);
  });
});
