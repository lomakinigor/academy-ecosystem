"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2 } from "lucide-react";

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

type PricingType = "FIXED" | "DONATION" | "FREE";
type EventStatus = "DRAFT" | "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Черновик",
  PLANNED: "Запланировано",
  ACTIVE: "Идёт сейчас",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
};

const PRICING_LABELS: Record<PricingType, string> = {
  FIXED: "Цена",
  DONATION: "Донат",
  FREE: "Бесплатно",
};

interface BranchOption {
  id: string;
  name: string;
  city: string;
}

export interface EventFormInitial {
  id: string;
  title: string;
  description: string | null;
  type: EventTypeValue;
  status: EventStatus;
  start_at: Date;
  end_at: Date;
  branch_id: string | null;
  speaker_id: string;
  is_online: boolean;
  pricing_type: PricingType;
  price: number | null;
  pricing_note: string | null;
  tags: string[];
  max_participants: number | null;
}

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: BranchOption[];
  initial?: EventFormInitial; // если передан — редактирование, иначе создание
  canEditNullBranch: boolean; // global users: можно делать общеакадемическое
  defaultBranchId: string | null; // для scoped: свой филиал
  onSwitchToBatch?: () => void;
}

const toLocalInput = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (s: string): Date => new Date(s);

export function EventFormModal({
  open,
  onOpenChange,
  branches,
  initial,
  canEditNullBranch,
  defaultBranchId,
  onSwitchToBatch,
}: EventFormModalProps) {
  const isEdit = Boolean(initial);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const speakers = trpc.user.listSpeakers.useQuery(undefined, {
    enabled: open, // только когда модалка открыта
  });

  const utils = trpc.useUtils();

  const onSuccess = () => {
    utils.event.list.invalidate();
    startTransition(() => router.refresh());
    onOpenChange(false);
  };

  const create = trpc.event.create.useMutation({
    onSuccess,
    onError: (e) => setError(e.message),
  });
  const update = trpc.event.update.useMutation({
    onSuccess,
    onError: (e) => setError(e.message),
  });
  const remove = trpc.event.delete.useMutation({
    onSuccess,
    onError: (e) => setError(e.message),
  });

  // Form state — простая локальная форма без react-hook-form, MVP-уровень
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventTypeValue>("SEMINAR");
  const [status, setStatus] = useState<EventStatus>("PLANNED");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [branchId, setBranchId] = useState<string>(""); // "" = общеакадемическое
  const [speakerId, setSpeakerId] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [pricingType, setPricingType] = useState<PricingType>("FIXED");
  const [price, setPrice] = useState<string>("");
  const [pricingNote, setPricingNote] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [tagsRaw, setTagsRaw] = useState("");

  // Подгружаем initial при открытии (или сбрасываем для create)
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setTitle(initial.title);
      setType(initial.type);
      setStatus(initial.status);
      setDescription(initial.description ?? "");
      setStart(toLocalInput(initial.start_at));
      setEnd(toLocalInput(initial.end_at));
      setBranchId(initial.branch_id ?? "");
      setSpeakerId(initial.speaker_id);
      setIsOnline(initial.is_online);
      setPricingType(initial.pricing_type);
      setPrice(initial.price !== null ? String(initial.price) : "");
      setPricingNote(initial.pricing_note ?? "");
      setMaxParticipants(initial.max_participants !== null ? String(initial.max_participants) : "");
      setTagsRaw(initial.tags.join(", "));
    } else {
      setTitle("");
      setType("SEMINAR");
      setStatus("PLANNED");
      setDescription("");
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const later = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      setStart(toLocalInput(now));
      setEnd(toLocalInput(later));
      setBranchId(defaultBranchId ?? "");
      setSpeakerId("");
      setIsOnline(false);
      setPricingType("FIXED");
      setPrice("");
      setPricingNote("");
      setMaxParticipants("");
      setTagsRaw("");
    }
  }, [open, initial, defaultBranchId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 3) {
      setError("Название минимум 3 символа");
      return;
    }
    if (!start || !end) {
      setError("Укажите даты начала и окончания");
      return;
    }
    const startDate = fromLocalInput(start);
    const endDate = fromLocalInput(end);
    if (endDate <= startDate) {
      setError("Окончание должно быть позже начала");
      return;
    }
    if (!speakerId) {
      setError("Выберите спикера");
      return;
    }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const branchValue: string | null = branchId === "" ? null : branchId;
    const priceValue = pricingType === "FIXED" && price !== "" ? Number(price) : undefined;
    const maxValue = maxParticipants !== "" ? Number(maxParticipants) : undefined;

    const common = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      status,
      start_at: startDate,
      end_at: endDate,
      speaker_id: speakerId,
      branch_id: branchValue,
      is_online: isOnline,
      pricing_type: pricingType,
      price: priceValue,
      pricing_note: pricingNote.trim() || undefined,
      max_participants: maxValue,
      tags,
    };

    if (isEdit && initial) {
      await update.mutateAsync({ id: initial.id, ...common });
    } else {
      await create.mutateAsync(common);
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!window.confirm("Удалить событие? Связанные брони будут стёрты.")) {
      return;
    }
    await remove.mutateAsync({ id: initial.id });
  };

  const isPending = create.isLoading || update.isLoading || remove.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle>{isEdit ? "Редактировать событие" : "Новое событие"}</DialogTitle>
              <DialogDescription className="mt-1">
                {isEdit
                  ? "Изменения сохранятся сразу после нажатия «Сохранить»"
                  : "Заполните основные поля. Все они обязательны для публикации."}
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

            <Field label="Статус">
              <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as EventStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Филиал">
              <Select
                value={branchId === "" ? "__null__" : branchId}
                onValueChange={(v) => setBranchId(v === "__null__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите филиал" />
                </SelectTrigger>
                <SelectContent>
                  {canEditNullBranch && (
                    <SelectItem value="__null__">Все филиалы (общеакадемическое)</SelectItem>
                  )}
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Начало">
              <Input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </Field>

            <Field label="Окончание">
              <Input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </Field>

            <Field label="Спикер">
              <Select value={speakerId} onValueChange={setSpeakerId}>
                <SelectTrigger>
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
            </Field>

            <Field label="Формат">
              <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3">
                <input
                  id="is-online"
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="size-4 rounded border-border accent-brand-accent"
                />
                <label htmlFor="is-online" className="text-sm">
                  Онлайн
                </label>
              </div>
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

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
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
            <div className="flex gap-2">
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
