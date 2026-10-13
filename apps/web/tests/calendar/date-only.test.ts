import { describe, expect, it } from "vitest";
import { dateOnlyStart, dateOnlyEnd, lastEventDate, dateOnlyLabel } from "@/lib/events/dates";

describe("Даты без времени", () => {
  it("хранит 15–17 как UTC date-only диапазон с эксклюзивным 18-м", () => {
    expect(dateOnlyStart("2026-10-15").toISOString()).toBe("2026-10-15T00:00:00.000Z");
    expect(dateOnlyEnd("2026-10-17").toISOString()).toBe("2026-10-18T00:00:00.000Z");
    expect(lastEventDate(dateOnlyEnd("2026-10-17"))).toBe("2026-10-17");
    expect(dateOnlyLabel(dateOnlyStart("2026-10-15"), dateOnlyEnd("2026-10-17"))).toBe(
      "15 октября 2026 г. — 17 октября 2026 г.",
    );
  });
  it("сохраняет один день и переход месяца", () => {
    expect(dateOnlyEnd("2026-12-31").toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(dateOnlyLabel(dateOnlyStart("2026-10-15"), dateOnlyEnd("2026-10-15"))).toBe(
      "15 октября 2026 г.",
    );
  });
});
