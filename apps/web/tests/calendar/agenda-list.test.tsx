import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { AgendaList } from "@/app/admin/calendar/agenda-list";
import type { EventCardData } from "@/app/admin/calendar/event-card";

const ev = (id: string, start: string, title: string): EventCardData => ({
  id,
  title,
  description: null,
  type: "SEMINAR",
  status: "PLANNED",
  start_at: new Date(start),
  end_at: new Date(start),
  is_online: false,
  pricing_type: "FREE",
  price: null,
  pricing_note: null,
  tags: [],
  max_participants: null,
  branch: { id: "b1", name: "Москва", city: "Москва" },
  speaker: { id: "u1", name: "Speaker", avatar: null },
  bookings_count: 0,
});

describe("AgendaList", () => {
  it("событие без окончания показывает только в день начала", () => {
    render(
      <AgendaList events={[{ ...ev("e1", "2026-10-15T10:00+05:00", "Семинар"), end_at: null }]} />,
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("15 октября");
    expect(screen.queryByText(/не указано/i)).toBeNull();
  });
  it("показывает семинар 15–17 во всех днях и не показывает 18-е", () => {
    render(
      <AgendaList
        events={[
          {
            ...ev("e1", "2026-10-15T00:00Z", "Путь Велеса"),
            is_all_day: true,
            end_at: new Date("2026-10-18T00:00Z"),
          },
        ]}
        hrefBuilder={(event) => `/event/${event.id}`}
      />,
    );
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(3);
    expect(headings[1]).toHaveTextContent("16 октября");
    expect(headings[2]).toHaveTextContent("17 октября");
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
  it("показывает empty-state при пустом списке", () => {
    render(<AgendaList events={[]} />);
    expect(screen.getByTestId("agenda-empty")).toBeInTheDocument();
    expect(screen.getByText(/Нет событий/)).toBeInTheDocument();
  });
  it("ограничивает продолжающееся событие выбранным периодом", () => {
    render(
      <AgendaList
        events={[
          {
            ...ev("e1", "2026-10-15T00:00Z", "Путь Велеса"),
            is_all_day: true,
            end_at: new Date("2026-10-18T00:00Z"),
          },
        ]}
        from={new Date("2026-10-16T00:00+05:00")}
        to={new Date("2026-10-17T23:59+05:00")}
      />,
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
    expect(screen.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent("16 октября");
  });

  it("группирует события по дням и сортирует ключи по возрастанию", () => {
    render(
      <AgendaList
        events={[
          ev("e2", "2026-05-05T10:00:00Z", "День 5"),
          ev("e1", "2026-05-04T10:00:00Z", "День 4"),
          ev("e3", "2026-05-04T16:00:00Z", "День 4 вечер"),
        ]}
      />,
    );

    const sections = screen.getAllByRole("heading", { level: 2 });
    expect(sections).toHaveLength(2);
    expect(sections[0]?.textContent).toMatch(/04 мая/);
    expect(sections[1]?.textContent).toMatch(/05 мая/);
  });

  it("рендерит все карточки", () => {
    render(
      <AgendaList
        events={[
          ev("e1", "2026-05-04T10:00:00Z", "День 4"),
          ev("e2", "2026-05-05T10:00:00Z", "День 5"),
        ]}
      />,
    );
    expect(screen.getAllByTestId("event-card")).toHaveLength(2);
  });
});
