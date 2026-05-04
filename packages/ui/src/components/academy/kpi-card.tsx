import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Skeleton } from "../primitives/skeleton";

export type KpiTrend = "up" | "down" | "flat";

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: LucideIcon;
  trend?: KpiTrend;
  delta?: string;
  hint?: string;
  loading?: boolean;
  emphasis?: "default" | "accent";
}

const trendStyles: Record<KpiTrend, { icon: LucideIcon; classes: string; srLabel: string }> = {
  up: { icon: ArrowUpRight, classes: "bg-success/12 text-success", srLabel: "рост" },
  down: {
    icon: ArrowDownRight,
    classes: "bg-destructive/10 text-destructive",
    srLabel: "снижение",
  },
  flat: { icon: Minus, classes: "bg-muted text-brand-primary/70", srLabel: "без изменений" },
};

const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  (
    {
      className,
      label,
      value,
      unit,
      icon: Icon,
      trend,
      delta,
      hint,
      loading = false,
      emphasis = "default",
      ...props
    },
    ref,
  ) => {
    const trendConfig = trend ? trendStyles[trend] : null;
    const TrendIcon = trendConfig?.icon;

    return (
      <article
        ref={ref}
        aria-busy={loading}
        className={cn(
          "group relative flex flex-col gap-4 overflow-hidden rounded-lg border border-border bg-card p-5 shadow-soft-sm transition-all duration-250 hover:-translate-y-0.5 hover:shadow-soft-md",
          emphasis === "accent" &&
            "border-brand-accent/30 bg-gradient-to-br from-brand-accent/8 to-transparent",
          className,
        )}
        {...props}
      >
        <header className="flex items-start justify-between gap-2">
          <p className="font-heading text-sm font-medium uppercase tracking-wide text-foreground/60">
            {label}
          </p>
          {Icon ? (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-warm text-brand-earth transition-colors group-hover:bg-brand-accent/15",
                emphasis === "accent" && "bg-brand-accent/15 text-brand-earth",
              )}
            >
              <Icon className="size-4" />
            </span>
          ) : null}
        </header>

        <div className="flex items-baseline gap-2">
          {loading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <span className="font-display text-3xl font-bold leading-none tracking-tight text-brand-primary sm:text-4xl">
              {value}
            </span>
          )}
          {unit && !loading ? (
            <span className="font-heading text-sm font-medium text-foreground/55">{unit}</span>
          ) : null}
        </div>

        {(trendConfig || hint) && !loading ? (
          <footer className="flex flex-wrap items-center gap-2 text-xs text-foreground/65">
            {trendConfig && TrendIcon ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-heading font-semibold",
                  trendConfig.classes,
                )}
              >
                <TrendIcon aria-hidden="true" className="size-3" />
                <span className="sr-only">Динамика: {trendConfig.srLabel}.</span>
                {delta ?? ""}
              </span>
            ) : null}
            {hint ? <span>{hint}</span> : null}
          </footer>
        ) : null}
      </article>
    );
  },
);
KpiCard.displayName = "KpiCard";

export { KpiCard };
