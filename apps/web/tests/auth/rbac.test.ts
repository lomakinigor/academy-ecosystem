import { describe, it, expect } from "vitest";

import {
  matchRule,
  hasRoleAtLeast,
  isNetworkWide,
  canAccessBranch,
} from "@/lib/auth/rbac";
import { SystemRole, AcademicLevel, type SessionUser } from "@/lib/auth/types";

function user(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "u1",
    name: "Test",
    email: "test@example.com",
    system_role: SystemRole.STUDENT,
    academic_level: AcademicLevel.LISTENER,
    branch_id: "branch-msk",
    is_speaker: false,
    ...overrides,
  };
}

describe("matchRule", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/", "/admin"],
    ["/admin/users", "/admin"],
    ["/director/branches/msk", "/director"],
    ["/network/analytics", "/network"],
    ["/student/profile", "/student"],
  ])("matches %s to prefix %s", (path, expectedPrefix) => {
    expect(matchRule(path)?.prefix).toBe(expectedPrefix);
  });

  it("returns null for unprotected paths", () => {
    expect(matchRule("/")).toBeNull();
    expect(matchRule("/login")).toBeNull();
    expect(matchRule("/api/health")).toBeNull();
  });

  it("does not match prefix collisions like /administration", () => {
    expect(matchRule("/administration")).toBeNull();
    expect(matchRule("/networking")).toBeNull();
  });
});

describe("hasRoleAtLeast — access matrix", () => {
  const cases: Array<[SystemRole, SystemRole, boolean]> = [
    [SystemRole.STUDENT, SystemRole.STUDENT, true],
    [SystemRole.STUDENT, SystemRole.BRANCH_ADMIN, false],
    [SystemRole.BRANCH_ADMIN, SystemRole.BRANCH_ADMIN, true],
    [SystemRole.BRANCH_ADMIN, SystemRole.BRANCH_DIRECTOR, false],
    [SystemRole.BRANCH_DIRECTOR, SystemRole.BRANCH_ADMIN, true],
    [SystemRole.BRANCH_DIRECTOR, SystemRole.VICE_PRESIDENT, false],
    [SystemRole.VICE_PRESIDENT, SystemRole.VICE_PRESIDENT, true],
    [SystemRole.PRESIDENT, SystemRole.VICE_PRESIDENT, true],
    [SystemRole.PRESIDENT, SystemRole.PRESIDENT, true],
    [SystemRole.STUDENT, SystemRole.PRESIDENT, false],
  ];

  it.each(cases)("role=%s vs min=%s → %s", (role, min, expected) => {
    expect(hasRoleAtLeast(user({ system_role: role }), min)).toBe(expected);
  });
});

describe("isNetworkWide", () => {
  it("returns true for PRESIDENT and VICE_PRESIDENT", () => {
    expect(isNetworkWide(user({ system_role: SystemRole.PRESIDENT }))).toBe(true);
    expect(isNetworkWide(user({ system_role: SystemRole.VICE_PRESIDENT }))).toBe(true);
  });

  it("returns false for branch-scoped roles", () => {
    expect(isNetworkWide(user({ system_role: SystemRole.BRANCH_DIRECTOR }))).toBe(false);
    expect(isNetworkWide(user({ system_role: SystemRole.BRANCH_ADMIN }))).toBe(false);
    expect(isNetworkWide(user({ system_role: SystemRole.STUDENT }))).toBe(false);
  });
});

describe("canAccessBranch", () => {
  it("president sees any branch", () => {
    expect(
      canAccessBranch(
        user({ system_role: SystemRole.PRESIDENT, branch_id: null }),
        "branch-chel",
      ),
    ).toBe(true);
  });

  it("vp sees any branch even with mismatched branch_id", () => {
    expect(
      canAccessBranch(
        user({ system_role: SystemRole.VICE_PRESIDENT, branch_id: "branch-msk" }),
        "branch-chel",
      ),
    ).toBe(true);
  });

  it("branch director sees own branch", () => {
    expect(
      canAccessBranch(
        user({ system_role: SystemRole.BRANCH_DIRECTOR, branch_id: "branch-msk" }),
        "branch-msk",
      ),
    ).toBe(true);
  });

  it("branch director rejected from foreign branch", () => {
    expect(
      canAccessBranch(
        user({ system_role: SystemRole.BRANCH_DIRECTOR, branch_id: "branch-msk" }),
        "branch-chel",
      ),
    ).toBe(false);
  });

  it("user without branch_id is rejected unless network-wide", () => {
    expect(
      canAccessBranch(
        user({ system_role: SystemRole.BRANCH_ADMIN, branch_id: null }),
        "branch-msk",
      ),
    ).toBe(false);
  });

  it("student without branch is rejected", () => {
    expect(
      canAccessBranch(
        user({ system_role: SystemRole.STUDENT, branch_id: null }),
        "branch-msk",
      ),
    ).toBe(false);
  });
});
