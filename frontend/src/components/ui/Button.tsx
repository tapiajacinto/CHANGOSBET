'use client';
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'gold' | 'win' | 'outline' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden font-display font-bold rounded-2xl ' +
  'transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-brand-gradient text-white shadow-brand hover:shadow-brand-lg hover:brightness-110',
  gold:    'bg-gold-gradient text-brand-950 shadow-gold hover:brightness-105',
  win:     'bg-win-gradient text-white shadow-win hover:brightness-110',
  outline: 'border border-line-2 bg-surface text-fg hover:border-brand-400/70 hover:bg-surface-2',
  ghost:   'text-fg hover:bg-surface-2',
  danger:  'bg-brand-700 text-white shadow-brand hover:bg-brand-800',
  subtle:  'bg-surface-2 text-fg border border-line hover:bg-surface-3',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-[15px] px-5 py-3',
  lg: 'text-base px-7 py-4',
  xl: 'text-lg px-9 py-[1.15rem]',
};

/** Variantes con degradé que llevan el "sheen" diagonal al hover. */
const sheenable: Variant[] = ['primary', 'gold', 'win', 'danger'];

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
      {sheenable.includes(variant) && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 blur-md transition-opacity duration-300 group-hover:animate-sheen group-hover:opacity-100"
        />
      )}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
        </span>
      )}
      <span className={cn('relative inline-flex items-center gap-2', loading && 'invisible')}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    </button>
  );
});
