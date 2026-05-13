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

type PricingType = "FIXED" | "DONATION" | "FREE";
type EventStatus = "DRAFT" | "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
type EventFormat = "OFFLINE" | "ONLINE" | "HYBRID";

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
  is_hybrid?: boolean;
  venue?: string | null;
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
  initial?: EventFormInitial;
  canEditNullBranch: boolean;
  defaultBranchId: string | null;
  onSwitchToBatch?: () => void;
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
  const [type, setType] = useState<EventTypeValue>("LESSON");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [speakerId, setSpeakerId] = useState("");
  const [format, setFormat] = useState<EventFormat>("OFFLINE");
  const [venue, setVenue] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("FREE");
  const [price, setPrice] = useState<string>("");
  const [pricingNote, setPricingNote] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [tagsRaw, setTagsRaw] = useState("");

  // Speaker creation inline
  const [showNewSpeaker, setShowNewSpeaker] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setShowNewSpeaker(false);
    setNewSpeakerName("");
    if (initial) {
      setTitle(initial.title);
      setType(initial.type);
      setDescription(initial.description ?? "");
      setStart(toLocalInput(initial.start_at));
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
      setType("LESSON");
      setDescription("");
      const now = new Date();
      now.setMinutes(0, 0, 0);
      setStart(toLocalInput(now));
      setBranchId(defaultBranchId ?? "");
      setSpeakerId("");
      setFormat("OFFLINE");
      setVenue("");
      setPricingType("FREE");
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
    if (!start) {
      setError("Укажите дату начала");
      return;
    }
    if (!speakerId) {
      setError("Выберите спикера");
      return;
    }

    const startDate = fromLocalInput(start);
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
      description: description.trim() || undefined,
      type,
      start_at: startDate,
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

    if (isEdit && initial) {
      await update.mutateAsync({ id: initial.id, ...common });
    } else {
      await create.mutateAsync(common);
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!window.confirm("Удалить событие? Связанные брони будут стёрты.")) return;
    await remove.mutateAsync({ id: initial.id });
  };

  const isPending =
    create.isLoading || update.isLoading || remove.isLoading || createSpeaker.isLoading;

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
                onChange={(e) => setVenue(e.target.value)}
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
