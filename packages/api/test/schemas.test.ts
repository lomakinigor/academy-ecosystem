import { describe, it, expect } from "vitest";
import {
  userBaseSchema,
  systemRoleSchema,
  academicLevelSchema,
} from "../src/schemas/user";
import {
  eventCreateSchema,
  eventTypeSchema,
  eventStatusSchema,
} from "../src/schemas/event";
import {
  cuidSchema,
  paginationSchema,
  branchIdSchema,
} from "../src/schemas/common";

describe("userBaseSchema", () => {
  it("принимает валидный профиль и применяет дефолты", () => {
    const r = userBaseSchema.parse({ email: "u@a.ru", name: "Тест" });
    expect(r.system_role).toBe("STUDENT");
    expect(r.academic_level).toBe("LISTENER");
    expect(r.is_speaker).toBe(false);
  });

  it("отклоняет невалидный email", () => {
    expect(() =>
      userBaseSchema.parse({ email: "broken", name: "x" }),
    ).toThrow();
  });

  it("отклоняет некорректный телефон", () => {
    expect(() =>
      userBaseSchema.parse({ email: "a@a.ru", name: "x", phone: "ab" }),
    ).toThrow();
  });

  it("принимает корректный российский телефон", () => {
    const r = userBaseSchema.parse({
      email: "a@a.ru",
      name: "x",
      phone: "+7 (999) 123-45-67",
    });
    expect(r.phone).toBe("+7 (999) 123-45-67");
  });

  it("требует непустое имя", () => {
    expect(() => userBaseSchema.parse({ email: "a@a.ru", name: "" })).toThrow();
  });
});

describe("enum schemas (двойная иерархия)", () => {
  it("systemRoleSchema принимает все 5 административных ролей", () => {
    for (const r of [
      "PRESIDENT",
      "VICE_PRESIDENT",
      "BRANCH_DIRECTOR",
      "BRANCH_ADMIN",
      "STUDENT",
    ]) {
      expect(systemRoleSchema.parse(r)).toBe(r);
    }
  });

  it("academicLevelSchema принимает все 4 академических уровня", () => {
    for (const lvl of ["FOUNDER", "MAGISTER", "MASTER", "LISTENER"]) {
      expect(academicLevelSchema.parse(lvl)).toBe(lvl);
    }
  });

  it("отклоняет неизвестную роль", () => {
    expect(() => systemRoleSchema.parse("ADMIN")).toThrow();
  });

  it("отклоняет неизвестный академический уровень", () => {
    expect(() => academicLevelSchema.parse("GURU")).toThrow();
  });
});

describe("eventCreateSchema", () => {
  const base = {
    title: "Тестовое мероприятие",
    type: "SEMINAR" as const,
    speaker_id: "u_speaker",
    branch_id: "branch_msk",
    start_at: "2026-06-01T10:00:00Z",
    end_at: "2026-06-01T13:00:00Z",
  };

  it("создаёт корректное событие с дефолтами", () => {
    const r = eventCreateSchema.parse(base);
    expect(r.status).toBe("DRAFT");
    expect(r.is_grading).toBe(false);
    expect(r.start_at).toBeInstanceOf(Date);
    expect(r.end_at).toBeInstanceOf(Date);
  });

  it("отклоняет end_at <= start_at", () => {
    expect(() =>
      eventCreateSchema.parse({ ...base, end_at: base.start_at }),
    ).toThrow(/end_at/);
  });

  it("требует title не короче 3 символов", () => {
    expect(() =>
      eventCreateSchema.parse({ ...base, title: "ab" }),
    ).toThrow();
  });

  it("отклоняет отрицательную цену", () => {
    expect(() =>
      eventCreateSchema.parse({ ...base, price: -100 }),
    ).toThrow();
  });

  it("eventTypeSchema принимает все 6 типов", () => {
    for (const t of [
      "SEMINAR",
      "PRACTICE",
      "MASTERCLASS",
      "TRIP",
      "GRADING",
      "ONLINE",
    ]) {
      expect(eventTypeSchema.parse(t)).toBe(t);
    }
  });

  it("eventStatusSchema принимает все 5 статусов", () => {
    for (const s of [
      "DRAFT",
      "PLANNED",
      "ACTIVE",
      "COMPLETED",
      "CANCELLED",
    ]) {
      expect(eventStatusSchema.parse(s)).toBe(s);
    }
  });
});

describe("common schemas", () => {
  it("paginationSchema применяет дефолтный limit=20", () => {
    const r = paginationSchema.parse({});
    expect(r.limit).toBe(20);
  });

  it("paginationSchema ограничивает limit сверху (max 100)", () => {
    expect(() => paginationSchema.parse({ limit: 1000 })).toThrow();
  });

  it("paginationSchema запрещает limit < 1", () => {
    expect(() => paginationSchema.parse({ limit: 0 })).toThrow();
  });

  it("branchIdSchema требует branch_id", () => {
    expect(() => branchIdSchema.parse({})).toThrow();
  });

  it("cuidSchema принимает строковый идентификатор", () => {
    expect(cuidSchema.parse("branch_moscow")).toBe("branch_moscow");
  });

  it("cuidSchema отклоняет пустую строку", () => {
    expect(() => cuidSchema.parse("")).toThrow();
  });
});
