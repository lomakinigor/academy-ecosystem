import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { ClientsContent } from "@/app/admin/clients/clients-content";
import { TRPCProvider } from "@/lib/trpc/provider";

describe("ClientsContent", () => {
  it("показывает мобильный раздел клиентов без поиска и с действием создания", () => {
    render(
      <TRPCProvider>
        <ClientsContent clients={[]} />
      </TRPCProvider>,
    );

    expect(screen.getByRole("heading", { name: "Клиенты" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /добавить клиента/i })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
