import { z } from "zod";
import { cuidSchema } from "./common";

export const bookingCreateSchema = z.object({
  event_id: cuidSchema,
});
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const bookingCancelSchema = z.object({
  event_id: cuidSchema,
});
export type BookingCancelInput = z.infer<typeof bookingCancelSchema>;

export const bookingByEventSchema = z.object({
  event_id: cuidSchema,
});
