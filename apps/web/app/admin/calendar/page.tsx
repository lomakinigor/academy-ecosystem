import { requireRole } from "@/lib/auth/helpers";
import { SystemRole } from "@/lib/auth/types";
import { getServerCaller } from "@/lib/trpc/server";

import { CalendarContent } from "./calendar-content";
import { CalendarSidebar } from "./calendar-sidebar";
import type { EventCardData } from "./event-card";
import { parseCalendarFilters, type EventTypeValue } from "./filters";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  await requireRole(SystemRole.BRANCH_ADMIN);
  const filters = parseCalendarFilters(searchParams);
  const caller = await getServerCaller();

  const eventsResult = await caller.event.list({
    from: filters.from,
    to: filters.to,
    types: filters.types.length > 0 ? filters.types : undefined,
    search: filters.search,
    speaker_id: undefined,
    is_online: filters.is_online,
  });

  const events: EventCardData[] = eventsResult.events
    .filter((ev) => ev.speaker != null)
    .filter((ev) => {
      if (!filters.speaker) return true;
      return ev.speaker!.name.toLowerCase().includes(filters.speaker.toLowerCase());
    })
    .map((ev) => ({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      type: ev.type as EventTypeValue,
      status: ev.status,
      start_at: ev.start_at,
      end_at: ev.end_at,
      is_all_day: ev.is_all_day,
      venue: ev.venue,
      is_hybrid: ev.is_hybrid,
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

  // Все кто прошли requireRole(BRANCH_ADMIN) могут создавать события
  const canAuthor = true;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-wide text-brand-primary sm:text-4xl">
          РАСПИСАНИЕ
        </h1>
        <p className="mt-1 text-sm text-foreground/70">
          Все события академии — фильтруйте по периоду и направлениям.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
        <CalendarSidebar branches={[]} total={events.length} />

        <div>
          <CalendarContent
            events={events}
            branches={[]}
            canAuthor={canAuthor}
            canEditNullBranch={true}
            defaultBranchId={null}
            initialDate={filters.from}
          />
        </div>
      </div>
    </div>
  );
}
