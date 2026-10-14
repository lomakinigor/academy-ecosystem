import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminLayout from "@/app/admin/layout";
import { CalendarContent } from "@/app/admin/calendar/calendar-content";

const state = vi.hoisted(() => ({ pathname: "/admin/calendar", owner: true }));
vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/lib/auth/helpers", () => ({
  requireRole: async () => ({
    id: "owner1",
    name: "Игорь",
    email: "owner@example.com",
    academic_level: "LISTENER",
  }),
}));
vi.mock("@academy/api", () => ({ isOwner: () => state.owner }));
vi.mock("@/app/admin/logout-button", () => ({ LogoutButton: () => null }));
vi.mock("@/app/admin/calendar/event-form-modal", () => ({
  EventFormModal: ({ open }: { open: boolean }) => (open ? <div>Ручная форма</div> : null),
}));
vi.mock("@/app/admin/calendar/event-batch-modal", () => ({
  EventBatchModal: ({ open }: { open: boolean }) => (open ? <div>Пакетная форма</div> : null),
}));

describe("Рабочее пространство администратора", () => {
  it("показывает владельца и выделяет открытые мероприятия", async () => {
    state.owner = true;
    state.pathname = "/admin/calendar";
    render(await AdminLayout({ children: <div /> }));
    expect(screen.getByText("Владелец")).toBeInTheDocument();
    expect(screen.queryByText("Слушатель")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Мероприятия" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Финансы" })).not.toHaveAttribute("aria-current");
  });

  it("выделяет клиентов на вложенном маршруте, не называет обычного пользователя владельцем", async () => {
    state.owner = false;
    state.pathname = "/admin/clients/administrators";
    render(await AdminLayout({ children: <div /> }));
    expect(screen.queryByText("Владелец")).not.toBeInTheDocument();
    expect(screen.getByText("Слушатель")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Клиенты" })).toHaveAttribute("aria-current", "page");
  });

  it.each([
    ["Пакетный ввод", "Пакетная форма"],
    ["Создать вручную", "Ручная форма"],
  ])("открывает %s непосредственно из календаря", async (button, form) => {
    render(
      <CalendarContent
        events={[]}
        branches={[]}
        canAuthor
        canEditNullBranch
        defaultBranchId={null}
        initialDate={new Date(2026, 9, 13)}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: button }));
    expect(screen.getByText(form)).toBeInTheDocument();
  });
});
