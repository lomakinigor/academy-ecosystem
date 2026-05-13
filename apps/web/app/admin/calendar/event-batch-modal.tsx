"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Trash2 } from "lucide-react";

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

type RowState = ParsedEvent & { include: boolean };

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
        data.events.map((e) => ({
          ...e,
          // Fallback: если branch не найден — ставим default
          branch_id: e.branch_id ?? defaultBranchId,
          include: true,
        })),
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
    const selected = rows.filter((r) => r.include);
    if (selected.length === 0) return;
    setCreateError(null);

    if (missingSpeaker) {
      setCreateError("Заполните все поля");
      return;
    }

    try {
      for (const ev of selected) {
        await create.mutateAsync({
          title: ev.title,
          description: ev.description ?? undefined,
          type: ev.type as EventTypeValue,
          status: "PLANNED",
          start_at: new Date(toDatetimeLocal(ev.date, ev.start_time)),
          end_at: new Date(toDatetimeLocal(ev.date, ev.end_time)),
          speaker_id: ev.speaker_id!,
          branch_id: ev.branch_id,
          is_online: ev.is_online,
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
  const missingSpeaker = selectedRows.some((r) => !r.speaker_id);
  const isPending = create.isLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
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
            <p className="text-sm text-foreground/70">
              Распознано событий: <strong>{rows.length}</strong>. Снимите галочку, чтобы пропустить
              строку. Проверьте спикера и филиал — они должны совпадать с БД.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    <th className="py-2 pr-3">✓</th>
                    <th className="py-2 pr-3">Название</th>
                    <th className="py-2 pr-3">Тип</th>
                    <th className="py-2 pr-3">Дата и время</th>
                    <th className="py-2 pr-3">Спикер</th>
                    <th className="py-2 pr-3">Филиал</th>
                    <th className="py-2 pr-3">Онлайн</th>
                    <th className="py-2">Цена</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border/50 ${!row.include ? "opacity-40" : ""}`}
                    >
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={row.include}
                          onChange={(e) => updateRow(i, { include: e.target.checked })}
                          className="size-4 rounded border-border accent-brand-accent"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          value={row.title}
                          onChange={(e) => updateRow(i, { title: e.target.value })}
                          className="h-8 min-w-[160px] text-xs"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Select value={row.type} onValueChange={(v) => updateRow(i, { type: v })}>
                          <SelectTrigger className="h-8 w-[120px] text-xs">
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
                        <div className="flex flex-col gap-1">
                          <Input
                            type="date"
                            value={row.date}
                            onChange={(e) => updateRow(i, { date: e.target.value })}
                            className="h-8 w-[130px] text-xs"
                          />
                          <div className="flex items-center gap-1">
                            <Input
                              type="time"
                              value={row.start_time}
                              onChange={(e) => updateRow(i, { start_time: e.target.value })}
                              className="h-8 w-[80px] text-xs"
                            />
                            <span className="text-foreground/40">–</span>
                            <Input
                              type="time"
                              value={row.end_time}
                              onChange={(e) => updateRow(i, { end_time: e.target.value })}
                              className="h-8 w-[80px] text-xs"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <Select
                          value={row.speaker_id ?? "__none__"}
                          onValueChange={(v) =>
                            updateRow(i, { speaker_id: v === "__none__" ? null : v })
                          }
                        >
                          <SelectTrigger
                            className={`h-8 w-[140px] text-xs ${!row.speaker_id ? "border-warning" : ""}`}
                          >
                            <SelectValue placeholder="Выберите" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs text-foreground/50">
                              — не выбран —
                            </SelectItem>
                            {speakerList.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {row.speaker_name && !row.speaker_id && (
                          <p className="mt-0.5 text-[10px] text-warning">
                            «{row.speaker_name}» — не найден
                          </p>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Select
                          value={row.branch_id ?? "__null__"}
                          onValueChange={(v) =>
                            updateRow(i, { branch_id: v === "__null__" ? null : v })
                          }
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs">
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
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={row.is_online}
                          onChange={(e) => updateRow(i, { is_online: e.target.checked })}
                          className="size-4 rounded border-border accent-brand-accent"
                        />
                      </td>
                      <td className="py-2 text-xs text-foreground/80">
                        {row.pricing_type === "FREE"
                          ? "Бесплатно"
                          : row.pricing_type === "DONATION"
                            ? "Донат"
                            : row.price != null
                              ? `${new Intl.NumberFormat("ru-RU").format(row.price)} ₽`
                              : "—"}
                      </td>
                    </tr>
                  ))}
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
              onClick={() => setStep("input")}
              disabled={isPending}
            >
              ← Назад к тексту
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Отмена
              </Button>
              <Button
                variant="accent"
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
