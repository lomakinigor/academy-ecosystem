import { describe, it, expect } from "vitest";

import {
  parseCalendarFilters,
  serializeCalendarFilters,
  isFiltersEmpty,
  periodRange,
} from "@/app/admin/calendar/filters";

const NOW = new Date("2026-05-05T12:00:00Z");

describe("parseCalendarFilters", () => {
  it("по умолчанию — month, текущий день +30, types=[]", () => {
    const f = parseCalendarFilters({}, NOW);
    expect(f.period).toBe("month");
    expect(f.types).toEqual([]);
    expect(f.branch_id).toBeUndefined();
    expect(f.from.getTime()).toBeLessThan(f.to.getTime());
    const days = (f.to.getTime() - f.from.getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(days)).toBeGreaterThanOrEqual(29);
  });

  it("принимает period=quarter и расширяет диапазон", () => {
    const f = parseCalendarFilters({ period: "quarter" }, NOW);
    expect(f.period).toBe("quarter");
    const days = (f.to.getTime() - f.from.getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(days)).toBeGreaterThanOrEqual(89);
  });

  it("парсит types через запятую и фильтрует невалидные", () => {
    const f = parseCalendarFilters({ types: "SEMINAR,WEBINAR,UNKNOWN" }, NOW);
    expect(f.types).toEqual(["SEMINAR", "WEBINAR"]);
  });

  it("branch_id=all считается «все филиалы»", () => {
    const f = parseCalendarFilters({ branch_id: "all" }, NOW);
    expect(f.branch_id).toBeUndefined();
  });

  it("trim'ит и игнорирует пустые search/speaker", () => {
    const f = parseCalendarFilters({ search: "  ", speaker: "Светлов" }, NOW);
    expect(f.search).toBeUndefined();
    expect(f.speaker).toBe("Светлов");
  });

  it("парсит is_online=true/false", () => {
    expect(parseCalendarFilters({ is_online: "true" }, NOW).is_online).toBe(true);
    expect(parseCalendarFilters({ is_online: "false" }, NOW).is_online).toBe(false);
    expect(parseCalendarFilters({ is_online: "garbage" }, NOW).is_online).toBeUndefined();
  });

  it("custom period с from/to использует переданные даты", () => {
    const f = parseCalendarFilters({ period: "custom", from: "2026-06-01", to: "2026-06-15" }, NOW);
    expect(f.period).toBe("custom");
    expect(f.from.toISOString().slice(0, 10)).toBe("2026-06-01");
  });
});

describe("serializeCalendarFilters", () => {
  it("опускает дефолты (period=month без branch/types)", () => {
    const sp = serializeCalendarFilters({ period: "month", types: [] });
    expect(sp.toString()).toBe("");
  });

  it("сериализует только заполненные поля", () => {
    const sp = serializeCalendarFilters({
      period: "quarter",
      branch_id: "branch_msk",
      types: ["SEMINAR", "WEBINAR"],
      search: "храм",
      is_online: true,
    });
    expect(sp.get("period")).toBe("quarter");
    expect(sp.get("branch_id")).toBe("branch_msk");
    expect(sp.get("types")).toBe("SEMINAR,WEBINAR");
    expect(sp.get("search")).toBe("храм");
    expect(sp.get("is_online")).toBe("true");
  });

  it("custom period записывает from/to в ISO-формате", () => {
    const sp = serializeCalendarFilters({
      period: "custom",
      from: new Date("2026-06-01T00:00:00Z"),
      to: new Date("2026-06-15T23:59:59Z"),
    });
    expect(sp.get("from")).toBe("2026-06-01");
    expect(sp.get("to")).toBe("2026-06-15");
  });
});

describe("periodRange", () => {
  it("month → +30 дней от today", () => {
    const { from, to } = periodRange("month", NOW);
    const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(days)).toBeGreaterThanOrEqual(29);
  });
});

describe("isFiltersEmpty", () => {
  it("дефолтные фильтры считаются пустыми", () => {
    const f = parseCalendarFilters({}, NOW);
    expect(isFiltersEmpty(f)).toBe(true);
  });

  it("любой непустой фильтр делает их непустыми", () => {
    const f = parseCalendarFilters({ types: "SEMINAR" }, NOW);
    expect(isFiltersEmpty(f)).toBe(false);
  });
});
