"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@academy/ui";

import { trpc } from "@/lib/trpc/client";
import type { ParsedEvent } from "@/app/api/ai/parse-events/route";
import { EVENT_TYPE_LABELS, EVENT_TYPE_VALUES, type EventTypeValue } from "./filters";
import { dateOnlyStart, dateOnlyEnd } from "@/lib/events/dates";
import { normalizeParticipantLimit } from "@/lib/events/participant-limit";

interface BranchOption {
  id: string;
  name: string;
  city: string;
}

interface Speaker {
  id: string;
  name: string;
}

interface EventBatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  defaultBranchId: string | null;
  canEditNullBranch: boolean;
}

type EventFormat = "OFFLINE" | "ONLINE" | "HYBRID";

const formatToFlags = (f: EventFormat) => ({
  is_online: f === "ONLINE",
  is_hybrid: f === "HYBRID",
});

const flagsToFormat = (is_online: boolean, is_hybrid: boolean): EventFormat => {
  if (is_hybrid) return "HYBRID";
  if (is_online) return "ONLINE";
  return "OFFLINE";
};

const FORMAT_LABELS: Record<EventFormat, string> = {
  OFFLINE: "Офлайн",
  ONLINE: "Онлайн",
  HYBRID: "Онлайн+Офлайн",
};

// EXISTING — спикер найден в БД
// PENDING  — будет создан при финальном сохранении (имя распознано, но не в БД)
// MISSING  — пользователь должен выбрать вручную
type SpeakerStatus = "EXISTING" | "PENDING" | "MISSING";

type RowState = ParsedEvent & {
  include: boolean;
  is_hybrid: boolean;
  speaker_status: SpeakerStatus;
  speaker_name_edit: string;
};

const toDatetimeLocal = (date: string, time: string): string => `${date}T${time}`;

export function EventBatchModal({
  open,
  onOpenChange,
  branches,
  defaultBranchId,
  canEditNullBranch,
}: EventBatchModalProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<RowState[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "review">("input");

  const speakers = trpc.user.listSpeakers.useQuery(undefined, { enabled: open });
  const utils = trpc.useUtils();
  const create = trpc.event.create.useMutation();
  const createSpeaker = trpc.user.createSpeaker.useMutation();

  const speakerList: Speaker[] = speakers.data ?? [];

  const reset = () => {
    setText("");
    setRows([]);
    setParseError(null);
    setCreateError(null);
    setStep("input");
  };

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    setParseError(null);
    try {
      const res = await fetch("/api/ai/parse-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          speakers: speakerList.map((s) => ({ id: s.id, name: s.name })),
          branches: branches.map((b) => ({ id: b.id, city: b.city })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { events: ParsedEvent[] };

      setRows(
        data.events.map((e) => {
          let speaker_status: SpeakerStatus;
          if (e.speaker_id) {
            speaker_status = "EXISTING";
          } else if (e.speaker_name) {
            speaker_status = "PENDING";
          } else {
            speaker_status = "MISSING";
          }
          return {
            ...e,
            end_date: e.end_date ?? e.date,
            is_all_day: e.is_all_day ?? false,
            branch_id: branches.length === 0 ? null : (e.branch_id ?? defaultBranchId),
            include: true,
            is_hybrid: false,
            speaker_status,
            speaker_name_edit: e.speaker_name ?? "",
          };
        }),
      );
      setStep("review");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Ошибка при распознавании");
    } finally {
      setParsing(false);
    }
  };

  const updateRow = (i: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const handleCreateAll = async () => {
    const selected = rows
      .filter((r) => r.include)
      .map((row) => ({
        ...row,
        max_participants: normalizeParticipantLimit(row.max_participants),
      }));
    if (selected.length === 0) return;
    setCreateError(null);

    if (missingSpeaker) {
      setCreateError("Выберите спикера для всех отмеченных событий");
      return;
    }

    const invalidRange = selected.some((ev) => {
      const start = ev.is_all_day
        ? dateOnlyStart(ev.date)
        : new Date(toDatetimeLocal(ev.date, ev.start_time));
      const end = ev.is_all_day
        ? dateOnlyEnd(ev.end_date ?? ev.date)
        : ev.end_time
          ? new Date(toDatetimeLocal(ev.end_date ?? ev.date, ev.end_time))
          : null;
      return (
        !Number.isFinite(start.getTime()) ||
        Boolean(end && (!Number.isFinite(end.getTime()) || end <= start))
      );
    });
    if (invalidRange) {
      setCreateError("Проверьте даты и время начала и окончания выбранных мероприятий");
      return;
    }

    try {
      // Создаём новых спикеров батчем перед событиями
      const pendingNames = [
        ...new Set(
          selected
            .filter((r) => r.speaker_status === "PENDING")
            .map((r) => r.speaker_name_edit.trim())
            .filter(Boolean),
        ),
      ];
      const nameToId: Record<string, string> = {};
      for (const name of pendingNames) {
        const created = await createSpeaker.mutateAsync({ name });
        nameToId[name] = created.id;
      }
      if (pendingNames.length > 0) {
        utils.user.listSpeakers.invalidate();
      }

      // Создаём события
      for (const ev of selected) {
        const speakerId =
          ev.speaker_status === "PENDING" ? nameToId[ev.speaker_name_edit.trim()] : ev.speaker_id!;
        await create.mutateAsync({
          title: ev.title,
          description: ev.description ?? undefined,
          type: ev.type as EventTypeValue,
          status: "PLANNED",
          start_at: ev.is_all_day
            ? dateOnlyStart(ev.date)
            : new Date(toDatetimeLocal(ev.date, ev.start_time)),
          end_at: ev.is_all_day
            ? dateOnlyEnd(ev.end_date ?? ev.date)
            : ev.end_time
              ? new Date(toDatetimeLocal(ev.end_date ?? ev.date, ev.end_time))
              : null,
          is_all_day: ev.is_all_day ?? false,
          venue: ev.venue ?? undefined,
          speaker_id: speakerId,
          branch_id: ev.branch_id,
          is_online: ev.is_online,
          is_hybrid: ev.is_hybrid,
          pricing_type: ev.pricing_type,
          price: ev.pricing_type === "FIXED" && ev.price != null ? ev.price : undefined,
          pricing_note: ev.pricing_note ?? undefined,
          max_participants: ev.max_participants ?? undefined,
          tags: ev.tags,
        });
      }
      utils.event.list.invalidate();
      startTransition(() => router.refresh());
      reset();
      onOpenChange(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Ошибка при создании событий");
    }
  };

  const selectedRows = rows.filter((r) => r.include);
  const selectedCount = selectedRows.length;
  const missingSpeaker = selectedRows.some((r) => r.speaker_status === "MISSING");
  const pendingCount = selectedRows.filter((r) => r.speaker_status === "PENDING").length;
  const isPending = create.isLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto p-4 sm:p-6"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand-accent" />
            Пакетный ввод событий
          </DialogTitle>
          <DialogDescription>
            Вставьте список событий в свободной форме. Claude распознает даты, типы, спикеров и цены
            — вы проверяете и сохраняете одним кликом.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <textarea
              aria-label="Список мероприятий"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder={`Примеры форматов (каждое событие с новой строки или через пустую строку):

14 июня, Семинар "Лидерство", 10:00-13:00, Москва, Иван Светлов, 5000 руб, до 20 человек

15 июня — Практика медитации, онлайн, 18:00-19:30, бесплатно, Анна Мастер

1. 20 июня, Ретрит в Подмосковье, 2 дня, с проживанием, Светлов, 25000 руб
2. 22 июня, Вебинар "Осознанность", 19:00, Иван Светлов, донат`}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            />
            {parseError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {parseError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button variant="accent" onClick={handleParse} disabled={!text.trim() || parsing}>
                {parsing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Распознаём…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-4" />
                    Распознать
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/70">
              <span>
                Распознано событий: <strong>{rows.length}</strong>
              </span>
              {pendingCount > 0 && (
                <span className="rounded-full border border-brand-accent/40 bg-brand-accent/10 px-2 py-0.5 text-xs text-brand-accent">
                  {pendingCount} новых спикера — будут созданы при сохранении
                </span>
              )}
            </div>

            <div className="sm:overflow-x-auto">
              <table className="block w-full text-sm sm:table [&_td]:block [&_td]:pr-0 sm:[&_td]:table-cell sm:[&_td]:pr-3">
                <thead className="hidden sm:table-header-group">
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    <th className="py-2 pr-3">✓</th>
                    <th className="py-2 pr-3">Название</th>
                    <th className="py-2 pr-3">Тип</th>
                    <th className="py-2 pr-3">Даты и время</th>
                    <th className="py-2 pr-3">Спикер</th>
                    {branches.length > 0 && <th className="py-2 pr-3">Филиал</th>}
                    <th className="py-2 pr-3">Формат</th>
                    <th className="py-2">Цена</th>
                  </tr>
                </thead>
                <tbody className="block space-y-4 sm:table-row-group sm:space-y-0">
                  {rows.map((row, i) => {
                    const hasMissing = row.include && row.speaker_status === "MISSING";
                    return (
                      <tr
                        key={i}
                        className={`block rounded-lg border border-border/50 p-3 transition-colors sm:table-row sm:rounded-none sm:border-x-0 sm:border-t-0 sm:p-0 ${
                          !row.include ? "opacity-40" : hasMissing ? "bg-destructive/5" : ""
                        }`}
                      >
                        <td className="py-2 pr-3">
                          <label className="flex min-h-11 items-center gap-2 sm:min-h-0">
                            <input
                              type="checkbox"
                              aria-label={`Включить мероприятие ${i + 1}`}
                              title="Включить событие"
                              checked={row.include}
                              onChange={(e) => updateRow(i, { include: e.target.checked })}
                              className="size-4 rounded border-border accent-brand-accent"
                            />
                            <span className="sm:hidden">Мероприятие {i + 1}</span>
                          </label>
                        </td>
                        <td className="py-2 pr-3">
                          <span className="mb-1 block text-xs text-foreground/60 sm:hidden">
                            Название
                          </span>
                          <Input
                            aria-label={`Название мероприятия ${i + 1}`}
                            value={row.title}
                            onChange={(e) => updateRow(i, { title: e.target.value })}
                            className="h-11 w-full min-w-0 text-sm sm:h-8 sm:min-w-[160px] sm:text-xs"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <span className="mb-1 block text-xs text-foreground/60 sm:hidden">
                            Тип
                          </span>
                          <Select value={row.type} onValueChange={(v) => updateRow(i, { type: v })}>
                            <SelectTrigger
                              aria-label={`Тип мероприятия ${i + 1}`}
                              className="h-11 w-full text-sm sm:h-8 sm:w-[120px] sm:text-xs"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EVENT_TYPE_VALUES.map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {EVENT_TYPE_LABELS[t]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          <span className="mb-1 block text-xs text-foreground/60 sm:hidden">
                            Даты и время
                          </span>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-foreground/60">Начало</span>
                            <Input
                              type="date"
                              aria-label={`Дата мероприятия ${i + 1}`}
                              value={row.date}
                              onChange={(e) => updateRow(i, { date: e.target.value })}
                              className="h-11 w-full min-w-0 text-sm sm:h-8 sm:w-[130px] sm:text-xs"
                            />
                            <span className="text-xs text-foreground/60">
                              Окончание (дата включительно)
                            </span>
                            <Input
                              type="date"
                              aria-label={`Дата окончания мероприятия ${i + 1}`}
                              value={row.end_date ?? row.date}
                              onChange={(e) => updateRow(i, { end_date: e.target.value })}
                              className="h-11 w-full min-w-0 text-sm sm:h-8 sm:w-[130px] sm:text-xs"
                            />
                            <label className="flex min-h-11 items-center gap-2 whitespace-normal text-xs">
                              <input
                                type="checkbox"
                                checked={row.is_all_day ?? false}
                                onChange={(e) => updateRow(i, { is_all_day: e.target.checked })}
                              />
                              Весь день
                            </label>
                            {!row.is_all_day && (
                              <>
                                <Input
                                  type="time"
                                  aria-label={`Начало мероприятия ${i + 1}`}
                                  value={row.start_time}
                                  onChange={(e) => updateRow(i, { start_time: e.target.value })}
                                  className="h-11 w-full min-w-0 text-sm sm:h-8 sm:w-[100px] sm:text-xs"
                                />
                                <Input
                                  type="time"
                                  aria-label={`Окончание мероприятия ${i + 1}`}
                                  value={row.end_time}
                                  onChange={(e) => updateRow(i, { end_time: e.target.value })}
                                  className="h-11 w-full min-w-0 text-sm sm:h-8 sm:w-[100px] sm:text-xs"
                                />
                              </>
                            )}
                          </div>
                        </td>

                        {/* Спикер — три состояния */}
                        <td className="py-2 pr-3">
                          <span className="mb-1 block text-xs text-foreground/60 sm:hidden">
                            Спикер
                          </span>
                          {row.speaker_status === "PENDING" ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Input
                                  aria-label={`Имя нового спикера мероприятия ${i + 1}`}
                                  value={row.speaker_name_edit}
                                  onChange={(e) =>
                                    updateRow(i, { speaker_name_edit: e.target.value })
                                  }
                                  className="h-11 w-full min-w-0 text-sm sm:h-8 sm:w-[110px] sm:text-xs"
                                  placeholder="Имя спикера"
                                />
                                <span className="shrink-0 rounded-full border border-brand-accent/40 bg-brand-accent/10 px-1.5 py-0.5 text-[9px] font-semibold text-brand-accent">
                                  Новый
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  updateRow(i, {
                                    speaker_status: "MISSING",
                                    speaker_id: null,
                                  })
                                }
                                className="min-h-11 text-xs text-foreground/50 underline hover:text-foreground sm:min-h-0 sm:text-[10px]"
                              >
                                ← выбрать из БД
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Select
                                value={row.speaker_id ?? "__none__"}
                                onValueChange={(v) => {
                                  if (v === "__create__") {
                                    updateRow(i, {
                                      speaker_status: "PENDING",
                                      speaker_name_edit: row.speaker_name ?? "",
                                      speaker_id: null,
                                    });
                                  } else {
                                    updateRow(i, {
                                      speaker_id: v === "__none__" ? null : v,
                                      speaker_status: v === "__none__" ? "MISSING" : "EXISTING",
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger
                                  aria-label={`Спикер мероприятия ${i + 1}`}
                                  className={`h-11 w-full text-sm sm:h-8 sm:w-[140px] sm:text-xs ${
                                    row.speaker_status === "MISSING"
                                      ? "border-destructive ring-1 ring-destructive/50"
                                      : ""
                                  }`}
                                >
                                  <SelectValue placeholder="Выберите" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    value="__none__"
                                    className="text-xs text-foreground/50"
                                  >
                                    — не выбран —
                                  </SelectItem>
                                  <SelectItem
                                    value="__create__"
                                    className="text-xs font-medium text-brand-accent"
                                  >
                                    + Создать нового
                                  </SelectItem>
                                  {speakerList.map((s) => (
                                    <SelectItem key={s.id} value={s.id} className="text-xs">
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </td>

                        {branches.length > 0 && (
                          <td className="py-2 pr-3">
                            <span className="mb-1 block text-xs text-foreground/60 sm:hidden">
                              Филиал
                            </span>
                            <Select
                              value={row.branch_id ?? "__null__"}
                              onValueChange={(v) =>
                                updateRow(i, { branch_id: v === "__null__" ? null : v })
                              }
                            >
                              <SelectTrigger
                                aria-label={`Филиал мероприятия ${i + 1}`}
                                className="h-11 w-full text-sm sm:h-8 sm:w-[130px] sm:text-xs"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {canEditNullBranch && (
                                  <SelectItem value="__null__" className="text-xs">
                                    Все филиалы
                                  </SelectItem>
                                )}
                                {branches.map((b) => (
                                  <SelectItem key={b.id} value={b.id} className="text-xs">
                                    {b.city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        )}
                        <td className="py-2 pr-3">
                          <span className="mb-1 block text-xs text-foreground/60 sm:hidden">
                            Формат
                          </span>
                          <Select
                            value={flagsToFormat(row.is_online, row.is_hybrid)}
                            onValueChange={(v) => updateRow(i, formatToFlags(v as EventFormat))}
                          >
                            <SelectTrigger
                              aria-label={`Формат мероприятия ${i + 1}`}
                              className="h-11 w-full text-sm sm:h-8 sm:w-[130px] sm:text-xs"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(["OFFLINE", "ONLINE", "HYBRID"] as EventFormat[]).map((f) => (
                                <SelectItem key={f} value={f} className="text-xs">
                                  {FORMAT_LABELS[f]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 text-xs text-foreground/80">
                          <span className="mb-1 block text-xs text-foreground/60 sm:hidden">
                            Цена
                          </span>
                          {row.pricing_type === "FREE"
                            ? "Бесплатно"
                            : row.pricing_type === "DONATION"
                              ? "Донат"
                              : row.price != null
                                ? `${new Intl.NumberFormat("ru-RU").format(row.price)} ₽`
                                : "—"}
                          {row.pricing_note && (
                            <p className="mt-1 whitespace-normal">{row.pricing_note}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {createError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createError}
              </p>
            )}
          </div>
        )}

        {step === "review" && (
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={() => setStep("input")}
              disabled={isPending}
            >
              ← Назад к тексту
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="min-h-11"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Отмена
              </Button>
              <Button
                variant="accent"
                className="min-h-11"
                onClick={handleCreateAll}
                disabled={selectedCount === 0 || missingSpeaker || isPending}
                title={missingSpeaker ? "Выберите спикера для всех событий" : undefined}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Создаём…
                  </>
                ) : (
                  `Создать ${selectedCount} ${selectedCount === 1 ? "событие" : selectedCount < 5 ? "события" : "событий"}`
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
