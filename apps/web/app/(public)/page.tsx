import { getServerCaller } from "@/lib/trpc/server";

import { AgendaList } from "../admin/calendar/agenda-list";
import { CalendarSidebar } from "../admin/calendar/calendar-sidebar";
import type { EventCardData } from "../admin/calendar/event-card";
import { parseCalendarFilters, type EventTypeValue } from "../admin/calendar/filters";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function PublicCalendarPage({ searchParams }: PageProps) {
  const filters = parseCalendarFilters(searchParams);
  const caller = await getServerCaller();

  const [eventsResult, branches] = await Promise.all([
    caller.event.publicList({
      from: filters.from,
      to: filters.to,
      branch_id: filters.branch_id ?? undefined,
      types: filters.types.length > 0 ? filters.types : undefined,
      search: filters.search,
      is_online: filters.is_online,
    }),
    caller.branch.list(),
  ]);

  const events: EventCardData[] = eventsResult.events
    .filter((ev) => {
      if (!filters.speaker) return true;
      return ev.speaker.name.toLowerCase().includes(filters.speaker.toLowerCase());
    })
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
      speaker: ev.speaker,
      bookings_count: ev._count.bookings,
    }));

  const branchOptions = branches.map((b) => ({ id: b.id, name: b.name, city: b.city }));

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-wide text-brand-primary sm:text-4xl">
          РАСПИСАНИЕ АКАДЕМИИ
        </h1>
        <p className="mt-1 text-sm text-foreground/70">
          Публичный календарь событий — семинары, практики, ритриты и курсы. Чтобы записаться,
          откройте мероприятие и нажмите «Записаться».
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
        <CalendarSidebar branches={branchOptions} total={events.length} />

        <div>
          <AgendaList events={events} hrefBuilder={(ev) => `/event/${ev.id}`} />
        </div>
      </div>
    </div>
  );
}
