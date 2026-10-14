// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { GuestAdminEntry } from "@/components/auth/guest-admin-entry";
import { ExitAdminPanel } from "@/app/admin/exit-admin-panel";

describe("Навигация администратора", () => {
  it("даёт сотруднику точку входа без кнопки авторизации", () => {
    render(<GuestAdminEntry />);
    const entry = screen.getByRole("link", { name: "Админ-панель" });
    expect(entry).toHaveAttribute("href", "/admin/calendar");
    expect(screen.queryByRole("link", { name: "Войти" })).not.toBeInTheDocument();
  });

  it("выход из админки сохраняет аккаунт и возвращает к расписанию", () => {
    render(<ExitAdminPanel />);
    const exit = screen.getByRole("link", { name: "Выйти из админ-панели" });
    expect(exit).toHaveAttribute("href", "/");
    expect(exit.closest("form")).toBeNull();
  });
});
