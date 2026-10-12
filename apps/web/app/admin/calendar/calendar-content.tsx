"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@academy/ui";

import type { EventCardData } from "./event-card";
import { EventBatchModal } from "./event-batch-modal";
import { EventFormModal, type EventFormInitial } from "./event-form-modal";
import { startOfWeekMonday, WeeklyCalendar } from "./weekly-calendar";

interface BranchOption {
  id: string;
  name: string;
  city: string;
}

interface CalendarContentProps {
  events: EventCardData[];
  branches: BranchOption[];
  canAuthor: boolean; // юзер может вообще создавать события
  canEditNullBranch: boolean; // юзер может ставить branch_id=null (общеакад.)
  defaultBranchId: string | null;
  initialDate: Date;
}

const fromCard = (e: EventCardData): EventFormInitial => ({
  id: e.id,
  title: e.title,
  description: e.description,
  type: e.type,
  status: e.status,
  start_at: e.start_at,
  end_at: e.end_at,
  branch_id: e.branch?.id ?? null,
  speaker_id: e.speaker.id,
  is_online: e.is_online,
  pricing_type: e.pricing_type,
  price: e.price,
  pricing_note: e.pricing_note,
  tags: e.tags,
  max_participants: e.max_participants,
});

/**
 * Client-обёртка вокруг agenda-list + создания/редактирования.
 * Владеет state модалки и колбэками. Всё ниже остаётся «тупым» рендером.
 */
export function CalendarContent({
  events,
  branches,
  canAuthor,
  canEditNullBranch,
  defaultBranchId,
  initialDate,
}: CalendarContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [initial, setInitial] = useState<EventFormInitial | undefined>();
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(initialDate));

  useEffect(() => {
    setWeekStart(startOfWeekMonday(initialDate));
  }, [initialDate]);

  const changeWeek = (offset: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + offset * 7);
    setWeekStart(next);
    const params = new URLSearchParams(searchParams.toString());
    const formatDate = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const end = new Date(next);
    end.setDate(end.getDate() + 6);
    params.set("period", "custom");
    params.set("from", formatDate(next));
    params.set("to", formatDate(end));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const openCreate = () => {
    setInitial(undefined);
    setOpen(true);
  };
  const openEdit = (ev: EventCardData) => {
    setInitial(fromCard(ev));
    setOpen(true);
  };

  return (
    <>
      {canAuthor && (
        <div className="mb-4 flex justify-end gap-2">
          <Button type="button" variant="accent" size="sm" onClick={openCreate}>
            <Plus />
            Создать событие
          </Button>
        </div>
      )}

      <WeeklyCalendar
        events={events}
        weekStart={weekStart}
        onPreviousWeek={() => changeWeek(-1)}
        onNextWeek={() => changeWeek(1)}
        onEventClick={canAuthor ? openEdit : undefined}
      />

      <EventBatchModal
        open={batchOpen}
        onOpenChange={setBatchOpen}
        branches={branches}
        defaultBranchId={defaultBranchId}
        canEditNullBranch={canEditNullBranch}
      />

      <EventFormModal
        open={open}
        onOpenChange={setOpen}
        branches={branches}
        initial={initial}
        canEditNullBranch={canEditNullBranch}
        defaultBranchId={defaultBranchId}
        onSwitchToBatch={() => {
          setOpen(false);
          setBatchOpen(true);
        }}
      />
    </>
  );
}
