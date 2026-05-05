import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { TRPCProvider } from "@/lib/trpc/provider";
import { HealthSmoke } from "@/app/api-health/health-smoke";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  mockFetch.mockReset();
});

const trpcResponse = (data: unknown) =>
  new Response(JSON.stringify([{ result: { data: { json: data } } }]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("HealthSmoke (tRPC client wiring)", () => {
  it("делает запрос на /api/trpc и рендерит pong-ответ", async () => {
    mockFetch.mockResolvedValue(
      trpcResponse({
        ok: true,
        service: "academy-api",
        timestamp: "2026-05-05T12:00:00.000Z",
      }),
    );

    render(
      <TRPCProvider>
        <HealthSmoke />
      </TRPCProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/academy-api/)).toBeInTheDocument();
    });

    expect(screen.getByText(/true/)).toBeInTheDocument();

    const callUrl = mockFetch.mock.calls[0]?.[0] as string | URL;
    expect(String(callUrl)).toMatch(/\/api\/trpc\/health\.ping/);
  });

  it("использует superjson-протокол (transformer wired через провайдер)", async () => {
    mockFetch.mockResolvedValue(
      trpcResponse({
        ok: true,
        service: "academy-api",
        timestamp: "2026-05-05T12:00:00.000Z",
      }),
    );

    render(
      <TRPCProvider>
        <HealthSmoke />
      </TRPCProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/academy-api/)).toBeInTheDocument();
    });

    // superjson-обёртка json: { json: ... } распаковалась — значит transformer на месте.
    expect(screen.getByText(/2026-05-05T12:00:00\.000Z/)).toBeInTheDocument();
  });
});
