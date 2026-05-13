import Link from "next/link";
import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/helpers";
import { SystemRole } from "@/lib/auth/types";
import { AcademicBadge } from "@academy/ui";
import type { AcademicLevel as UIAcademicLevel } from "@academy/ui";

import { BrandMark } from "@/components/brand/brand-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { LogoutButton } from "./logout-button";

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
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin/calendar" className="flex items-center gap-3">
            <BrandMark size={40} />
            <Wordmark variant="one-line" className="hidden sm:block" />
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              <Link
                href="/admin/calendar"
                className="text-foreground/70 hover:text-brand-primary transition-colors"
              >
                Календарь
              </Link>
              <Link
                href="/admin/speakers"
                className="text-foreground/70 hover:text-brand-primary transition-colors"
              >
                Спикеры
              </Link>
            </nav>
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
