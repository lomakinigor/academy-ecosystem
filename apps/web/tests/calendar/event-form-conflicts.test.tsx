import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const api = vi.hoisted(() => ({
  check: vi.fn(),
  save: vi.fn(),
  query: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      event: { list: { invalidate: vi.fn() }, conflicts: { fetch: api.check } },
      user: { listSpeakers: { invalidate: vi.fn() } },
    }),
    user: {
      listSpeakers: { useQuery: () => ({ data: [{ id: "speaker1", name: "Спикер" }] }) },
      createSpeaker: { useMutation: () => ({ isLoading: false }) },
    },
    event: {
      conflicts: { useQuery: api.query },
      create: { useMutation: () => ({ mutateAsync: api.save, isLoading: false }) },
      update: { useMutation: () => ({ mutateAsync: api.save, isLoading: false }) },
      delete: { useMutation: () => ({ isLoading: false }) },
    },
  },
}));

import { EventFormModal, type EventFormInitial } from "@/app/admin/calendar/event-form-modal";

const initial: EventFormInitial = {
  id: "evt1",
  title: "Семинар",
  description: null,
  type: "SEMINAR",
  status: "PLANNED",
  start_at: new Date(2026, 5, 1, 10),
  end_at: new Date(2026, 5, 1, 18),
  speaker_id: "speaker1",
  branch_id: null,
  is_online: false,
  venue: "Зал 1",
  pricing_type: "FREE",
  price: null,
  pricing_note: null,
  tags: [],
  max_participants: null,
};
const conflict = { ...initial, id: "evt2", title: "Практика", reasons: ["SPEAKER", "VENUE"] };

const showForm = (event: EventFormInitial | null = initial) =>
  render(
    <EventFormModal
      open
      onOpenChange={vi.fn()}
      branches={[]}
      initial={event ?? undefined}
      canEditNullBranch
      defaultBranchId={null}
    />,
  );

beforeEach(() => {
  vi.restoreAllMocks();
  api.save.mockReset().mockResolvedValue({});
  api.check.mockReset().mockResolvedValue([]);
  api.query.mockReset().mockReturnValue({ data: [] });
});

describe("Форма: время и подтверждение пересечений", () => {
  it("подставляет выбранную дату и оставляет имя ручным, вид и спикера списками", () => {
    render(
      <EventFormModal
        open
        onOpenChange={vi.fn()}
        branches={[]}
        canEditNullBranch
        defaultBranchId={null}
        defaultDate="2026-11-10"
      />,
    );
    expect((screen.getByLabelText("Начало") as HTMLInputElement).value).toMatch(/^2026-11-10T/);
    expect(screen.getByLabelText("Название").tagName).toBe("INPUT");
    expect(screen.getByRole("combobox", { name: "Тип" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Добавить нового спикера" })).toBeInTheDocument();
  });
  it("редактирует даты без времени, не сдвигая включённый последний день", async () => {
    showForm({
      ...initial,
      ...{ is_all_day: true },
      start_at: new Date("2026-10-15T00:00Z"),
      end_at: new Date("2026-10-18T00:00Z"),
    });
    expect(screen.getByLabelText("Весь день")).toBeChecked();
    expect(screen.getByLabelText("Начало")).toHaveValue("2026-10-15");
    expect(screen.getByLabelText("Окончание")).toHaveValue("2026-10-17");
    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        expect.objectContaining({
          is_all_day: true,
          end_at: new Date("2026-10-18T00:00Z"),
        }),
      ),
    );
  });
  it("для поселения включает весь день и позволяет вручную вернуть часы", async () => {
    showForm();
    fireEvent.change(screen.getByLabelText("Место проведения"), {
      target: { value: "На поселении" },
    });
    expect(screen.getByLabelText("Весь день")).toBeChecked();
    await userEvent.click(screen.getByLabelText("Весь день"));
    fireEvent.change(screen.getByLabelText("Место проведения"), {
      target: { value: "На поселении, дом 1" },
    });
    expect(screen.getByLabelText("Весь день")).not.toBeChecked();
    expect(screen.getByLabelText("Начало")).toHaveAttribute("type", "datetime-local");
  });
  it("в общей админке не предлагает выбор филиала", () => {
    showForm();
    expect(screen.queryByText("Филиал")).not.toBeInTheDocument();
  });
  it("показывает день недели и сохраняет исходное окончание", async () => {
    showForm();
    expect(screen.getByText(/понедельник/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText("Неделя выбранного мероприятия").querySelector('[aria-current="date"]'),
    ).toHaveTextContent("1");
    expect(screen.getByLabelText("Окончание")).toHaveValue("2026-06-01T18:00");
    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        expect.objectContaining({
          start_at: initial.start_at,
          end_at: initial.end_at,
        }),
      ),
    );
  });

  it("новому событию задаёт окончание через два часа", () => {
    showForm(null);
    const start = screen.getByLabelText("Начало") as HTMLInputElement;
    const end = screen.getByLabelText("Окончание") as HTMLInputElement;
    expect(new Date(end.value).getTime() - new Date(start.value).getTime()).toBe(7200000);
  });

  it("не сохраняет неверный диапазон", async () => {
    showForm();
    fireEvent.change(screen.getByLabelText("Окончание"), { target: { value: "2026-06-01T09:00" } });
    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(screen.getByText(/окончания должно быть позже/i)).toBeInTheDocument();
    expect(api.check).not.toHaveBeenCalled();
    expect(api.save).not.toHaveBeenCalled();
  });

  it("показывает название конфликта и не сохраняет при отказе", async () => {
    api.query.mockReturnValue({ data: [conflict] });
    api.check.mockResolvedValue([conflict]);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    showForm();
    expect(screen.getByText(/Практика/)).toBeInTheDocument();
    expect(screen.getByText(/спикер, площадка/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Практика")));
    expect(api.save).not.toHaveBeenCalled();
  });

  it("проверяет заново и позволяет подтвердить найденный конфликт", async () => {
    api.check.mockResolvedValue([conflict]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    showForm();
    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    await waitFor(() => expect(api.save).toHaveBeenCalledOnce());
    expect(api.check).toHaveBeenCalledWith(
      expect.objectContaining({ id: initial.id, venue: "Зал 1" }),
      { staleTime: 0 },
    );
  });

  it("при ошибке проверки оставляет форму и не сохраняет", async () => {
    api.check.mockRejectedValue(new Error("Нет соединения"));
    showForm();
    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    await waitFor(() => expect(screen.getByText(/повторите сохранение/i)).toBeInTheDocument());
    expect(api.save).not.toHaveBeenCalled();
  });
});
