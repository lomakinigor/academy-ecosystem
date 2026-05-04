import { describe, it, expect } from "vitest";
import { router, protectedProcedure } from "../src/trpc";
import type { Context, SessionUser } from "../src/context";

const testRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.user),
});

const sessionUser: SessionUser = {
  id: "u1",
  email: "x@y.z",
  name: "Тест",
  system_role: "STUDENT",
  academic_level: "LISTENER",
  branch_id: "b1",
  is_speaker: false,
};

const ctxNoSession: Context = {
  session: null,
  prisma: {} as Context["prisma"],
};

const ctxAuthed: Context = {
  session: { user: sessionUser },
  prisma: {} as Context["prisma"],
};

describe("protectedProcedure", () => {
  it("кидает UNAUTHORIZED без сессии", async () => {
    const caller = testRouter.createCaller(ctxNoSession);
    await expect(caller.me()).rejects.toThrow(/UNAUTHORIZED/);
  });

  it("пропускает с сессией и заполняет ctx.user", async () => {
    const caller = testRouter.createCaller(ctxAuthed);
    const r = await caller.me();
    expect(r.id).toBe("u1");
    expect(r.system_role).toBe("STUDENT");
    expect(r.academic_level).toBe("LISTENER");
  });
});
