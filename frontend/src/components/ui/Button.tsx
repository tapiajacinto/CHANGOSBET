'use client';
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  'relative inline-flex items-center justify-center gap-2 font-display font-bold rounded-2xl ' +
  'transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-brand-gradient text-white shadow-brand hover:shadow-brand-lg hover:brightness-105',
  gold:    'bg-gold-gradient text-brand-950 shadow-gold hover:brightness-105',
  outline: 'border-2 border-brand-200 text-brand-700 bg-white hover:border-brand-400 hover:bg-brand-50',
  ghost:   'text-brand-700 hover:bg-brand-50',
  danger:  'bg-red-600 text-white shadow-brand hover:bg-red-700',
  subtle:  'bg-brand-50 text-brand-700 hover:bg-brand-100',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-[15px] px-5 py-3',
  lg: 'text-base px-7 py-4',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, leftIcon, rightIcon, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
        </span>
      )}
      <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    </button>
  );
});
