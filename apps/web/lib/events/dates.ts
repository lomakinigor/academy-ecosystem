/** Date-only events use UTC calendar boundaries; end_at is exclusive. */
export const dateOnlyStart = (date: string) => new Date(`${date.slice(0, 10)}T00:00:00Z`);
export const dateOnlyEnd = (date: string) => {
  const end = dateOnlyStart(date);
  end.setUTCDate(end.getUTCDate() + 1);
  return end;
};
export const lastEventDate = (end: Date) => new Date(end.getTime() - 1).toISOString().slice(0, 10);
export const dateOnlyLabel = (start: Date, end: Date) => {
  const format = (date: Date) =>
    date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  const last = new Date(end.getTime() - 1);
  return `${format(start)}${start.toISOString().slice(0, 10) === last.toISOString().slice(0, 10) ? "" : ` — ${format(last)}`}`;
};
