import * as React from 'react';
import { Crown, Sparkles, Star, GraduationCap, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AcademicLevel = 'founder' | 'magister' | 'master' | 'listener';

interface LevelConfig {
  label: string;
  icon: LucideIcon;
  classes: string;
  iconClasses: string;
}

const levelMap: Record<AcademicLevel, LevelConfig> = {
  founder: {
    label: 'Основатель',
    icon: Crown,
    classes: 'bg-gradient-to-r from-brand-accent/25 to-brand-earth/15 text-brand-earth ring-1 ring-brand-accent/40 shadow-gold',
    iconClasses: 'text-brand-accent',
  },
  magister: {
    label: 'Магистр',
    icon: Sparkles,
    classes: 'bg-brand-accent/15 text-brand-earth ring-1 ring-brand-accent/30',
    iconClasses: 'text-brand-accent',
  },
  master: {
    label: 'Мастер',
    icon: Star,
    classes: 'bg-muted text-brand-primary/85 ring-1 ring-border',
    iconClasses: 'text-brand-primary/65',
  },
  listener: {
    label: 'Слушатель',
    icon: GraduationCap,
    classes: 'bg-brand-warm text-brand-primary/80 ring-1 ring-border',
    iconClasses: 'text-brand-primary/55',
  },
};

export interface AcademicBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: AcademicLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const sizeMap = {
  sm: 'h-6 px-2 text-[11px] gap-1 [&_svg]:size-3',
  md: 'h-7 px-2.5 text-xs gap-1.5 [&_svg]:size-3.5',
  lg: 'h-8 px-3 text-sm gap-2 [&_svg]:size-4',
} as const;

const AcademicBadge = React.forwardRef<HTMLSpanElement, AcademicBadgeProps>(
  ({ className, level, size = 'md', showLabel = true, label, ...props }, ref) => {
    const config = levelMap[level];
    const Icon = config.icon;
    const text = label ?? config.label;

    return (
      <span
        ref={ref}
        role="img"
        aria-label={`Академический уровень: ${text}`}
        data-level={level}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-heading font-semibold transition-shadow duration-250',
          sizeMap[size],
          config.classes,
          className,
        )}
        {...props}
      >
        <Icon aria-hidden="true" className={cn('shrink-0', config.iconClasses)} />
        {showLabel && <span>{text}</span>}
      </span>
    );
  },
);
AcademicBadge.displayName = 'AcademicBadge';

export { AcademicBadge, levelMap as academicLevelMap };
