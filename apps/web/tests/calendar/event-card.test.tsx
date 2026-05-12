import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { EventCard, type EventCardData } from "@/app/admin/calendar/event-card";

const baseEvent = (overrides: Partial<EventCardData> = {}): EventCardData => ({
  id: "evt1",
  title: "Храм-3: день 1",
  description: "Подготовка и вход в практику.",
  type: "SEMINAR",
  status: "PLANNED",
  start_at: new Date("2026-05-04T07:00:00Z"),
  end_at: new Date("2026-05-04T16:00:00Z"),
  is_online: false,
  pricing_type: "FIXED",
  price: 29000,
  pricing_note: null,
  tags: [],
  max_participants: 80,
  branch: { id: "branch_msk", name: "Москва", city: "Москва" },
  speaker: { id: "u_founder", name: "В.Ю. Светлов", avatar: null },
  bookings_count: 32,
  ...overrides,
});

describe("EventCard", () => {
  it("рендерит заголовок, спикера, филиал и описание", () => {
    render(<EventCard event={baseEvent()} />);
    expect(screen.getByText("Храм-3: день 1")).toBeInTheDocument();
    expect(screen.getByText("В.Ю. Светлов")).toBeInTheDocument();
    expect(screen.getByText("Москва")).toBeInTheDocument();
    expect(screen.getByText(/Подготовка и вход/)).toBeInTheDocument();
  });

  it("показывает badge типа (Семинары)", () => {
    render(<EventCard event={baseEvent()} />);
    expect(screen.getByText("Семинары")).toBeInTheDocument();
  });

  it("показывает badge Онлайн при is_online=true", () => {
    render(<EventCard event={baseEvent({ is_online: true, type: "WEBINAR" })} />);
    expect(screen.getByText("Онлайн")).toBeInTheDocument();
    expect(screen.getByText("Вебинары")).toBeInTheDocument();
  });

  it("рендерит теги как badges", () => {
    render(<EventCard event={baseEvent({ tags: ["с детьми", "СВЕТЛОЯР"] })} />);
    expect(screen.getByText("с детьми")).toBeInTheDocument();
    expect(screen.getByText("СВЕТЛОЯР")).toBeInTheDocument();
  });

  it("выводит «Все филиалы» если branch=null", () => {
    render(<EventCard event={baseEvent({ branch: null })} />);
    expect(screen.getByText("Все филиалы")).toBeInTheDocument();
  });

  it("показывает progress-бар capacity = bookings/max", () => {
    render(<EventCard event={baseEvent({ max_participants: 100, bookings_count: 25 })} />);
    expect(screen.getByText(/25 \/ 100 записано/)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "25");
  });

  it("DONATION с pricing_note — рендерит «Донат · ...»", () => {
    render(
      <EventCard
        event={baseEvent({
          pricing_type: "DONATION",
          price: null,
          pricing_note: "Минимум 1500 ₽",
        })}
      />,
    );
    expect(screen.getByText(/Донат · Минимум 1500 ₽/)).toBeInTheDocument();
  });

  it("FREE — рендерит «Бесплатно»", () => {
    render(
      <EventCard
        event={baseEvent({
          pricing_type: "FREE",
          price: null,
        })}
      />,
    );
    expect(screen.getByText("Бесплатно")).toBeInTheDocument();
  });

  it("FIXED с ценой — рендерит «29 000 ₽» (русский формат)", () => {
    render(<EventCard event={baseEvent()} />);
    expect(screen.getByText(/29\D000\s?₽/)).toBeInTheDocument();
  });

  it("без max_participants — не рендерит progress-бар", () => {
    render(<EventCard event={baseEvent({ max_participants: null })} />);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
