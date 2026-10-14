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
  it("краткая публичная карточка сразу ведёт на полное мероприятие", () => {
    render(
      <EventCard
        event={baseEvent({
          calendar_title: "Храм",
          venue: "На поселении",
          tags: ["с проживанием"],
        })}
        compact
        href="/event/evt1"
      />,
    );

    expect(screen.getByTestId("compact-event-card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Храм" })).toBeInTheDocument();
    expect(screen.getByText(/В\.Ю\. Светлов/)).toBeInTheDocument();
    expect(screen.queryByText("Подробнее")).not.toBeInTheDocument();
    expect(screen.queryByText(/Место: На поселении/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Храм-3: день 1" })).toHaveAttribute(
      "href",
      "/event/evt1",
    );
  });

  it("без окончания не пишет лишнюю подпись или тире", () => {
    render(<EventCard event={baseEvent({ end_at: null })} />);
    const time = new Date("2026-05-04T07:00:00Z").toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(screen.getAllByText(time).length).toBeGreaterThan(0);
    expect(screen.queryByText(/не указано/i)).toBeNull();
    expect(screen.queryByText(new RegExp(`${time}–`))).toBeNull();
  });
  it("рендерит заголовок, спикера, место и описание", () => {
    render(<EventCard event={baseEvent({ venue: "На поселении" })} />);
    expect(screen.getByText("Храм-3: день 1")).toBeInTheDocument();
    expect(screen.getByText("В.Ю. Светлов")).toBeInTheDocument();
    expect(screen.getByText("На поселении")).toBeInTheDocument();
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

  it("не показывает филиал вместо неуказанного места", () => {
    render(<EventCard event={baseEvent({ branch: null })} />);
    expect(screen.queryByText(/филиал/i)).not.toBeInTheDocument();
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
