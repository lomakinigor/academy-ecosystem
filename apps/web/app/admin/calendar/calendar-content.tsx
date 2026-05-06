"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@academy/ui";

import { AgendaList } from "./agenda-list";
import type { EventCardData } from "./event-card";
import { EventFormModal, type EventFormInitial } from "./event-form-modal";

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
}

const fromCard = (e: EventCardData): EventFormInitial => ({
  id: e.id,
  title: e.title,
  description: e.description,
  type: e.type,
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
}: CalendarContentProps) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<EventFormInitial | undefined>();

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
        <div className="mb-4 flex justify-end">
          <Button type="button" variant="accent" size="sm" onClick={openCreate}>
            <Plus />
            Создать событие
          </Button>
        </div>
      )}

      <AgendaList events={events} onEventClick={canAuthor ? openEdit : undefined} />

      <EventFormModal
        open={open}
        onOpenChange={setOpen}
        branches={branches}
        initial={initial}
        canEditNullBranch={canEditNullBranch}
        defaultBranchId={defaultBranchId}
      />
    </>
  );
}
