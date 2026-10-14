"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Trash2, UserPlus } from "lucide-react";

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
import { EVENT_TYPE_LABELS, EVENT_TYPE_VALUES, type EventTypeValue } from "./filters";
import { getWeekDays, startOfWeekMonday } from "./weekly-calendar";
import { dateOnlyStart, dateOnlyEnd, lastEventDate } from "@/lib/events/dates";
import { calendarTitle } from "@/lib/events/short-title";

type PricingType = "FIXED" | "DONATION" | "FREE";
type EventStatus = "DRAFT" | "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
type EventFormat = "OFFLINE" | "ONLINE" | "HYBRID";

interface BranchOption {
  id: string;
  name: string;
  city: string;
}

const PRICING_LABELS: Record<PricingType, string> = {
  FIXED: "Цена",
  DONATION: "Донат",
  FREE: "Бесплатно",
};

const FORMAT_LABELS: Record<EventFormat, string> = {
  OFFLINE: "Офлайн",
  ONLINE: "Онлайн",
  HYBRID: "Онлайн + Офлайн",
};

export interface EventFormInitial {
  id: string;
  title: string;
  calendar_title?: string | null;
  description: string | null;
  type: EventTypeValue;
  status: EventStatus;
  start_at: Date;
  end_at: Date | null;
  is_all_day?: boolean;
  branch_id: string | null;
  speaker_id: string;
  is_online: boolean;
  is_hybrid?: boolean;
  venue?: string | null;
  pricing_type: PricingType;
  price: number | null;
  pricing_note: string | null;
  tags: string[];
  max_participants: number | null;
  created_at?: Date;
  updated_at?: Date;
  confirmed_count?: number;
  waitlist_count?: number;
}

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Сохраняем совместимость с будущим разделением на филиалы. */
  branches?: BranchOption[];
  initial?: EventFormInitial;
  canEditNullBranch?: boolean;
  defaultBranchId?: string | null;
  onSwitchToBatch?: () => void;
  defaultDate?: string;
}

const toLocalInput = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (s: string): Date => new Date(s);

const onlineHybridToFormat = (is_online: boolean, is_hybrid?: boolean): EventFormat => {
  if (is_online && is_hybrid) return "HYBRID";
  if (is_online) return "ONLINE";
  return "OFFLINE";
};

const formatToFlags = (fmt: EventFormat): { is_online: boolean; is_hybrid: boolean } => {
  if (fmt === "ONLINE") return { is_online: true, is_hybrid: false };
  if (fmt === "HYBRID") return { is_online: true, is_hybrid: true };
  return { is_online: false, is_hybrid: false };
};

export function EventFormModal({
  open,
  onOpenChange,
  initial,
  onSwitchToBatch,
  defaultDate,
}: EventFormModalProps) {
  const isEdit = Boolean(initial);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const speakers = trpc.user.listSpeakers.useQuery(undefined, { enabled: open });
  const utils = trpc.useUtils();

  const onSuccess = () => {
    utils.event.list.invalidate();
    startTransition(() => router.refresh());
    onOpenChange(false);
  };

  const create = trpc.event.create.useMutation({ onSuccess, onError: (e) => setError(e.message) });
  const update = trpc.event.update.useMutation({ onSuccess, onError: (e) => setError(e.message) });
  const remove = trpc.event.delete.useMutation({ onSuccess, onError: (e) => setError(e.message) });

  const createSpeaker = trpc.user.createSpeaker.useMutation({
    onSuccess: (speaker) => {
      utils.user.listSpeakers.invalidate();
      setSpeakerId(speaker.id);
      setShowNewSpeaker(false);
      setNewSpeakerName("");
    },
    onError: (e) => setError(e.message),
  });

  // Form state
  const [title, setTitle] = useState("");
  const [shortTitle, setShortTitle] = useState("");
  const [type, setType] = useState<EventTypeValue>("LESSON");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [branchId, setBranchId] = useState<string>("");
  const [speakerId, setSpeakerId] = useState("");
  const [format, setFormat] = useState<EventFormat>("OFFLINE");
  const [venue, setVenue] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("FREE");
  const [price, setPrice] = useState<string>("");
  const [pricingNote, setPricingNote] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [tagsRaw, setTagsRaw] = useState("");

  const startDate = allDay ? dateOnlyStart(start) : fromLocalInput(start);
  const endDate = allDay ? dateOnlyEnd(end || start) : end ? fromLocalInput(end) : null;
  const calendarDate = allDay ? new Date(`${start.slice(0, 10)}T12:00`) : startDate;
  const validRange = Number.isFinite(startDate.getTime()) && (!endDate || endDate > startDate);
  const conflictInput = {
    id: initial?.id,
    start_at: startDate,
    end_at: endDate,
    speaker_id: speakerId,
    venue: venue.trim() || undefined,
    branch_id: branchId || null,
  };
  const conflicts = trpc.event.conflicts.useQuery(conflictInput, {
    enabled: open && validRange && Boolean(speakerId),
    retry: false,
  });

  // Speaker creation inline
  const [showNewSpeaker, setShowNewSpeaker] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setShortTitle(initial?.calendar_title ?? "");
    setShowNewSpeaker(false);
    setNewSpeakerName("");
    if (initial) {
      setTitle(initial.title);
      setType(initial.type);
      setDescription(initial.description ?? "");
      setAllDay(initial.is_all_day ?? false);
      setStart(
        initial.is_all_day
          ? `${initial.start_at.toISOString().slice(0, 10)}T00:00`
          : toLocalInput(initial.start_at),
      );
      setEnd(
        initial.is_all_day
          ? `${lastEventDate(initial.end_at ?? dateOnlyEnd(initial.start_at.toISOString()))}T00:00`
          : initial.end_at
            ? toLocalInput(initial.end_at)
            : "",
      );
      setBranchId(initial.branch_id ?? "");
      setSpeakerId(initial.speaker_id);
      setFormat(onlineHybridToFormat(initial.is_online, initial.is_hybrid));
      setVenue(initial.venue ?? "");
      setPricingType(initial.pricing_type);
      setPrice(initial.price !== null ? String(initial.price) : "");
      setPricingNote(initial.pricing_note ?? "");
      setMaxParticipants(initial.max_participants !== null ? String(initial.max_participants) : "");
      setTagsRaw(initial.tags.join(", "));
    } else {
      setTitle("");
      setAllDay(false);
      setType("LESSON");
      setDescription("");
      const now = new Date();
      now.setMinutes(0, 0, 0);
      if (defaultDate) {
        const [year, month, day] = defaultDate.split("-").map(Number);
        now.setFullYear(year!, month! - 1, day!);
      }
      setStart(toLocalInput(now));
      setEnd("");
      setBranchId("");
      setSpeakerId("");
      setFormat("OFFLINE");
      setVenue("");
      setPricingType("FREE");
      setPrice("");
      setPricingNote("");
      setMaxParticipants("");
      setTagsRaw("");
    }
  }, [open, initial, defaultDate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 3) {
      setError("Название минимум 3 символа");
      return;
    }
    if (!start) {
      setError("Укажите дату начала");
      return;
    }
    if (!speakerId) {
      setError("Выберите спикера");
      return;
    }

    if (!validRange) {
      setError("Время окончания должно быть позже времени начала");
      return;
    }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const branchValue: string | null = branchId === "" ? null : branchId;
    const priceValue = pricingType === "FIXED" && price !== "" ? Number(price) : undefined;
    const maxValue = maxParticipants !== "" ? Number(maxParticipants) : undefined;
    const { is_online, is_hybrid } = formatToFlags(format);

    const common = {
      title: title.trim(),
      calendar_title: shortTitle.trim() || null,
      description: description.trim() || undefined,
      type,
      start_at: startDate,
      end_at: endDate,
      is_all_day: allDay,
      speaker_id: speakerId,
      branch_id: branchValue,
      is_online,
      is_hybrid,
      venue: venue.trim() || undefined,
      pricing_type: pricingType,
      price: priceValue,
      pricing_note: pricingNote.trim() || undefined,
      max_participants: maxValue,
      tags,
    };

    setCheckingConflicts(true);
    try {
      const currentConflicts = endDate
        ? await utils.event.conflicts.fetch(conflictInput, { staleTime: 0 })
        : [];
      if (
        currentConflicts.length > 0 &&
        !window.confirm(
          `Есть пересечения: ${currentConflicts.map((event) => event.title).join(", ")}. Сохранить всё равно?`,
        )
      )
        return;
    } catch {
      setError("Не удалось проверить пересечения. Проверьте соединение и повторите сохранение.");
      return;
    } finally {
      setCheckingConflicts(false);
    }

    try {
      if (isEdit && initial) {
        await update.mutateAsync({ id: initial.id, ...common });
      } else {
        await create.mutateAsync(common);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить событие");
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!window.confirm("Удалить событие? Связанные брони будут стёрты.")) return;
    await remove.mutateAsync({ id: initial.id });
  };

  const isPending =
    checkingConflicts ||
    create.isLoading ||
    update.isLoading ||
    remove.isLoading ||
    createSpeaker.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] max-h-[100dvh] w-full max-w-none rounded-none overflow-y-auto p-4 sm:h-auto sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:rounded-lg sm:p-6 [&_input]:min-h-11 [&_button]:min-h-11">
        <DialogHeader>
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
            <div>
              <DialogTitle>{isEdit ? "Редактировать событие" : "Новое событие"}</DialogTitle>
              <DialogDescription className="mt-1">
                {isEdit
                  ? "Изменения сохранятся сразу после нажатия «Сохранить»"
                  : "Карточка мероприятия: название, дата и время, спикер, место, стоимость и количество мест. Дополнительные поля можно оставить пустыми."}
              </DialogDescription>
            </div>
            {!isEdit && onSwitchToBatch && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSwitchToBatch}
                className="shrink-0"
              >
                <Sparkles className="size-4" />
                Вставить списком
              </Button>
            )}
          </div>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          {initial && (
            <div className="rounded-lg border border-border bg-brand-warm/40 p-3 text-sm">
              <p>
                Статус:{" "}
                {
                  {
                    DRAFT: "Черновик",
                    PLANNED: "Запланировано",
                    ACTIVE: "Идёт",
                    COMPLETED: "Завершено",
                    CANCELLED: "Отменено",
                  }[initial.status]
                }
              </p>
              <p>
                Подтверждено: {initial.confirmed_count ?? 0}
                {initial.max_participants
                  ? ` / ${initial.max_participants} · Свободно: ${Math.max(0, initial.max_participants - (initial.confirmed_count ?? 0))}`
                  : " · без лимита"}
              </p>
              <p>Лист ожидания: {initial.waitlist_count ?? 0}</p>
            </div>
          )}
          {initial?.created_at && (
            <p className="text-xs text-foreground/60">
              Создано:{" "}
              {initial.created_at.toLocaleString("ru-RU", { timeZone: "Asia/Yekaterinburg" })}
              {initial.updated_at
                ? ` · Изменено: ${initial.updated_at.toLocaleString("ru-RU", { timeZone: "Asia/Yekaterinburg" })}`
                : ""}
            </p>
          )}
          <Field label="Название">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>

          <Field label="Описание">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              placeholder="Краткое описание события"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Тип">
              <Select value={type} onValueChange={(v) => setType(v as EventTypeValue)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_VALUES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {EVENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Краткое название для календаря">
              <Input
                aria-label="Краткое название для календаря"
                value={shortTitle}
                onChange={(e) => setShortTitle(e.target.value)}
                maxLength={40}
                placeholder={calendarTitle(title)}
              />
              <p className="mt-1 text-xs text-foreground/60">
                Автоматически: {calendarTitle(title)}. Введите свою подпись, чтобы заменить.
              </p>
            </Field>
            <label className="flex min-h-11 items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="size-4 accent-brand-accent"
              />
              Весь день
            </label>
            {allDay && (
              <p className="text-xs text-foreground/60 sm:col-span-2">
                Укажите первую и последнюю дату включительно. Часы проведения не задаются.
              </p>
            )}
            <Field label="Начало">
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? start.slice(0, 10) : start}
                onChange={(e) => setStart(allDay ? `${e.target.value}T00:00` : e.target.value)}
                required
              />
            </Field>

            <Field label="Окончание">
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? (end || start).slice(0, 10) : end}
                onChange={(e) => setEnd(allDay ? `${e.target.value}T00:00` : e.target.value)}
                required={allDay}
              />
            </Field>

            <Field label="Спикер">
              {showNewSpeaker ? (
                <div className="flex gap-2">
                  <Input
                    value={newSpeakerName}
                    onChange={(e) => setNewSpeakerName(e.target.value)}
                    placeholder="Имя и фамилия"
                    autoFocus
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="accent"
                    disabled={newSpeakerName.trim().length < 2 || createSpeaker.isLoading}
                    onClick={() => createSpeaker.mutate({ name: newSpeakerName.trim() })}
                  >
                    {createSpeaker.isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Добавить"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowNewSpeaker(false)}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={speakerId} onValueChange={setSpeakerId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите спикера" />
                    </SelectTrigger>
                    <SelectContent>
                      {(speakers.data ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewSpeaker(true)}
                    title="Добавить нового спикера"
                  >
                    <UserPlus className="size-4" />
                  </Button>
                </div>
              )}
            </Field>

            <Field label="Формат">
              <Select value={format} onValueChange={(v) => setFormat(v as EventFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["OFFLINE", "ONLINE", "HYBRID"] as EventFormat[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {FORMAT_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Место проведения">
              <Input
                value={venue}
                onChange={(e) => {
                  const nextVenue = e.target.value;
                  if (/поселени[еяию]/i.test(nextVenue) && !/поселени[еяию]/i.test(venue)) {
                    setAllDay(true);
                  }
                  setVenue(nextVenue);
                }}
                placeholder="ул. 8 Марта 194Б, зал 3 / zoom.us/j/..."
              />
            </Field>

            <Field label="Стоимость">
              <Select value={pricingType} onValueChange={(v) => setPricingType(v as PricingType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["FIXED", "DONATION", "FREE"] as PricingType[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRICING_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Цена, ₽">
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={pricingType !== "FIXED"}
                placeholder={pricingType !== "FIXED" ? "—" : "5000"}
              />
            </Field>
          </div>

          {Number.isFinite(startDate.getTime()) && (
            <div className="space-y-2">
              <p className="text-sm text-foreground/70">
                Выбранная дата:{" "}
                {calendarDate.toLocaleDateString("ru-RU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div aria-label="Неделя выбранного мероприятия" className="grid grid-cols-7 gap-1">
                {getWeekDays(startOfWeekMonday(calendarDate)).map((day, index) => {
                  const selected = day.toDateString() === calendarDate.toDateString();
                  return (
                    <div
                      key={day.toISOString()}
                      aria-current={selected ? "date" : undefined}
                      className={`rounded-md py-2 text-center text-xs ${selected ? "bg-brand-accent font-semibold text-brand-primary" : index >= 5 ? "bg-brand-warm text-foreground" : "bg-background text-foreground/70"}`}
                    >
                      <span className="block">
                        {day.toLocaleDateString("ru-RU", { weekday: "short" })}
                      </span>
                      <span className="mt-1 block">{day.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {validRange && (conflicts.data?.length ?? 0) > 0 && (
            <div
              role="status"
              className="rounded-lg border border-brand-accent/40 bg-brand-warm p-3 text-sm"
            >
              <p className="font-semibold">Есть пересечения по времени:</p>
              <ul className="mt-2 space-y-2">
                {conflicts.data?.map((event) => (
                  <li key={event.id}>
                    {event.title} —{" "}
                    {event.reasons
                      .map((reason) => (reason === "SPEAKER" ? "спикер" : "площадка"))
                      .join(", ")}
                  </li>
                ))}
              </ul>
              <p className="mt-2">Можно сохранить после подтверждения.</p>
            </div>
          )}

          <Field label="Заметка о цене (early bird, минимум для доната)">
            <Input
              value={pricingNote}
              onChange={(e) => setPricingNote(e.target.value)}
              placeholder="До 30.05 — 12 000 ₽, далее — 15 000 ₽"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Макс. участников">
              <Input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="50"
              />
            </Field>

            <Field label="Теги (через запятую)">
              <Input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="с детьми, открытое занятие"
              />
            </Field>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="sticky -bottom-4 z-10 -mx-4 flex-row items-center justify-between gap-1 border-t border-border bg-card px-2 py-2 sm:static sm:mx-0 sm:border-0 sm:p-0 [&_button]:px-2 [&_button]:text-xs sm:[&_button]:text-sm">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isPending}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
                Удалить
              </Button>
            ) : (
              <span />
            )}
            <div className="flex min-w-0 flex-row gap-1 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Отмена
              </Button>
              <Button type="submit" variant="accent" disabled={isPending}>
                {isPending ? "Сохраняем…" : isEdit ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-heading text-xs font-semibold uppercase tracking-wider text-foreground/60">
        {label}
      </span>
      {children}
    </label>
  );
}
