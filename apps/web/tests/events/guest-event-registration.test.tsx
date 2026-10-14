// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { GuestEventRegistration } from "@/components/events/guest-event-registration";

describe("Гостевая запись на мероприятие", () => {
  it("ведёт на регистрацию и возвращает к исходной карточке", () => {
    render(<GuestEventRegistration eventId="event-42" />);
    const link = screen.getByRole("link", { name: "Зарегистрироваться на мероприятие" });
    expect(link).toHaveAttribute("href", "/signup?callbackUrl=%2Fevent%2Fevent-42");
    expect(screen.queryByRole("link", { name: "Войти" })).not.toBeInTheDocument();
  });
});
