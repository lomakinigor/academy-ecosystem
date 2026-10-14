import Link from "next/link";
import type { ReactNode } from "react";
import { AcademicBadge } from "@academy/ui";
import type { AcademicLevel as UIAcademicLevel } from "@academy/ui";

import { BrandMark } from "@/components/brand/brand-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { getCurrentUser } from "@/lib/auth/helpers";
import { SystemRole } from "@/lib/auth/types";

import { GuestAdminEntry } from "@/components/auth/guest-admin-entry";

const academicLevelToUI = (level: string): UIAcademicLevel => {
  const lower = level.toLowerCase();
  if (lower === "founder" || lower === "magister" || lower === "master" || lower === "listener") {
    return lower;
  }
  return "listener";
};

const ADMIN_ROLES = new Set<string>([
  SystemRole.PRESIDENT,
  SystemRole.VICE_PRESIDENT,
  SystemRole.BRANCH_DIRECTOR,
  SystemRole.BRANCH_ADMIN,
]);

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = user ? ADMIN_ROLES.has(user.system_role) : false;

  return (
    <div className="min-h-screen bg-brand-warm/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size={40} />
            <Wordmark variant="one-line" className="hidden sm:block" />
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin/calendar"
                    className="hidden text-sm font-medium text-brand-primary underline-offset-4 hover:underline sm:inline"
                  >
                    Админка →
                  </Link>
                )}
                <Link
                  href="/student"
                  className="hidden text-sm font-medium text-brand-primary underline-offset-4 hover:underline sm:inline"
                >
                  Личный кабинет →
                </Link>
                <div className="hidden text-right text-sm leading-tight sm:block">
                  <div className="font-medium text-brand-primary">{user.name}</div>
                  <div className="text-xs text-foreground/60">{user.email}</div>
                </div>
                <AcademicBadge level={academicLevelToUI(user.academic_level)} size="sm" />
              </>
            ) : (
              <GuestAdminEntry />
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
