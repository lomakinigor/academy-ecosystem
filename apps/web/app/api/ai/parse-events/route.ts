import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/helpers";

const requestSchema = z.object({
  text: z.string().min(1).max(10000),
  speakers: z.array(z.object({ id: z.string(), name: z.string() })),
  branches: z.array(z.object({ id: z.string(), city: z.string() })),
});

export type ParsedEvent = {
  title: string;
  description: string | null;
  type: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  speaker_name: string | null;
  speaker_id: string | null;
  branch_city: string | null;
  branch_id: string | null;
  pricing_type: "FIXED" | "DONATION" | "FREE";
  price: number | null;
  pricing_note: string | null;
  max_participants: number | null;
  is_online: boolean;
  tags: string[];
};

const EVENT_TYPES = [
  "SEMINAR",
  "PRACTICE",
  "WEBINAR",
  "COURSE",
  "RETREAT",
  "TRIP",
  "MASTERCLASS",
  "GRADING",
];

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function matchSpeaker(
  name: string | null,
  speakers: { id: string; name: string }[],
): string | null {
  if (!name) return null;
  const n = normalize(name);
  const exact = speakers.find((s) => normalize(s.name) === n);
  if (exact) return exact.id;
  const partial = speakers.find(
    (s) => normalize(s.name).includes(n) || n.includes(normalize(s.name)),
  );
  return partial?.id ?? null;
}

function matchBranch(city: string | null, branches: { id: string; city: string }[]): string | null {
  if (!city) return null;
  const c = normalize(city);
  const exact = branches.find((b) => normalize(b.city) === c);
  if (exact) return exact.id;
  const partial = branches.find(
    (b) => normalize(b.city).includes(c) || c.includes(normalize(b.city)),
  );
  return partial?.id ?? null;
}

const eventToolSchema = {
  type: "function" as const,
  function: {
    name: "create_events",
    description: "Создать массив событий из свободного текста",
    parameters: {
      type: "object",
      required: ["events"],
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            required: ["title", "type", "date", "start_time", "end_time"],
            properties: {
              title: { type: "string", description: "Название события" },
              description: { type: "string", description: "Описание события или null" },
              type: { type: "string", enum: EVENT_TYPES, description: "Тип события" },
              date: { type: "string", description: "Дата в формате YYYY-MM-DD" },
              start_time: { type: "string", description: "Время начала HH:MM" },
              end_time: { type: "string", description: "Время окончания HH:MM" },
              speaker_name: {
                type: "string",
                description: "Имя спикера точно как в тексте, или null",
              },
              branch_city: { type: "string", description: "Город проведения, или null" },
              pricing_type: {
                type: "string",
                enum: ["FIXED", "DONATION", "FREE"],
                description: "Тип оплаты: FIXED=конкретная цена, DONATION=донат, FREE=бесплатно",
              },
              price: { type: "number", description: "Цена в рублях, только для FIXED. null иначе" },
              pricing_note: { type: "string", description: "Заметка о цене или null" },
              max_participants: {
                type: "number",
                description: "Максимальное число участников или null",
              },
              is_online: { type: "boolean", description: "Онлайн-формат" },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Теги события",
              },
            },
          },
        },
      },
    },
  },
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { text, speakers, branches } = parsed.data;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY не настроен" }, { status: 503 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `Ты помощник для ввода событий в систему управления академией.
Сегодняшняя дата: ${today}.
Список спикеров: ${speakers.map((s) => s.name).join(", ") || "не задан"}.
Список городов/филиалов: ${branches.map((b) => b.city).join(", ") || "не задан"}.
Тип события — одно из: ${EVENT_TYPES.join(", ")}.
Для определения типа: семинар→SEMINAR, практика→PRACTICE, вебинар→WEBINAR, курс→COURSE, ретрит/ритрит→RETREAT, путешествие/поездка→TRIP, мастер-класс→MASTERCLASS.
Если год не указан — используй текущий год. Если время не указано — ставь 10:00–13:00.
Если несколько событий в тексте — вернуть массив. Разделители событий: пустая строка, нумерация, маркеры "-".`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://academy-ecosystem.vercel.app",
      "X-Title": "Academy Ecosystem",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3-0324",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      tools: [eventToolSchema],
      tool_choice: { type: "function", function: { name: "create_events" } },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 502 });
  }

  const completion = (await response.json()) as {
    choices: Array<{
      message: {
        tool_calls?: Array<{
          function: { name: string; arguments: string };
        }>;
      };
    }>;
  };

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    return NextResponse.json({ error: "AI не вернул структурированные данные" }, { status: 422 });
  }

  let raw: unknown[] = [];
  try {
    const parsed = JSON.parse(toolCall.function.arguments) as { events: unknown[] };
    raw = parsed.events ?? [];
  } catch {
    return NextResponse.json({ error: "Ошибка разбора ответа AI" }, { status: 422 });
  }

  const result: ParsedEvent[] = raw.map((ev: unknown) => {
    const e = ev as Record<string, unknown>;
    const speakerName = (e.speaker_name as string | null) ?? null;
    const branchCity = (e.branch_city as string | null) ?? null;
    return {
      title: String(e.title ?? ""),
      description: (e.description as string | null) ?? null,
      type: String(e.type ?? "SEMINAR"),
      date: String(e.date ?? today),
      start_time: String(e.start_time ?? "10:00"),
      end_time: String(e.end_time ?? "13:00"),
      speaker_name: speakerName,
      speaker_id: matchSpeaker(speakerName, speakers),
      branch_city: branchCity,
      branch_id: matchBranch(branchCity, branches),
      pricing_type: (e.pricing_type as "FIXED" | "DONATION" | "FREE") ?? "FIXED",
      price: (e.price as number | null) ?? null,
      pricing_note: (e.pricing_note as string | null) ?? null,
      max_participants: (e.max_participants as number | null) ?? null,
      is_online: Boolean(e.is_online ?? false),
      tags: Array.isArray(e.tags) ? (e.tags as string[]) : [],
    };
  });

  return NextResponse.json({ events: result });
}
