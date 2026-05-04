import { describe, it, expect } from "vitest";

import { matchRule, hasRoleAtLeast } from "@/lib/auth/rbac";
import { SystemRole } from "@/lib/auth/types";

// Full access matrix: role × route → allowed?
// Mirrors the table in README. If you change route rules, update both.
type Cell = { role: SystemRole; path: string; allowed: boolean };

const matrix: Cell[] = [
  // /student — anyone authenticated
  { role: SystemRole.STUDENT, path: "/student/profile", allowed: true },
  { role: SystemRole.BRANCH_ADMIN, path: "/student/profile", allowed: true },
  { role: SystemRole.PRESIDENT, path: "/student/profile", allowed: true },

  // /admin — BRANCH_ADMIN and above
  { role: SystemRole.STUDENT, path: "/admin/users", allowed: false },
  { role: SystemRole.BRANCH_ADMIN, path: "/admin/users", allowed: true },
  { role: SystemRole.BRANCH_DIRECTOR, path: "/admin/users", allowed: true },
  { role: SystemRole.PRESIDENT, path: "/admin/users", allowed: true },

  // /director — BRANCH_DIRECTOR and above
  { role: SystemRole.BRANCH_ADMIN, path: "/director/branch", allowed: false },
  { role: SystemRole.BRANCH_DIRECTOR, path: "/director/branch", allowed: true },
  { role: SystemRole.VICE_PRESIDENT, path: "/director/branch", allowed: true },

  // /network — VP and PRESIDENT only
  { role: SystemRole.BRANCH_DIRECTOR, path: "/network/analytics", allowed: false },
  { role: SystemRole.VICE_PRESIDENT, path: "/network/analytics", allowed: true },
  { role: SystemRole.PRESIDENT, path: "/network/analytics", allowed: true },
];

describe("route × role access matrix", () => {
  it.each(matrix)("$role on $path → allowed=$allowed", ({ role, path, allowed }) => {
    const rule = matchRule(path);
    expect(rule).not.toBeNull();
    const ok = hasRoleAtLeast({ system_role: role }, rule!.minRole);
    expect(ok).toBe(allowed);
  });
});
