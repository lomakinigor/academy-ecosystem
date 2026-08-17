import { describe, expect, it } from "vitest";

import { settlePublicCalendar } from "../../app/(public)/settle-public-calendar";

describe("settlePublicCalendar", () => {
  it("returns loaded data when the backend responds", async () => {
    const result = await settlePublicCalendar(async () => [["event"], ["branch"]] as const);

    expect(result).toEqual({ events: ["event"], branches: ["branch"], unavailable: false });
  });

  it("keeps the public page renderable when the backend is unavailable", async () => {
    const result = await settlePublicCalendar(async () => {
      throw new Error("database unavailable");
    });

    expect(result).toEqual({ events: [], branches: [], unavailable: true });
  });
});
