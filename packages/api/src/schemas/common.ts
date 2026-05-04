import { z } from "zod";

export const cuidSchema = z
  .string()
  .min(1, "ID обязателен")
  .regex(/^c[a-z0-9]{24}$|^[a-z0-9_-]+$/i, "Невалидный ID");

export const paginationSchema = z.object({
  cursor: cuidSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const branchIdSchema = z.object({
  branch_id: cuidSchema,
});
