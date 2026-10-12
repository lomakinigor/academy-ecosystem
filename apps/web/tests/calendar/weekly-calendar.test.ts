import { describe, expect, it } from "vitest";

import { getWeekDays, startOfWeekMonday } from "@/app/admin/calendar/weekly-calendar";

describe("weekly calendar dates", () => {
  it("строит неделю с понедельника по воскресенье", () => {
    const start = startOfWeekMonday(new Date("2026-10-14T12:00:00"));
    const days = getWeekDays(start);

    expect(start.getDay()).toBe(1);
    expect(days).toHaveLength(7);
    expect(days[0]?.getDay()).toBe(1);
    expect(days[5]?.getDay()).toBe(6);
    expect(days[6]?.getDay()).toBe(0);
  });
});
