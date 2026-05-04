import {
  SystemRole,
  SYSTEM_ROLE_RANK,
  type SessionUser,
} from "./types";

export type RouteRule = {
  prefix: string;
  minRole: SystemRole;
};

// Order matters: more specific prefixes must come before more general ones.
export const ROUTE_RULES: RouteRule[] = [
  { prefix: "/network", minRole: SystemRole.VICE_PRESIDENT },
  { prefix: "/director", minRole: SystemRole.BRANCH_DIRECTOR },
  { prefix: "/admin", minRole: SystemRole.BRANCH_ADMIN },
  { prefix: "/student", minRole: SystemRole.STUDENT },
];

export function matchRule(pathname: string): RouteRule | null {
  for (const rule of ROUTE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule;
    }
  }
  return null;
}

export function hasRoleAtLeast(user: Pick<SessionUser, "system_role">, min: SystemRole): boolean {
  return SYSTEM_ROLE_RANK[user.system_role] >= SYSTEM_ROLE_RANK[min];
}

// Network-wide roles bypass branch isolation; everyone else is pinned to their branch.
export function isNetworkWide(user: Pick<SessionUser, "system_role">): boolean {
  return (
    user.system_role === SystemRole.PRESIDENT ||
    user.system_role === SystemRole.VICE_PRESIDENT
  );
}

export function canAccessBranch(
  user: Pick<SessionUser, "system_role" | "branch_id">,
  targetBranchId: string,
): boolean {
  if (isNetworkWide(user)) return true;
  return user.branch_id !== null && user.branch_id === targetBranchId;
}
