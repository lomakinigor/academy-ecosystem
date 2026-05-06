import { z } from "zod";
import { cuidSchema } from "./common";

export const eventTypeSchema = z.enum([
  "SEMINAR",
  "PRACTICE",
  "WEBINAR",
  "COURSE",
  "RETREAT",
  "TRIP",
  "MASTERCLASS",
  "GRADING",
]);

export const eventStatusSchema = z.enum(["DRAFT", "PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]);

export const pricingTypeSchema = z.enum(["FIXED", "DONATION", "FREE"]);

export const eventCreateSchema = z
  .object({
    title: z.string().min(3, "Минимум 3 символа").max(200),
    description: z.string().max(5000).optional(),
    type: eventTypeSchema,
    status: eventStatusSchema.default("DRAFT"),
    start_at: z.coerce.date(),
    end_at: z.coerce.date(),
    speaker_id: cuidSchema,
    // branch_id может отсутствовать — общеакадемическое событие
    branch_id: cuidSchema.nullable().optional(),
    max_participants: z.number().int().positive().optional(),
    pricing_type: pricingTypeSchema.default("FIXED"),
    price: z.number().nonnegative().optional(),
    pricing_note: z.string().max(500).optional(),
    is_online: z.boolean().default(false),
    tags: z.array(z.string().min(1).max(50)).default([]),
    is_grading: z.boolean().default(false),
    program_id: cuidSchema.optional(),
  })
  .refine((d) => d.end_at > d.start_at, {
    message: "end_at должен быть позже start_at",
    path: ["end_at"],
  });

export type EventCreateInput = z.infer<typeof eventCreateSchema>;

/**
 * Вход для event.list — фильтры календаря.
 * from/to обязательны (страница календаря всегда отрисовывает диапазон).
 */
export const eventListInputSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    branch_id: cuidSchema.nullable().optional(),
    types: z.array(eventTypeSchema).optional(),
    speaker_id: cuidSchema.optional(),
    search: z.string().trim().min(1).max(200).optional(),
    is_online: z.boolean().optional(),
    tags: z.array(z.string().min(1).max(50)).optional(),
  })
  .refine((d) => d.to >= d.from, {
    message: "to должен быть >= from",
    path: ["to"],
  });

export type EventListInput = z.infer<typeof eventListInputSchema>;

/**
 * Вход для event.update — все поля create-схемы опциональны;
 * id обязателен; end_at должен быть позже start_at если оба переданы.
 */
export const eventUpdateSchema = z
  .object({
    id: cuidSchema,
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    type: eventTypeSchema.optional(),
    status: eventStatusSchema.optional(),
    start_at: z.coerce.date().optional(),
    end_at: z.coerce.date().optional(),
    speaker_id: cuidSchema.optional(),
    branch_id: cuidSchema.nullable().optional(),
    max_participants: z.number().int().positive().nullable().optional(),
    pricing_type: pricingTypeSchema.optional(),
    price: z.number().nonnegative().nullable().optional(),
    pricing_note: z.string().max(500).nullable().optional(),
    is_online: z.boolean().optional(),
    tags: z.array(z.string().min(1).max(50)).optional(),
    is_grading: z.boolean().optional(),
    program_id: cuidSchema.nullable().optional(),
  })
  .refine((d) => d.start_at == null || d.end_at == null || d.end_at > d.start_at, {
    message: "end_at должен быть позже start_at",
    path: ["end_at"],
  });

export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

export const eventDeleteSchema = z.object({ id: cuidSchema });
export const eventByIdSchema = z.object({ id: cuidSchema });
