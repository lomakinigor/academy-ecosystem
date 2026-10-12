import { z } from "zod";

export const contactChannelSchema = z.enum(["EMAIL", "TELEGRAM", "WHATSAPP", "MAX"]);

export const clientContactSchema = z.object({
  channel: contactChannelSchema,
  value: z.string().trim().min(2, "Укажите контакт").max(254),
});

export const clientCreateSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя клиента").max(200),
  contacts: z.array(clientContactSchema).min(1, "Добавьте хотя бы один контакт").max(4),
});
