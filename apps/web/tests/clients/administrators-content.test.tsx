import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mutate = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    administration: {
      setAdmin: {
        useMutation: () => ({ mutate, isLoading: false }),
      },
      setOwner: { useMutation: () => ({ mutate: vi.fn(), isLoading: false }) },
    },
  },
}));
import { AdministratorsContent } from "@/app/admin/clients/administrators/administrators-content";
describe("Управление администраторами", () => {
  it("защищает владельца и показывает один уровень админов", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <AdministratorsContent
        ownerId="owner1"
        viewerId="coowner1"
        accounts={[
          {
            id: "owner1",
            name: "Владелец",
            email: "owner@example.test",
            system_role: "PRESIDENT",
            is_owner: true,
          },
          { id: "user1", name: "Клиент", email: "user@example.test", system_role: "STUDENT" },
          { id: "admin1", name: "Админ", email: "admin@example.test", system_role: "BRANCH_ADMIN" },
        ]}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(4);
    await userEvent.click(screen.getByRole("button", { name: "Назначить администратором" }));
    expect(mutate).toHaveBeenCalledWith({ id: "user1", isAdmin: true });
    await userEvent.click(screen.getByRole("button", { name: "Снять права администратора" }));
    expect(mutate).toHaveBeenCalledWith({ id: "admin1", isAdmin: false });
  });
});
