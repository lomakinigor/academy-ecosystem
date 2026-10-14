"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";

import { Button } from "@academy/ui";

import type { EventCardData } from "./event-card";
import { EventBatchModal } from "./event-batch-modal";
import { EventFormModal, type EventFormInitial } from "./event-form-modal";
import { AdminEventCalendar } from "./admin-event-calendar";
import { academyDay } from "@/lib/events/rolling-range";

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
  is_all_day: e.is_all_day,
  venue: e.venue,
  is_hybrid: e.is_hybrid,
  branch_id: e.branch?.id ?? null,
  speaker_id: e.speaker.id,
  is_online: e.is_online,
  pricing_type: e.pricing_type,
  price: e.price,
  pricing_note: e.pricing_note,
  tags: e.tags,
  max_participants: e.max_participants,
  created_at: e.created_at,
  updated_at: e.updated_at,
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
  const [open, setOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [initial, setInitial] = useState<EventFormInitial | undefined>();
  const [startDay, setStartDay] = useState(() => academyDay(initialDate));
  const [createDate, setCreateDate] = useState<string>();

  useEffect(() => {
    setStartDay(academyDay(initialDate));
  }, [initialDate]);

  const changeStart = (day: string) => {
    setStartDay(day);
    router.replace(`${pathname}?from=${day}`, { scroll: false });
  };

  const openCreate = (day?: string) => {
    setCreateDate(day ?? startDay);
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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => setBatchOpen(true)}
          >
            <Sparkles />
            Пакетный ввод
          </Button>
          <Button type="button" variant="accent" className="min-h-11" onClick={() => openCreate()}>
            <Plus />
            Создать вручную
          </Button>
        </div>
      )}

      <AdminEventCalendar
        events={events}
        start={startDay}
        onChange={changeStart}
        onEdit={openEdit}
        onCreate={openCreate}
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
        defaultDate={createDate}
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
