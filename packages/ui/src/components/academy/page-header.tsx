import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  align?: 'start' | 'center';
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    { className, title, description, eyebrow, actions, align = 'start', children, ...props },
    ref,
  ) => (
    <header
      ref={ref}
      className={cn(
        'flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'items-center text-center sm:flex-col sm:items-center',
        className,
      )}
      {...props}
    >
      <div className={cn('flex max-w-2xl flex-col gap-2', align === 'center' && 'items-center')}>
        {eyebrow ? (
          <span className="font-heading text-xs font-semibold uppercase tracking-[0.16em] text-brand-earth">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-brand-primary sm:text-4xl md:text-display-md">
          {title}
        </h1>
        {description ? (
          <p className="text-base text-foreground/70 sm:text-lg">{description}</p>
        ) : null}
        {children}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
    </header>
  ),
);
PageHeader.displayName = 'PageHeader';

export { PageHeader };
