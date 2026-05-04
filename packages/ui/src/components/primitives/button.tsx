import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-heading text-sm font-semibold transition-all duration-250 ease-academy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand-primary text-white shadow-soft-sm hover:bg-brand-primary/90 hover:shadow-soft-md',
        accent: 'bg-brand-accent text-brand-primary shadow-soft-sm hover:bg-brand-accent/90 hover:shadow-gold',
        outline: 'border border-border bg-background hover:bg-brand-warm hover:text-brand-primary',
        ghost: 'hover:bg-brand-warm hover:text-brand-primary',
        link: 'text-brand-primary underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-white shadow-soft-sm hover:bg-destructive/90',
        secondary: 'bg-muted text-brand-primary hover:bg-muted/80',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
