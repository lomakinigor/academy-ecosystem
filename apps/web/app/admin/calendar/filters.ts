/**
 * Чистые утилиты разбора и сборки фильтров календаря.
 * URL search params — single source of truth: и сервер, и клиент
 * читают одни и те же значения.
 */

export const EVENT_TYPE_VALUES = [
  "SEMINAR",
  "PRACTICE",
  "WEBINAR",
  "COURSE",
  "RETREAT",
  "TRIP",
  "MASTERCLASS",
  "GRADING",
] as const;
export type EventTypeValue = (typeof EVENT_TYPE_VALUES)[number];

export const EVENT_TYPE_LABELS: Record<EventTypeValue, string> = {
  SEMINAR: "Семинары",
  PRACTICE: "Практики",
  WEBINAR: "Вебинары",
  COURSE: "Курсы",
  RETREAT: "Ритриты",
  TRIP: "Путешествия",
  MASTERCLASS: "Мастер-классы",
  GRADING: "Аттестации",
};

export type PeriodKey = "month" | "quarter" | "year" | "custom";

export interface CalendarFilters {
  from: Date;
  to: Date;
  period: PeriodKey;
  branch_id?: string;
  types: EventTypeValue[];
  search?: string;
  speaker?: string;
  is_online?: boolean;
}

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const endOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
};

const addDays = (d: Date, days: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return c;
};

export const periodRange = (
  period: PeriodKey,
  now: Date = new Date(),
): { from: Date; to: Date } => {
  const today = startOfDay(now);
  switch (period) {
    case "quarter":
      return { from: today, to: endOfDay(addDays(today, 90)) };
    case "year":
      return { from: today, to: endOfDay(addDays(today, 365)) };
    case "month":
    default:
      return { from: today, to: endOfDay(addDays(today, 30)) };
  }
};

const parseDate = (v: string | null | undefined): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isEventType = (s: string): s is EventTypeValue =>
  (EVENT_TYPE_VALUES as readonly string[]).includes(s);

/**
 * Парсит URL searchParams в типизированные фильтры.
 * Если from/to не заданы — берёт текущий месяц.
 */
export const parseCalendarFilters = (
  raw: Record<string, string | string[] | undefined>,
  now: Date = new Date(),
): CalendarFilters => {
  const periodRaw = raw.period;
  const period: PeriodKey =
    periodRaw === "quarter" ||
    periodRaw === "year" ||
    periodRaw === "custom" ||
    periodRaw === "month"
      ? periodRaw
      : "month";

  const fromRaw = Array.isArray(raw.from) ? raw.from[0] : raw.from;
  const toRaw = Array.isArray(raw.to) ? raw.to[0] : raw.to;
  let from = parseDate(fromRaw);
  let to = parseDate(toRaw);

  if (period !== "custom" || !from || !to) {
    const auto = periodRange(period === "custom" ? "month" : period, now);
    from = from ?? auto.from;
    to = to ?? auto.to;
  }

  if (to < from) {
    to = endOfDay(from);
  }

  const typesRaw = raw.types;
  const typesList: string[] = Array.isArray(typesRaw)
    ? typesRaw
    : typesRaw
      ? typesRaw.split(",")
      : [];
  const types = typesList.filter(isEventType);

  const branchRaw = Array.isArray(raw.branch_id) ? raw.branch_id[0] : raw.branch_id;
  const branch_id = branchRaw && branchRaw !== "all" ? branchRaw : undefined;

  const searchRaw = Array.isArray(raw.search) ? raw.search[0] : raw.search;
  const speakerRaw = Array.isArray(raw.speaker) ? raw.speaker[0] : raw.speaker;
  const search = searchRaw?.trim() || undefined;
  const speaker = speakerRaw?.trim() || undefined;

  const onlineRaw = Array.isArray(raw.is_online) ? raw.is_online[0] : raw.is_online;
  const is_online = onlineRaw === "true" ? true : onlineRaw === "false" ? false : undefined;

  return { from, to, period, branch_id, types, search, speaker, is_online };
};

/**
 * Сериализует фильтры обратно в URL params.
 * Параметры со значениями по умолчанию опускаются — URL остаётся коротким.
 */
export const serializeCalendarFilters = (filters: Partial<CalendarFilters>): URLSearchParams => {
  const sp = new URLSearchParams();
  if (filters.period && filters.period !== "month") sp.set("period", filters.period);
  if (filters.period === "custom") {
    if (filters.from) sp.set("from", filters.from.toISOString().slice(0, 10));
    if (filters.to) sp.set("to", filters.to.toISOString().slice(0, 10));
  }
  if (filters.branch_id) sp.set("branch_id", filters.branch_id);
  if (filters.types && filters.types.length > 0) {
    sp.set("types", filters.types.join(","));
  }
  if (filters.search) sp.set("search", filters.search);
  if (filters.speaker) sp.set("speaker", filters.speaker);
  if (filters.is_online === true) sp.set("is_online", "true");
  if (filters.is_online === false) sp.set("is_online", "false");
  return sp;
};

export const isFiltersEmpty = (f: CalendarFilters): boolean =>
  f.period === "month" &&
  !f.branch_id &&
  f.types.length === 0 &&
  !f.search &&
  !f.speaker &&
  f.is_online === undefined;
