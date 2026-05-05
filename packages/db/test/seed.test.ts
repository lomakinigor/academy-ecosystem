import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const seed = readFileSync(resolve(here, "../prisma/seed.ts"), "utf-8");

describe("Seed — филиалы", () => {
  it("создаёт филиал Москва", () => {
    expect(seed).toMatch(/Москва/);
    expect(seed).toMatch(/branch_moscow/);
  });

  it("создаёт филиал Екатеринбург", () => {
    expect(seed).toMatch(/Екатеринбург/);
    expect(seed).toMatch(/branch_yekaterinburg/);
  });

  it("создаёт филиал Челябинск", () => {
    expect(seed).toMatch(/Челябинск/);
    expect(seed).toMatch(/branch_chelyabinsk/);
  });

  it("филиалы имеют timezone и контактные данные", () => {
    expect(seed).toMatch(/Europe\/Moscow/);
    expect(seed).toMatch(/Asia\/Yekaterinburg/);
    expect(seed).toMatch(/contact_phones:/);
    expect(seed).toMatch(/entrance_code:/);
  });
});

describe("Seed — покрытие двойной иерархии", () => {
  it("содержит пользователя на каждый AcademicLevel", () => {
    expect(seed).toMatch(/AcademicLevel\.FOUNDER/);
    expect(seed).toMatch(/AcademicLevel\.MAGISTER/);
    expect(seed).toMatch(/AcademicLevel\.MASTER/);
    expect(seed).toMatch(/AcademicLevel\.LISTENER/);
  });

  it("содержит пользователя на каждый SystemRole", () => {
    expect(seed).toMatch(/SystemRole\.PRESIDENT/);
    expect(seed).toMatch(/SystemRole\.VICE_PRESIDENT/);
    expect(seed).toMatch(/SystemRole\.BRANCH_DIRECTOR/);
    expect(seed).toMatch(/SystemRole\.BRANCH_ADMIN/);
    expect(seed).toMatch(/SystemRole\.STUDENT/);
  });
});

describe("Seed — мероприятия всех типов", () => {
  const types = [
    "EventType.SEMINAR",
    "EventType.PRACTICE",
    "EventType.WEBINAR",
    "EventType.COURSE",
    "EventType.RETREAT",
    "EventType.TRIP",
    "EventType.MASTERCLASS",
    "EventType.GRADING",
  ];
  it.each(types)("использует %s", (t) => {
    expect(seed).toContain(t);
  });
});

describe("Seed — pricing и метаданные событий", () => {
  it("использует все три типа ценообразования", () => {
    expect(seed).toMatch(/PricingType\.FIXED/);
    expect(seed).toMatch(/PricingType\.DONATION/);
    expect(seed).toMatch(/PricingType\.FREE/);
  });

  it("содержит онлайн-событие", () => {
    expect(seed).toMatch(/is_online:\s*true/);
  });

  it("содержит общеакадемическое событие (branch_id=null)", () => {
    expect(seed).toMatch(/branch_id:\s*null/);
  });

  it("содержит многодневный семинар через program_id", () => {
    expect(seed).toMatch(/program_id:\s*"seminar_temple_3"/);
  });

  it("содержит теги расширяемых лейблов", () => {
    expect(seed).toMatch(/"с детьми"/);
    expect(seed).toMatch(/"допуск после знакомства"/);
  });
});

describe("Seed — идемпотентность", () => {
  it("филиалы создаются через upsert", () => {
    expect(seed).toMatch(/prisma\.branch\.upsert/);
  });

  it("пользователи создаются через upsert", () => {
    expect(seed).toMatch(/prisma\.user\.upsert/);
  });

  it("события пересоздаются: deleteMany + create", () => {
    // Прямое upsert не подходит из-за breaking-изменений в схеме (новые required-поля).
    // Идемпотентность достигается через чистку и переcоздание.
    expect(seed).toMatch(/prisma\.event\.deleteMany/);
    expect(seed).toMatch(/prisma\.event\.create/);
  });

  it("speaker profiles создаются через upsert", () => {
    expect(seed).toMatch(/prisma\.speakerProfile\.upsert/);
  });

  it("executor balances создаются через upsert", () => {
    expect(seed).toMatch(/prisma\.executorBalance\.upsert/);
  });
});
