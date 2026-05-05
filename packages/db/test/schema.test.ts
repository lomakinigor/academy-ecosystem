import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(resolve(here, "../prisma/schema.prisma"), "utf-8");

const block = (model: string): string => {
  const m = schema.match(new RegExp(`model ${model}\\s*\\{([\\s\\S]+?)\\n\\}`));
  if (!m || !m[1]) throw new Error(`model ${model} not found in schema`);
  return m[1];
};

const enumBody = (name: string): string => {
  const m = schema.match(new RegExp(`enum ${name}\\s*\\{([^}]+)\\}`, "m"));
  if (!m || !m[1]) throw new Error(`enum ${name} not found in schema`);
  return m[1];
};

describe("Prisma schema — enums (двойная иерархия)", () => {
  const cases: Array<[string, string[]]> = [
    ["SystemRole", ["PRESIDENT", "VICE_PRESIDENT", "BRANCH_DIRECTOR", "BRANCH_ADMIN", "STUDENT"]],
    ["AcademicLevel", ["FOUNDER", "MAGISTER", "MASTER", "LISTENER"]],
    ["EventStatus", ["DRAFT", "PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]],
    [
      "EventType",
      ["SEMINAR", "PRACTICE", "WEBINAR", "COURSE", "RETREAT", "TRIP", "MASTERCLASS", "GRADING"],
    ],
    ["PricingType", ["FIXED", "DONATION", "FREE"]],
    ["BookingStatus", ["PENDING", "CONFIRMED", "WAITLIST", "CANCELLED", "ATTENDED"]],
    ["PaymentStatus", ["PENDING", "COMPLETED", "FAILED", "REFUNDED"]],
    ["PaymentType", ["BOOKING", "REFERRAL_BONUS", "EXECUTOR_PAYOUT"]],
  ];

  it.each(cases)("enum %s содержит все ожидаемые значения", (name, values) => {
    const body = enumBody(name);
    for (const v of values) {
      expect(body).toContain(v);
    }
  });
});

describe("Prisma schema — модели", () => {
  const expected = [
    "User",
    "Branch",
    "Event",
    "Booking",
    "Payment",
    "ExecutorBalance",
    "MentorRelation",
    "AcademicRecord",
    "SpeakerProfile",
  ];
  it.each(expected)("содержит модель %s", (name) => {
    expect(schema).toMatch(new RegExp(`model ${name}\\s*\\{`));
  });

  it("User имеет обе иерархии (system_role + academic_level) и флаг is_speaker", () => {
    const body = block("User");
    expect(body).toMatch(/system_role\s+SystemRole/);
    expect(body).toMatch(/academic_level\s+AcademicLevel/);
    expect(body).toMatch(/is_speaker\s+Boolean/);
    expect(body).toMatch(/branch_id\s+String\?/);
    expect(body).toMatch(/referral_code\s+String\?\s+@unique/);
  });

  it("Event имеет связи speaker и branch, индексы по start_at, status, type", () => {
    const body = block("Event");
    expect(body).toMatch(/speaker_id\s+String/);
    // branch_id nullable — событие может быть общеакадемическим
    expect(body).toMatch(/branch_id\s+String\?/);
    expect(body).toMatch(/@@index\(\[start_at\]\)/);
    expect(body).toMatch(/@@index\(\[status\]\)/);
    expect(body).toMatch(/@@index\(\[branch_id\]\)/);
    expect(body).toMatch(/@@index\(\[type\]\)/);
  });

  it("Event содержит pricing-поля и расширяемые лейблы", () => {
    const body = block("Event");
    expect(body).toMatch(/pricing_type\s+PricingType/);
    expect(body).toMatch(/price\s+Decimal\?/);
    expect(body).toMatch(/pricing_note\s+String\?/);
    expect(body).toMatch(/is_online\s+Boolean/);
    expect(body).toMatch(/tags\s+String\[\]/);
  });

  it("Branch содержит контактные данные и timezone", () => {
    const body = block("Branch");
    expect(body).toMatch(/address\s+String\?/);
    expect(body).toMatch(/entrance_code\s+String\?/);
    expect(body).toMatch(/contact_phones\s+String\[\]/);
    expect(body).toMatch(/timezone\s+String\?/);
  });

  it("MentorRelation уникален по паре mentor/student", () => {
    const body = block("MentorRelation");
    expect(body).toMatch(/@@unique\(\[mentor_id,\s*student_id\]\)/);
  });

  it("Booking уникален по паре user/event (защита от двойного бронирования)", () => {
    const body = block("Booking");
    expect(body).toMatch(/@@unique\(\[user_id,\s*event_id\]\)/);
  });

  it("ExecutorBalance уникален по user_id", () => {
    const body = block("ExecutorBalance");
    expect(body).toMatch(/user_id\s+String\s+@unique/);
  });

  it("SpeakerProfile уникален по user_id", () => {
    const body = block("SpeakerProfile");
    expect(body).toMatch(/user_id\s+String\s+@unique/);
  });
});

describe("Prisma schema — обязательные timestamps", () => {
  const models = [
    "User",
    "Branch",
    "Event",
    "Booking",
    "Payment",
    "ExecutorBalance",
    "MentorRelation",
    "AcademicRecord",
    "SpeakerProfile",
  ];

  it.each(models)("%s содержит createdAt + updatedAt", (name) => {
    const body = block(name);
    expect(body).toMatch(/createdAt\s+DateTime\s+@default\(now\(\)\)/);
    expect(body).toMatch(/updatedAt\s+DateTime\s+@updatedAt/);
  });
});

describe("Prisma schema — datasource", () => {
  it("использует PostgreSQL", () => {
    expect(schema).toMatch(/provider\s*=\s*"postgresql"/);
  });

  it("берёт URL из env(DATABASE_URL)", () => {
    expect(schema).toMatch(/url\s*=\s*env\("DATABASE_URL"\)/);
  });
});
