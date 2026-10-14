import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rollingRange } from "@/lib/events/rolling-range";
import { AdminEventCalendar } from "@/app/admin/calendar/admin-event-calendar";
import type { EventCardData } from "@/app/admin/calendar/event-card";

const event: EventCardData = {
  id: "evt1",
  title: "Путь Велеса",
  description: null,
  type: "SEMINAR",
  status: "PLANNED",
  start_at: new Date("2026-10-15T00:00Z"),
  end_at: new Date("2026-10-18T00:00Z"),
  is_all_day: true,
  is_online: false,
  pricing_type: "FREE",
  price: null,
  pricing_note: null,
  tags: [],
  max_participants: 20,
  branch: null,
  speaker: { id: "sp1", name: "Спикер", avatar: null },
  bookings_count: 99,
  ...{ confirmed_count: 3, waitlist_count: 2 },
  venue: "На поселении",
};
describe("Рабочий месяц администратора", () => {
  it("показывает позднюю занятую дату отдельным кругом без пустых дней между", async () => {
    const edit = vi.fn();
    const later = {
      ...event,
      start_at: new Date("2027-01-10T00:00Z"),
      end_at: new Date("2027-01-11T00:00Z"),
    };
    render(
      <AdminEventCalendar
        events={[later]}
        start="2026-10-15"
        onChange={vi.fn()}
        onEdit={edit}
        onCreate={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("group", { name: "Дни календаря" }).querySelectorAll("button"),
    ).toHaveLength(14);
    expect(screen.queryByRole("button", { name: /9 января/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "10 января — 1 мероприятий" }));
    expect(edit).toHaveBeenCalledWith(later);
  });
  it("скользит от текущей даты, ограничивает конец короткого месяца", () => {
    expect(rollingRange("2026-10-14").end).toBe("2026-11-14");
    expect(rollingRange("2027-01-31").end).toBe("2027-02-28");
    expect(rollingRange("2028-01-31").end).toBe("2028-02-29");
    expect(rollingRange("2026-12-14").end).toBe("2027-01-14");
  });
  it("показывает только даты и counts в семи колонках, без служебных карточек", () => {
    render(
      <AdminEventCalendar
        events={[event]}
        start="2026-10-14"
        onChange={vi.fn()}
        onEdit={vi.fn()}
        onCreate={vi.fn()}
      />,
    );
    expect(screen.queryByText("Путь Велеса")).toBeNull();
    expect(screen.queryByText(/Подтверждено/)).toBeNull();
    expect(screen.queryByText("На поселении")).toBeNull();
    expect(screen.getByRole("group", { name: "Дни календаря" })).toHaveClass("grid-cols-7");
    const cells = screen.getByRole("group", { name: "Дни календаря" }).children;
    expect(cells[2]).toHaveClass("rounded-full", "aspect-square");
    expect(cells[3]).toHaveClass("rounded-full", "aspect-square");
    expect(cells[0]).toHaveAttribute("aria-hidden", "true");
    expect(cells[1]).toHaveAttribute("aria-hidden", "true");
    expect(cells[2]).toHaveTextContent("14");
    for (const day of [15, 16, 17])
      expect(
        screen.getByRole("button", { name: `${day} октября — 1 мероприятий` }),
      ).toHaveTextContent("1");
    expect(screen.queryByText("Направления")).toBeNull();
    expect(screen.getByRole("button", { name: /27 октября — 0 мероприятий/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /28 октября — 0 мероприятий/ })).toBeNull();
  });
  it("листается по неделе и открывает создание на конкретный день", async () => {
    const change = vi.fn(),
      create = vi.fn();
    render(
      <AdminEventCalendar
        events={[]}
        start="2026-10-14"
        onChange={change}
        onEdit={vi.fn()}
        onCreate={create}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Вперёд на неделю" }));
    expect(change).toHaveBeenCalledWith("2026-10-21");
    await userEvent.click(
      screen.getByRole("button", { name: "14 октября — 0 мероприятий, создать мероприятие" }),
    );
    expect(create).toHaveBeenCalledWith("2026-10-14");
  });
  it("сразу открывает единственное мероприятие, при нескольких предлагает выбор", async () => {
    const edit = vi.fn();
    render(
      <AdminEventCalendar
        events={[
          event,
          {
            ...event,
            id: "evt2",
            title: "Йога",
            start_at: new Date("2026-10-16T08:00Z"),
            end_at: new Date("2026-10-16T10:00Z"),
            is_all_day: false,
          },
        ]}
        start="2026-10-14"
        onChange={vi.fn()}
        onEdit={edit}
        onCreate={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "15 октября — 1 мероприятий" }));
    expect(edit).toHaveBeenCalledWith(event);
    edit.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "16 октября — 2 мероприятий" }));
    expect(edit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Йога" }));
    expect(edit).toHaveBeenCalledWith(expect.objectContaining({ id: "evt2" }));
  });
});
