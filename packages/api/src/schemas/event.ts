import { z } from "zod";
import { cuidSchema } from "./common";

export const eventTypeSchema = z.enum([
  "SEMINAR",
  "PRACTICE",
  "MASTERCLASS",
  "TRIP",
  "GRADING",
  "ONLINE",
]);

export const eventStatusSchema = z.enum([
  "DRAFT",
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const eventCreateSchema = z
  .object({
    title: z.string().min(3, "Минимум 3 символа").max(200),
    description: z.string().max(5000).optional(),
    type: eventTypeSchema,
    status: eventStatusSchema.default("DRAFT"),
    start_at: z.coerce.date(),
    end_at: z.coerce.date(),
    speaker_id: cuidSchema,
    branch_id: cuidSchema,
    max_participants: z.number().int().positive().optional(),
    price: z.number().nonnegative().optional(),
    is_grading: z.boolean().default(false),
    program_id: cuidSchema.optional(),
  })
  .refine((d) => d.end_at > d.start_at, {
    message: "end_at должен быть позже start_at",
    path: ["end_at"],
  });

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
