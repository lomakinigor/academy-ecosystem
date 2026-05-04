type WordmarkProps = {
  variant: "three-line" | "one-line";
  className?: string;
};

const ARIA_LABEL = "Академия Развития Человека";

function join(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Wordmark({ variant, className }: WordmarkProps) {
  if (variant === "one-line") {
    return (
      <span
        aria-label={ARIA_LABEL}
        className={join(
          "font-heading text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary",
          className,
        )}
      >
        АКАДЕМИЯ РАЗВИТИЯ ЧЕЛОВЕКА
      </span>
    );
  }

  return (
    <div
      aria-label={ARIA_LABEL}
      className={join(
        "flex flex-col font-display font-bold leading-[1.05] tracking-tight",
        className,
      )}
    >
      <span className="text-3xl text-brand-primary md:text-4xl lg:text-5xl">АКАДЕМИЯ</span>
      <span className="text-3xl text-brand-accent md:text-4xl lg:text-5xl">РАЗВИТИЯ</span>
      <span className="text-3xl text-brand-primary md:text-4xl lg:text-5xl">ЧЕЛОВЕКА</span>
    </div>
  );
}
