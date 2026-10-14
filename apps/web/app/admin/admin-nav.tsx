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
      className="order-3 grid w-full grid-cols-2 gap-2 text-sm sm:order-none sm:flex sm:w-auto"
    >
      {sections.map(([href, label]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 min-w-0 items-center justify-center rounded-full border px-3 py-2 transition-colors ${active ? "border-brand-accent bg-brand-accent font-semibold text-brand-primary" : "border-border text-foreground/70 hover:bg-brand-warm hover:text-brand-primary"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
