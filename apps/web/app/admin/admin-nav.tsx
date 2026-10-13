"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  ["/admin/finance", "Финансы"],
  ["/admin/marketing", "Маркетинг"],
  ["/admin/calendar", "Мероприятия"],
  ["/admin/clients", "Клиенты"],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Разделы админ-панели"
      className="order-3 flex w-full gap-1 overflow-x-auto pb-1 text-sm sm:order-none sm:w-auto sm:pb-0"
    >
      {sections.map(([href, label]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-md px-3 py-2 transition-colors ${active ? "bg-brand-accent font-semibold text-brand-primary" : "text-foreground/70 hover:bg-brand-warm hover:text-brand-primary"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
