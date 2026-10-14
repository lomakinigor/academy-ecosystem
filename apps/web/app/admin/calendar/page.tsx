import { requireRole } from "@/lib/auth/helpers";
import { SystemRole } from "@/lib/auth/types";
import { getServerCaller } from "@/lib/trpc/server";

import { CalendarContent } from "./calendar-content";
import type { EventCardData } from "./event-card";
import type { EventTypeValue } from "./filters";
import { parseAdminStart, rollingRange } from "@/lib/events/rolling-range";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  await requireRole(SystemRole.BRANCH_ADMIN);
  const range = rollingRange(parseAdminStart(searchParams.from));
  const caller = await getServerCaller();

  const eventsResult = await caller.event.list({
    from: range.from,
    to: range.to,
  });

  const events: EventCardData[] = eventsResult.events
    .filter((ev) => ev.speaker != null)
    .map((ev) => ({
      id: ev.id,
      title: ev.title,
      calendar_title: ev.calendar_title,
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
      confirmed_count: ev.confirmed_count,
      waitlist_count: ev.waitlist_count,
      updated_at: ev.updatedAt,
      created_at: ev.createdAt,
    }));

  // Все кто прошли requireRole(BRANCH_ADMIN) могут создавать события
  const canAuthor = true;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-wide text-brand-primary sm:text-4xl">
          УПРАВЛЕНИЕ МЕРОПРИЯТИЯМИ
        </h1>
        <p className="mt-1 text-sm text-foreground/70">
          Создание, редактирование и контроль мероприятий Академии.
        </p>
      </header>

      <div>
        <div>
          <CalendarContent events={events} canAuthor={canAuthor} initialDate={range.from} />
        </div>
      </div>
    </div>
  );
}
