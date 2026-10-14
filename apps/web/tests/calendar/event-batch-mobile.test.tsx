import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventBatchModal } from "@/app/admin/calendar/event-batch-modal";

const mocks = vi.hoisted(() => ({ create: vi.fn(), speaker: vi.fn(), invalidate: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    user: {
      listSpeakers: { useQuery: () => ({ data: [{ id: "speaker1", name: "Иван" }] }) },
      createSpeaker: { useMutation: () => ({ mutateAsync: mocks.speaker }) },
    },
    event: { create: { useMutation: () => ({ mutateAsync: mocks.create, isLoading: false }) } },
    useUtils: () => ({
      user: { listSpeakers: { invalidate: mocks.invalidate } },
      event: { list: { invalidate: mocks.invalidate } },
    }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [1, 2].map((n) => ({
          title: `Семинар ${n}`,
          type: "SEMINAR",
          date: "2026-10-15",
          start_time: "10:00",
          end_time: "12:00",
          speaker_id: "speaker1",
          speaker_name: "Иван",
          branch_id: null,
          pricing_type: "FREE",
          price: null,
          tags: [],
          is_online: false,
        })),
      }),
    }),
  );
});

async function review() {
  render(
    <EventBatchModal
      open
      onOpenChange={vi.fn()}
      branches={[]}
      defaultBranchId={null}
      canEditNullBranch
    />,
  );
  await userEvent.type(screen.getByRole("textbox", { name: "Список мероприятий" }), "Два семинара");
  await userEvent.click(screen.getByRole("button", { name: "Распознать" }));
  await screen.findByRole("textbox", { name: "Название мероприятия 1" });
}

describe("Мобильная проверка пакетного ввода", () => {
  it("сохраняет начало без обязательного окончания", async () => {
    await review();
    await userEvent.clear(screen.getByLabelText("Окончание мероприятия 1"));
    await userEvent.click(screen.getByRole("checkbox", { name: "Включить мероприятие 2" }));
    await userEvent.click(screen.getByRole("button", { name: "Создать 1 событие" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ end_at: null }));
  });
  it("проверяет и сохраняет многодневный диапазон без часов одной записью", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          events: [
            {
              title: "Путь Велеса",
              type: "SEMINAR",
              date: "2026-10-15",
              end_date: "2026-10-17",
              is_all_day: true,
              start_time: "",
              end_time: "",
              speaker_id: "speaker1",
              venue: "На поселении",
              branch_id: null,
              pricing_type: "FIXED",
              price: 70000,
              pricing_note: "50000 ₽ для предмастеров; 70000 ₽ для остальных",
              tags: [],
              is_online: false,
            },
          ],
        }),
      }),
    );
    await review();
    expect(screen.getByLabelText("Дата окончания мероприятия 1")).toHaveValue("2026-10-17");
    expect(screen.queryByLabelText("Начало мероприятия 1")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Создать 1 событие" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        is_all_day: true,
        venue: "На поселении",
        start_at: new Date("2026-10-15T00:00Z"),
        end_at: new Date("2026-10-18T00:00Z"),
      }),
    );
  });
  it("даёт каждому мероприятию подписанные поля и вертикальную карточку", async () => {
    await review();
    const title = screen.getByRole("textbox", { name: "Название мероприятия 1" });
    expect(title).toHaveClass("w-full", "min-w-0", "h-11");
    expect(title.closest("tr")).toHaveClass("block", "sm:table-row");
    expect(screen.getByLabelText("Дата мероприятия 2")).toHaveValue("2026-10-15");
    expect(screen.getByLabelText("Начало мероприятия 2")).toHaveValue("10:00");
    expect(screen.getByRole("combobox", { name: "Спикер мероприятия 2" })).toBeInTheDocument();
  });

  it("сохраняет исправленное название только выбранного мероприятия", async () => {
    await review();
    const title = screen.getByRole("textbox", { name: "Название мероприятия 1" });
    await userEvent.clear(title);
    await userEvent.type(title, "Исправленный семинар");
    await userEvent.click(screen.getByRole("checkbox", { name: "Включить мероприятие 2" }));
    await userEvent.click(screen.getByRole("button", { name: "Создать 1 событие" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Исправленный семинар",
        speaker_id: "speaker1",
        branch_id: null,
        pricing_type: "FREE",
        start_at: new Date("2026-10-15T10:00"),
      }),
    );
  });
});
