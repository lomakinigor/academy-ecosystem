import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  canAccessBranch as canAccessBranchPure,
  hasRoleAtLeast,
} from "./rbac";
import type { SessionUser, SystemRole } from "./types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(min: SystemRole): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasRoleAtLeast(user, min)) redirect("/unauthorized");
  return user;
}

export async function requireBranch(branchId: string): Promise<SessionUser> {
  const user = await requireUser();
  if (!canAccessBranchPure(user, branchId)) redirect("/unauthorized");
  return user;
}

export async function canAccessBranch(
  userId: string,
  branchId: string,
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) return false;
  return canAccessBranchPure(user, branchId);
}
