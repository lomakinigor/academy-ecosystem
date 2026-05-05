import { describe, it, expect } from "vitest";
import { computeBranchScope, isGlobalUser, type BranchScope } from "../src/trpc";
import { buildEventListWhere } from "../src/routers/event";
import type { SessionUser } from "../src/context";
import type { EventListInput } from "../src/schemas/event";

const user = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: "u1",
  email: "u@a.ru",
  name: "User",
  system_role: "BRANCH_ADMIN",
  academic_level: "MASTER",
  branch_id: "branch_msk",
  is_speaker: false,
  ...overrides,
});

const range: EventListInput = {
  from: new Date("2026-05-01T00:00:00Z"),
  to: new Date("2026-05-31T23:59:59Z"),
};

describe("computeBranchScope", () => {
  it("PRESIDENT — global mode, без ограничений", () => {
    const scope = computeBranchScope(user({ system_role: "PRESIDENT" }));
    expect(scope.mode).toBe("global");
    expect(isGlobalUser(user({ system_role: "PRESIDENT" }))).toBe(true);
  });

  it("VICE_PRESIDENT — global mode", () => {
    const scope = computeBranchScope(user({ system_role: "VICE_PRESIDENT" }));
    expect(scope.mode).toBe("global");
  });

  it("BRANCH_DIRECTOR — scoped к своему branch_id", () => {
    const scope = computeBranchScope(
      user({ system_role: "BRANCH_DIRECTOR", branch_id: "branch_ekb" }),
    );
    expect(scope).toEqual({ mode: "scoped", branch_id: "branch_ekb" });
  });

  it("BRANCH_ADMIN — scoped к своему branch_id", () => {
    const scope = computeBranchScope(user({ system_role: "BRANCH_ADMIN" }));
    expect(scope).toEqual({ mode: "scoped", branch_id: "branch_msk" });
  });

  it("STUDENT (магистр/мастер/слушатель) — scoped к своему филиалу", () => {
    const scope = computeBranchScope(user({ system_role: "STUDENT", branch_id: "branch_chel" }));
    expect(scope).toEqual({ mode: "scoped", branch_id: "branch_chel" });
  });

  it("STUDENT без branch_id — scoped к null (видит только общие события)", () => {
    const scope = computeBranchScope(user({ system_role: "STUDENT", branch_id: null }));
    expect(scope).toEqual({ mode: "scoped", branch_id: null });
  });
});

describe("buildEventListWhere — branch isolation", () => {
  const global: BranchScope = { mode: "global" };
  const scopedMsk: BranchScope = { mode: "scoped", branch_id: "branch_msk" };

  it("global без явного branch_id → нет ограничения по филиалу", () => {
    const where = buildEventListWhere(range, global);
    const branchClauses = (where.AND as Array<Record<string, unknown>>).filter(
      (c) => "branch_id" in c,
    );
    expect(branchClauses).toHaveLength(0);
  });

  it("global с явным branch_id → точечный фильтр", () => {
    const where = buildEventListWhere({ ...range, branch_id: "branch_chel" }, global);
    const branch = (where.AND as Array<Record<string, unknown>>).find((c) => "branch_id" in c);
    expect(branch).toEqual({ branch_id: "branch_chel" });
  });

  it("scoped без явного фильтра → OR(свой, null)", () => {
    const where = buildEventListWhere(range, scopedMsk);
    const orClause = (where.AND as Array<Record<string, unknown>>).find(
      (c) => "OR" in c && Array.isArray((c as { OR: unknown[] }).OR),
    ) as { OR: Array<Record<string, unknown>> } | undefined;
    expect(orClause).toBeDefined();
    expect(orClause?.OR).toEqual([{ branch_id: "branch_msk" }, { branch_id: null }]);
  });

  it("scoped с branch_id=null (юзер без филиала) → точечный null", () => {
    const where = buildEventListWhere(range, {
      mode: "scoped",
      branch_id: null,
    });
    const branch = (where.AND as Array<Record<string, unknown>>).find((c) => "branch_id" in c);
    expect(branch).toEqual({ branch_id: null });
  });

  it("scoped + явный свой branch → точечный фильтр", () => {
    const where = buildEventListWhere({ ...range, branch_id: "branch_msk" }, scopedMsk);
    const branch = (where.AND as Array<Record<string, unknown>>).find((c) => "branch_id" in c);
    expect(branch).toEqual({ branch_id: "branch_msk" });
  });

  it("scoped + явный null → точечный фильтр на общие события", () => {
    const where = buildEventListWhere({ ...range, branch_id: null }, scopedMsk);
    const branch = (where.AND as Array<Record<string, unknown>>).find((c) => "branch_id" in c);
    expect(branch).toEqual({ branch_id: null });
  });

  it("scoped + чужой branch → never-фильтр (пустая выборка)", () => {
    const where = buildEventListWhere({ ...range, branch_id: "branch_alien" }, scopedMsk);
    const never = (where.AND as Array<Record<string, unknown>>).find((c) => "id" in c);
    expect(never).toEqual({ id: "__never__" });
  });
});

describe("buildEventListWhere — пользовательские фильтры", () => {
  const global: BranchScope = { mode: "global" };

  const findClause = <K extends string>(where: ReturnType<typeof buildEventListWhere>, key: K) =>
    (where.AND as Array<Record<string, unknown>>).find((c) => key in c) as
      | Record<K, unknown>
      | undefined;

  it("types → IN-фильтр", () => {
    const where = buildEventListWhere({ ...range, types: ["SEMINAR", "WEBINAR"] }, global);
    expect(findClause(where, "type")).toEqual({
      type: { in: ["SEMINAR", "WEBINAR"] },
    });
  });

  it("speaker_id → точечный фильтр", () => {
    const where = buildEventListWhere({ ...range, speaker_id: "u_speaker" }, global);
    expect(findClause(where, "speaker_id")).toEqual({ speaker_id: "u_speaker" });
  });

  it("is_online=true → булев фильтр", () => {
    const where = buildEventListWhere({ ...range, is_online: true }, global);
    expect(findClause(where, "is_online")).toEqual({ is_online: true });
  });

  it("tags → hasSome", () => {
    const where = buildEventListWhere({ ...range, tags: ["с детьми", "СВЕТЛОЯР"] }, global);
    expect(findClause(where, "tags")).toEqual({
      tags: { hasSome: ["с детьми", "СВЕТЛОЯР"] },
    });
  });

  it("search → OR по title и description (insensitive)", () => {
    const where = buildEventListWhere({ ...range, search: "храм" }, global);
    const or = findClause(where, "OR") as { OR: Array<Record<string, unknown>> };
    expect(or.OR).toEqual([
      { title: { contains: "храм", mode: "insensitive" } },
      { description: { contains: "храм", mode: "insensitive" } },
    ]);
  });

  it("from/to всегда применяются", () => {
    const where = buildEventListWhere(range, global);
    const dateClauses = (where.AND as Array<Record<string, unknown>>).filter(
      (c) => "start_at" in c,
    );
    expect(dateClauses).toHaveLength(2);
  });
});
