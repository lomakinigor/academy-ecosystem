import { z } from "zod";

export const systemRoleSchema = z.enum([
  "PRESIDENT",
  "VICE_PRESIDENT",
  "BRANCH_DIRECTOR",
  "BRANCH_ADMIN",
  "STUDENT",
]);

export const academicLevelSchema = z.enum([
  "FOUNDER",
  "MAGISTER",
  "MASTER",
  "LISTENER",
]);

export const userBaseSchema = z.object({
  email: z.string().email("Невалидный email"),
  name: z.string().min(1, "Имя обязательно").max(200),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Невалидный телефон")
    .optional(),
  system_role: systemRoleSchema.default("STUDENT"),
  academic_level: academicLevelSchema.default("LISTENER"),
  is_speaker: z.boolean().default(false),
  branch_id: z.string().optional(),
});

export type UserBaseInput = z.infer<typeof userBaseSchema>;
