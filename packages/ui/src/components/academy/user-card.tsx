import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { AcademicBadge, type AcademicLevel } from "./academic-badge";
import { cn } from "../../lib/utils";

export interface UserCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  level: AcademicLevel;
  avatarUrl?: string;
  subtitle?: string;
  branchLabel?: string;
  isSpeaker?: boolean;
  size?: "sm" | "md" | "lg";
  action?: React.ReactNode;
}

const sizeMap = {
  sm: { avatar: "size-9", name: "text-sm", sub: "text-xs" },
  md: { avatar: "size-12", name: "text-base", sub: "text-sm" },
  lg: { avatar: "size-16", name: "text-lg", sub: "text-sm" },
} as const;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const UserCard = React.forwardRef<HTMLDivElement, UserCardProps>(
  (
    {
      className,
      name,
      level,
      avatarUrl,
      subtitle,
      branchLabel,
      isSpeaker = false,
      size = "md",
      action,
      ...props
    },
    ref,
  ) => {
    const sizes = sizeMap[size];

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 rounded-md border border-border bg-card p-3 transition-shadow duration-250 hover:shadow-soft-sm",
          className,
        )}
        {...props}
      >
        <Avatar className={sizes.avatar}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn("truncate font-heading font-semibold text-brand-primary", sizes.name)}
            >
              {name}
            </span>
            {isSpeaker && (
              <span className="inline-flex h-5 items-center rounded-full bg-brand-accent/15 px-2 text-[10px] font-semibold uppercase tracking-wide text-brand-earth">
                Спикер
              </span>
            )}
          </div>
          {(subtitle || branchLabel) && (
            <p className={cn("truncate text-foreground/65", sizes.sub)}>
              {subtitle}
              {subtitle && branchLabel ? " · " : ""}
              {branchLabel}
            </p>
          )}
          <AcademicBadge level={level} size="sm" className="self-start" />
        </div>

        {action ? <div className="ml-auto shrink-0">{action}</div> : null}
      </div>
    );
  },
);
UserCard.displayName = "UserCard";

export { UserCard };
