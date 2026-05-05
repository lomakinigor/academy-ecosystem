"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw } from "lucide-react";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from "@academy/ui";

import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_VALUES,
  parseCalendarFilters,
  serializeCalendarFilters,
  type CalendarFilters,
  type EventTypeValue,
  type PeriodKey,
} from "./filters";

const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string }> = [
  { key: "month", label: "Месяц" },
  { key: "quarter", label: "Квартал" },
  { key: "year", label: "Год" },
  { key: "custom", label: "Период" },
];

interface BranchOption {
  id: string;
  name: string;
  city: string;
}

interface CalendarSidebarProps {
  branches: BranchOption[];
  total: number;
}

export function CalendarSidebar({ branches, total }: CalendarSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <span className="text-sm text-foreground/70">
          Всего событий: <span className="font-semibold">{total}</span>
        </span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter />
              Фильтры
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Фильтры календаря</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <SidebarBody branches={branches} total={total} onApplied={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sticky sidebar */}
      <aside className="sticky top-20 hidden lg:block">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft-sm">
          <SidebarBody branches={branches} total={total} />
        </div>
      </aside>
    </>
  );
}

interface SidebarBodyProps {
  branches: BranchOption[];
  total: number;
  onApplied?: () => void;
}

function SidebarBody({ branches, total, onApplied }: SidebarBodyProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters: CalendarFilters = useMemo(() => {
    const raw: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      raw[k] = v;
    });
    return parseCalendarFilters(raw);
  }, [searchParams]);

  const updateUrl = (next: Partial<CalendarFilters>) => {
    const merged: Partial<CalendarFilters> = { ...filters, ...next };
    const sp = serializeCalendarFilters(merged);
    const url = sp.toString() ? `${pathname}?${sp.toString()}` : pathname;
    startTransition(() => {
      router.replace(url, { scroll: false });
      onApplied?.();
    });
  };

  const setPeriod = (period: PeriodKey) => updateUrl({ period });

  const toggleType = (t: EventTypeValue) => {
    const next = filters.types.includes(t)
      ? filters.types.filter((x) => x !== t)
      : [...filters.types, t];
    updateUrl({ types: next });
  };

  const reset = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
      onApplied?.();
    });
  };

  return (
    <div className="space-y-6" data-pending={isPending ? "true" : "false"} aria-busy={isPending}>
      <div>
        <SectionTitle>Период</SectionTitle>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PERIOD_OPTIONS.map((p) => {
            const active = filters.period === p.key;
            return (
              <Button
                key={p.key}
                type="button"
                size="sm"
                variant={active ? "accent" : "outline"}
                onClick={() => setPeriod(p.key)}
                aria-pressed={active}
              >
                {p.label}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <SectionTitle>Направления</SectionTitle>
        <ul className="mt-2 space-y-1.5">
          {EVENT_TYPE_VALUES.map((t) => {
            const checked = filters.types.includes(t);
            return (
              <li key={t}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-brand-warm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border text-brand-accent accent-brand-accent"
                    checked={checked}
                    onChange={() => toggleType(t)}
                    aria-label={EVENT_TYPE_LABELS[t]}
                  />
                  <span>{EVENT_TYPE_LABELS[t]}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <Separator />

      <div>
        <SectionTitle>Поиск</SectionTitle>
        <div className="mt-2 space-y-2">
          <Input
            type="search"
            placeholder="Название мероприятия"
            defaultValue={filters.search ?? ""}
            onBlur={(e) => {
              const v = e.currentTarget.value.trim();
              if ((filters.search ?? "") !== v) {
                updateUrl({ search: v || undefined });
              }
            }}
          />
          <Input
            type="search"
            placeholder="Спикер"
            defaultValue={filters.speaker ?? ""}
            onBlur={(e) => {
              const v = e.currentTarget.value.trim();
              if ((filters.speaker ?? "") !== v) {
                updateUrl({ speaker: v || undefined });
              }
            }}
          />
        </div>
      </div>

      <Separator />

      <div>
        <SectionTitle>Филиал</SectionTitle>
        <div className="mt-2">
          <Select
            value={filters.branch_id ?? "all"}
            onValueChange={(v) => updateUrl({ branch_id: v === "all" ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все филиалы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все филиалы</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div>
        <SectionTitle>Формат</SectionTitle>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { v: undefined, label: "Все" },
            { v: false, label: "Очно" },
            { v: true, label: "Онлайн" },
          ].map((opt) => {
            const active = filters.is_online === opt.v;
            return (
              <Button
                key={String(opt.v)}
                type="button"
                size="sm"
                variant={active ? "accent" : "outline"}
                onClick={() => updateUrl({ is_online: opt.v })}
                aria-pressed={active}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/70">
          Всего событий: <span className="font-semibold">{total}</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          aria-label="Сбросить фильтры"
        >
          <RotateCcw />
          Сбросить
        </Button>
      </div>
    </div>
  );
}

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground/60">
    {children}
  </h3>
);
