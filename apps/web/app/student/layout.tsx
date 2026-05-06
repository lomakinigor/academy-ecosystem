import Link from "next/link";
import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/helpers";
import { SystemRole } from "@/lib/auth/types";
import { AcademicBadge } from "@academy/ui";
import type { AcademicLevel as UIAcademicLevel } from "@academy/ui";

import { BrandMark } from "@/components/brand/brand-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { LogoutButton } from "../admin/logout-button";

const academicLevelToUI = (level: string): UIAcademicLevel => {
  const lower = level.toLowerCase();
  if (lower === "founder" || lower === "magister" || lower === "master" || lower === "listener") {
    return lower;
  }
  return "listener";
};

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(SystemRole.STUDENT);
  const adminEnough =
    user.system_role === SystemRole.PRESIDENT ||
    user.system_role === SystemRole.VICE_PRESIDENT ||
    user.system_role === SystemRole.BRANCH_DIRECTOR ||
    user.system_role === SystemRole.BRANCH_ADMIN;

  return (
    <div className="min-h-screen bg-brand-warm/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/student" className="flex items-center gap-3">
            <BrandMark size={40} />
            <Wordmark variant="one-line" className="hidden sm:block" />
          </Link>

          <div className="flex items-center gap-3">
            {adminEnough && (
              <Link
                href="/admin/calendar"
                className="hidden text-sm font-medium text-brand-primary underline-offset-4 hover:underline sm:inline"
              >
                Админка →
              </Link>
            )}
            <div className="hidden text-right text-sm leading-tight sm:block">
              <div className="font-medium text-brand-primary">{user.name}</div>
              <div className="text-xs text-foreground/60">{user.email}</div>
            </div>
            <AcademicBadge level={academicLevelToUI(user.academic_level)} size="sm" />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
