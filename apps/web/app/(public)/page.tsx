import { getServerCaller } from "@/lib/trpc/server";

import { AgendaList } from "../admin/calendar/agenda-list";
import { CalendarSidebar } from "../admin/calendar/calendar-sidebar";
import type { EventCardData } from "../admin/calendar/event-card";
import { parseCalendarFilters, type EventTypeValue } from "../admin/calendar/filters";
import { settlePublicCalendar } from "./settle-public-calendar";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function PublicCalendarPage({ searchParams }: PageProps) {
  const filters = parseCalendarFilters(searchParams);
  const { events, unavailable } = await settlePublicCalendar(
    async () => {
      const caller = await getServerCaller();
      const eventsResult = await caller.event.publicList({
        from: filters.from,
        to: filters.to,
        types: filters.types.length > 0 ? filters.types : undefined,
        search: filters.search,
        is_online: filters.is_online,
      });

      const loadedEvents: EventCardData[] = eventsResult.events
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
      return [loadedEvents, [] as Array<{ id: string; name: string; city: string }>] as const;
    },
    [] as EventCardData[],
    [] as Array<{ id: string; name: string; city: string }>,
  );

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

      {unavailable && (
        <div
          className="mb-6 rounded-xl border border-brand-accent/40 bg-brand-accent/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          Календарь временно недоступен. Страница приложения работает; данные появятся после
          восстановления подключения к базе.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
        <CalendarSidebar total={events.length} />

        <div>
          <AgendaList
            events={events}
            from={filters.from}
            to={filters.to}
            hrefBuilder={(ev) => `/event/${ev.id}`}
          />
        </div>
      </div>
    </div>
  );
}
