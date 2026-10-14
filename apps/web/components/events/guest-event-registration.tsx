import Link from "next/link";

import { Button } from "@academy/ui";

export function GuestEventRegistration({ eventId }: { eventId: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <Button asChild variant="accent" size="lg">
        <Link href={`/signup?callbackUrl=${encodeURIComponent(`/event/${eventId}`)}`}>
          Зарегистрироваться на мероприятие
        </Link>
      </Button>
    </div>
  );
}
