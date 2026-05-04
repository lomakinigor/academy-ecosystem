import * as React from 'react';
import { cn } from '@/lib/utils';

export type EventStatus = 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';

interface StatusConfig {
  label: string;
  classes: string;
  dot: string;
}

const statusMap: Record<EventStatus, StatusConfig> = {
  draft: {
    label: 'Черновик',
    classes: 'bg-muted text-brand-primary/70 ring-1 ring-border',
    dot: 'bg-brand-primary/40',
  },
  planned: {
    label: 'Запланировано',
    classes: 'bg-brand-accent/15 text-brand-earth ring-1 ring-brand-accent/30',
    dot: 'bg-brand-accent',
  },
  active: {
    label: 'Идёт сейчас',
    classes: 'bg-success/12 text-success ring-1 ring-success/30',
    dot: 'bg-success animate-pulse',
  },
  completed: {
    label: 'Завершено',
    classes: 'bg-brand-primary/8 text-brand-primary ring-1 ring-brand-primary/15',
    dot: 'bg-brand-primary/60',
  },
  cancelled: {
    label: 'Отменено',
    classes: 'bg-destructive/10 text-destructive ring-1 ring-destructive/25',
    dot: 'bg-destructive/70',
  },
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: EventStatus;
  showDot?: boolean;
  label?: string;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, showDot = true, label, ...props }, ref) => {
    const config = statusMap[status];
    const text = label ?? config.label;

    return (
      <span
        ref={ref}
        data-status={status}
        aria-label={`Статус: ${text}`}
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-heading text-xs font-semibold',
          config.classes,
          className,
        )}
        {...props}
      >
        {showDot && (
          <span aria-hidden="true" className={cn('size-1.5 rounded-full', config.dot)} />
        )}
        <span>{text}</span>
      </span>
    );
  },
);
StatusBadge.displayName = 'StatusBadge';

export { StatusBadge, statusMap as eventStatusMap };
