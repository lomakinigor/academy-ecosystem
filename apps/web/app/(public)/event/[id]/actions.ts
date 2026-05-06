"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/helpers";
import { getServerCaller } from "@/lib/trpc/server";

export async function bookEventAction(formData: FormData): Promise<void> {
  const eventId = formData.get("event_id");
  if (typeof eventId !== "string" || eventId.length === 0) {
    redirect("/");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/event/${eventId}`)}`);
  }

  const caller = await getServerCaller();
  await caller.booking.create({ event_id: eventId });

  revalidatePath(`/event/${eventId}`);
  redirect(`/event/${eventId}?booked=1`);
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const eventId = formData.get("event_id");
  if (typeof eventId !== "string" || eventId.length === 0) {
    redirect("/");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/event/${eventId}`)}`);
  }

  const caller = await getServerCaller();
  await caller.booking.cancel({ event_id: eventId });

  revalidatePath(`/event/${eventId}`);
  redirect(`/event/${eventId}?cancelled=1`);
}
