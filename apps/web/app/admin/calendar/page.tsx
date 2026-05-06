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

const GLOBAL_ROLES = new Set<string>([SystemRole.PRESIDENT, SystemRole.VICE_PRESIDENT]);

export default async function CalendarPage({ searchParams }: PageProps) {
  const user = await requireRole(SystemRole.BRANCH_ADMIN);
  const filters = parseCalendarFilters(searchParams);
  const caller = await getServerCaller();

  const [eventsResult, branches] = await Promise.all([
    caller.event.list({
      from: filters.from,
      to: filters.to,
      branch_id: filters.branch_id ?? undefined,
      types: filters.types.length > 0 ? filters.types : undefined,
      search: filters.search,
      speaker_id: undefined,
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

  const isGlobal = GLOBAL_ROLES.has(user.system_role);

  // Кто может создавать/редактировать события:
  // - global (PRES/VP) — везде
  // - BRANCH_ADMIN+ — в своём филиале
  // - Магистры/Мастера — в своём филиале
  // - Listener — нельзя (фильтруется по academic_level)
  const canAuthor =
    isGlobal ||
    user.system_role === SystemRole.BRANCH_DIRECTOR ||
    user.system_role === SystemRole.BRANCH_ADMIN ||
    user.academic_level === "MAGISTER" ||
    user.academic_level === "MASTER" ||
    user.academic_level === "FOUNDER";

  const branchOptions = branches.map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city,
  }));

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-wide text-brand-primary sm:text-4xl">
          РАСПИСАНИЕ
        </h1>
        <p className="mt-1 text-sm text-foreground/70">
          Все события академии — фильтруйте по периоду, направлениям и филиалам.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
        <CalendarSidebar branches={branchOptions} total={events.length} />

        <div>
          <CalendarContent
            events={events}
            branches={branchOptions}
            canAuthor={canAuthor}
            canEditNullBranch={isGlobal}
            defaultBranchId={user.branch_id}
          />
        </div>
      </div>
    </div>
  );
}
