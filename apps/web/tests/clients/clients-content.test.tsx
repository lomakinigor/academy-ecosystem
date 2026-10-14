import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
const setAdmin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    clients: { create: { useMutation: () => ({ mutate: vi.fn(), isLoading: false }) } },
    administration: { setAdmin: { useMutation: () => ({ mutate: setAdmin, isLoading: false }) } },
  },
}));

import { ClientsContent } from "@/app/admin/clients/clients-content";

describe("ClientsContent", () => {
  it("показывает мобильный раздел клиентов без поиска и с действием создания", () => {
    render(<ClientsContent clients={[]} />);

    expect(screen.getByRole("heading", { name: "Клиенты" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /добавить клиента/i })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("позволяет владельцу назначить администратора прямо в списке клиентов", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <ClientsContent
        isOwner
        clients={[
          {
            id: "registered-client",
            name: "Зарегистрированный клиент",
            createdAt: new Date("2026-10-14"),
            contacts: [],
            system_role: "STUDENT",
            is_owner: false,
            is_registered: true,
          },
          {
            id: "manual-client",
            name: "Ручная карточка",
            createdAt: new Date("2026-10-14"),
            contacts: [],
            system_role: "STUDENT",
            is_owner: false,
            is_registered: false,
          },
        ]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Назначить администратором" }));
    expect(setAdmin).toHaveBeenCalledWith({ id: "registered-client", isAdmin: true });
    expect(screen.getByText("Зарегистрируется самостоятельно")).toBeInTheDocument();
  });
});
