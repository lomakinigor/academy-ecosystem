import { describe, expect, it, vi } from "vitest";
import { eventCreateSchema, eventUpdateSchema } from "../src/schemas/event";
import { buildEventListWhere } from "../src/routers/event";
import { appRouter } from "../src/root";
import type { Context } from "../src/context";

const input = {
  title: "Путь Велеса",
  type: "SEMINAR",
  speaker_id: "cm00000000000000000000001",
  start_at: new Date("2026-10-15T00:00:00Z"),
  end_at: new Date("2026-10-18T00:00:00Z"),
  is_all_day: true,
  venue: "На поселении",
};
describe("Мероприятие без времени", () => {
  it("принимает неизвестное окончание обычного мероприятия", () => {
    expect(
      eventCreateSchema.parse({ ...input, is_all_day: false, end_at: null }).end_at,
    ).toBeNull();
    expect(eventUpdateSchema.parse({ id: input.speaker_id, end_at: null }).end_at).toBeNull();
  });
  it("сохраняет краткое имя, ограничивает длину и позволяет сбросить его", () => {
    expect(eventCreateSchema.parse({ ...input, calendar_title: "Велес" }).calendar_title).toBe(
      "Велес",
    );
    expect(eventCreateSchema.safeParse({ ...input, calendar_title: "x".repeat(41) }).success).toBe(
      false,
    );
    expect(
      eventUpdateSchema.parse({ id: input.speaker_id, calendar_title: null }).calendar_title,
    ).toBeNull();
  });
  it("сохраняет признак режима без времени", () => {
    expect(eventCreateSchema.parse(input)).toMatchObject({ is_all_day: true });
  });
  it("не допускает выдуманное окончание или часы в date-only диапазоне", () => {
    expect(eventCreateSchema.safeParse({ ...input, end_at: undefined }).success).toBe(false);
    expect(
      eventCreateSchema.safeParse({ ...input, start_at: new Date("2026-10-15T10:00Z") }).success,
    ).toBe(false);
  });
  it("включает продолжающиеся события в запрос периода", () => {
    const from = new Date("2026-10-16T00:00Z");
    const to = new Date("2026-10-17T23:59Z");
    expect(buildEventListWhere({ from, to }, { mode: "global" })).toMatchObject({
      AND: expect.arrayContaining([
        { OR: [{ end_at: { gt: from } }, { end_at: null, start_at: { gte: from } }] },
        { start_at: { lte: to } },
      ]),
    });
  });
  it("создаёт одну DB запись с общими датами", async () => {
    const create = vi.fn().mockResolvedValue({ id: "evt1" });
    const caller = appRouter.createCaller({
      session: {
        user: {
          id: "owner",
          name: "Owner",
          email: "owner@example.com",
          system_role: "BRANCH_ADMIN",
          academic_level: "LISTENER",
          branch_id: null,
          is_speaker: false,
        },
      },
      prisma: { event: { create } } as unknown as Context["prisma"],
    });
    await caller.event.create(input as Parameters<typeof caller.event.create>[0]);
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        is_all_day: true,
        start_at: input.start_at,
        end_at: input.end_at,
      }),
    });
    await caller.event.create({ ...input, type: "SEMINAR", is_all_day: false, end_at: undefined });
    expect(create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ end_at: null }) });
  });
});
