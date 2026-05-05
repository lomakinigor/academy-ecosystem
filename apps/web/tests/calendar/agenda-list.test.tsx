import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { AgendaList } from "@/app/admin/calendar/agenda-list";
import type { EventCardData } from "@/app/admin/calendar/event-card";

const ev = (id: string, start: string, title: string): EventCardData => ({
  id,
  title,
  description: null,
  type: "SEMINAR",
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
  it("показывает empty-state при пустом списке", () => {
    render(<AgendaList events={[]} />);
    expect(screen.getByTestId("agenda-empty")).toBeInTheDocument();
    expect(screen.getByText(/Нет событий/)).toBeInTheDocument();
  });

  it("группирует события по дням и сортирует ключи по возрастанию", () => {
    render(
      <AgendaList
        events={[
          ev("e2", "2026-05-05T10:00:00Z", "День 5"),
          ev("e1", "2026-05-04T10:00:00Z", "День 4"),
          ev("e3", "2026-05-04T18:00:00Z", "День 4 вечер"),
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
