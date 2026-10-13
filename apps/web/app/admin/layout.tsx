import Link from "next/link";
import type { ReactNode } from "react";
import { isConfiguredOwner } from "@academy/api";

import { requireRole } from "@/lib/auth/helpers";
import { SystemRole } from "@/lib/auth/types";
import { AcademicBadge } from "@academy/ui";
import type { AcademicLevel as UIAcademicLevel } from "@academy/ui";

import { BrandMark } from "@/components/brand/brand-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { LogoutButton } from "./logout-button";
import { AdminNav } from "./admin-nav";

const academicLevelToUI = (level: string): UIAcademicLevel => {
  const lower = level.toLowerCase();
  if (lower === "founder" || lower === "magister" || lower === "master" || lower === "listener") {
    return lower;
  }
  return "listener";
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(SystemRole.BRANCH_ADMIN);

  return (
    <div className="min-h-screen bg-brand-warm/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin/calendar" className="flex items-center gap-3">
            <BrandMark size={40} />
            <Wordmark variant="one-line" className="hidden sm:block" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm leading-tight sm:block">
              <div className="font-medium text-brand-primary">{user.name}</div>
              <div className="text-xs text-foreground/60">{user.email}</div>
            </div>
            {isConfiguredOwner(user.id) ? (
              <span className="rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                Владелец
              </span>
            ) : (
              <AcademicBadge level={academicLevelToUI(user.academic_level)} size="sm" />
            )}
            <LogoutButton />
          </div>

          <AdminNav />
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
