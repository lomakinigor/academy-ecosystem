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

  it("создаёт филиал Челябинск", () => {
    expect(seed).toMatch(/Челябинск/);
    expect(seed).toMatch(/branch_chelyabinsk/);
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

describe("Seed — мероприятия 5 разных типов", () => {
  const types = [
    "EventType.SEMINAR",
    "EventType.PRACTICE",
    "EventType.MASTERCLASS",
    "EventType.TRIP",
    "EventType.GRADING",
  ];
  it.each(types)("использует %s", (t) => {
    expect(seed).toContain(t);
  });
});

describe("Seed — идемпотентность", () => {
  it("филиалы создаются через upsert", () => {
    expect(seed).toMatch(/prisma\.branch\.upsert/);
  });

  it("пользователи создаются через upsert", () => {
    expect(seed).toMatch(/prisma\.user\.upsert/);
  });

  it("события создаются через upsert", () => {
    expect(seed).toMatch(/prisma\.event\.upsert/);
  });

  it("speaker profiles создаются через upsert", () => {
    expect(seed).toMatch(/prisma\.speakerProfile\.upsert/);
  });

  it("executor balances создаются через upsert", () => {
    expect(seed).toMatch(/prisma\.executorBalance\.upsert/);
  });
});
