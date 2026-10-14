import { describe, expect, it } from "vitest";
import { calendarTitle } from "@/lib/events/short-title";

describe("Краткая подпись календаря", () => {
  it("предлагает смысловые слова без изменения полного имени", () => {
    expect(calendarTitle("СЕМИНАР ПУТЬ ВЕЛЕСА")).toBe("Велес");
    expect(calendarTitle("Йога. Пробуди своё тело!")).toBe("Йога");
    expect(calendarTitle("Занятие Массаж кисточками")).toBe("Массаж");
  });
  it("предпочитает ручную подпись, пустую заменяет автоматической", () => {
    expect(calendarTitle("Семинар Путь Велеса", "Ретрит")).toBe("Ретрит");
    expect(calendarTitle("Курс Дыхание", "  ")).toBe("Дыхание");
    expect(calendarTitle("Семинар")).toBe("Семинар");
  });
});
