import { requireRole } from "@/lib/auth/helpers";
import { SystemRole } from "@/lib/auth/types";
import { getServerCaller } from "@/lib/trpc/server";

import { AgendaList } from "../admin/calendar/agenda-list";
import type { EventCardData } from "../admin/calendar/event-card";
import type { EventTypeValue } from "../admin/calendar/filters";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const user = await requireRole(SystemRole.STUDENT);
  const caller = await getServerCaller();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { events: rawEvents } = await caller.event.list({
    from: now,
    to,
  });

  const events: EventCardData[] = rawEvents
    .filter((ev) => ev.speaker != null)
    .map((ev) => ({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      type: ev.type as EventTypeValue,
      status: ev.status,
      start_at: ev.start_at,
      end_at: ev.end_at,
      is_online: ev.is_online,
      pricing_type: ev.pricing_type,
      price: ev.price ? Number(ev.price) : null,
      pricing_note: ev.pricing_note,
      tags: ev.tags,
      max_participants: ev.max_participants,
      branch: ev.branch,
      speaker: ev.speaker!,
      bookings_count: ev._count.bookings,
    }));

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-sm text-foreground/60">Здравствуйте,</p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-wide text-brand-primary sm:text-4xl">
          {user.name}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-foreground/70">
          Это ваш личный кабинет. Ниже — события академии на ближайшие 30 дней. Запись на
          мероприятия и личный прогресс появятся в следующих итерациях.
        </p>
      </header>

      <h2 className="mb-3 font-heading text-xl font-semibold text-brand-primary">
        Ближайшие события
      </h2>

      <AgendaList events={events} />
    </div>
  );
}
