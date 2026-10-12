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
            <AcademicBadge level={academicLevelToUI(user.academic_level)} size="sm" />
            <LogoutButton />
          </div>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto pb-1 text-sm sm:order-none sm:w-auto sm:pb-0">
            <Link
              href="/admin/finance"
              className="shrink-0 rounded-md px-3 py-2 text-foreground/70 transition-colors hover:bg-brand-warm hover:text-brand-primary"
            >
              Финансы
            </Link>
            <Link
              href="/admin/marketing"
              className="shrink-0 rounded-md px-3 py-2 text-foreground/70 transition-colors hover:bg-brand-warm hover:text-brand-primary"
            >
              Маркетинг
            </Link>
            <Link
              href="/admin/calendar"
              className="shrink-0 rounded-md px-3 py-2 text-foreground/70 transition-colors hover:bg-brand-warm hover:text-brand-primary"
            >
              Мероприятия
            </Link>
            <Link
              href="/admin/clients"
              className="shrink-0 rounded-md px-3 py-2 text-foreground/70 transition-colors hover:bg-brand-warm hover:text-brand-primary"
            >
              Клиенты
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
