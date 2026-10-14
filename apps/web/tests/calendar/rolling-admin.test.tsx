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
  it("скользит от текущей даты, ограничивает конец короткого месяца", () => {
    expect(rollingRange("2026-10-14").end).toBe("2026-11-14");
    expect(rollingRange("2027-01-31").end).toBe("2027-02-28");
    expect(rollingRange("2028-01-31").end).toBe("2028-02-29");
    expect(rollingRange("2026-12-14").end).toBe("2027-01-14");
  });
  it("показывает три дня одного события и служебные counts без клиентских фильтров", () => {
    render(
      <AdminEventCalendar
        events={[event]}
        start="2026-10-14"
        onChange={vi.fn()}
        onEdit={vi.fn()}
        onCreate={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Путь Велеса")).toHaveLength(3);
    expect(screen.getAllByText("Подтверждено: 3 / 20 · Свободно: 17")).toHaveLength(3);
    expect(screen.getAllByText("Ожидают: 2")).toHaveLength(3);
    expect(screen.queryByText("Направления")).toBeNull();
    expect(screen.getByRole("region", { name: /14 ноября/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /15 ноября/ })).toBeNull();
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
    await userEvent.click(screen.getByRole("button", { name: "Создать на 14 октября" }));
    expect(create).toHaveBeenCalledWith("2026-10-14");
  });
});
