export const academyDay = (date = new Date()) =>
  date.toLocaleDateString("en-CA", { timeZone: "Asia/Yekaterinburg" });
export const shiftDay = (day: string, offset: number) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
export const dayLabel = (day: string) =>
  new Date(`${day}T00:00Z`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
export const rollingRange = (start: string) => {
  const date = new Date(`${start}T00:00Z`);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0));
  target.setUTCDate(Math.min(date.getUTCDate(), target.getUTCDate()));
  const end = target.toISOString().slice(0, 10);
  const days: string[] = [];
  for (let day = start; day <= end; day = shiftDay(day, 1)) days.push(day);
  return {
    start,
    end,
    days,
    from: new Date(`${start}T00:00:00+05:00`),
    to: new Date(`${end}T23:59:59.999+05:00`),
  };
};
export const parseAdminStart = (raw: string | string[] | undefined) => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(new Date(`${value}T00:00Z`).getTime()) &&
    new Date(`${value}T00:00Z`).toISOString().slice(0, 10) === value
    ? value
    : academyDay();
};
