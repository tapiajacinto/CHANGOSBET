'use client';
import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Accent = 'none' | 'gold' | 'brand' | 'win';
type Variant = 'default' | 'glass' | 'tone' | 'plain';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hover?: boolean;
  interactive?: boolean;
  variant?: Variant;
  /** Acento dorado/marca/win SUTIL como hairline. */
  accent?: Accent;
  /** Foto de fondo a sangre con velo oscuro (cards listas para imagen). */
  bgImage?: string;
  /** Intensidad del velo sobre la foto (0–100). */
  overlay?: number;
}

const variantCls: Record<Variant, string> = {
  default: 'bg-surface border border-line shadow-card',
  glass:   'glass shadow-card',
  tone:    'bg-surface-2 border border-line',
  plain:   'bg-surface border border-line',
};

const accentCls: Record<Accent, string> = {
  none:  '',
  gold:  'hairline-gold',
  brand: 'shadow-ring-brand',
  win:   'shadow-ring-win',
};

export function Card({
  className, padded = true, hover, interactive, variant = 'default',
  accent = 'none', bgImage, overlay = 72, children, ...props
}: CardProps) {
  const lift = hover || interactive;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl sheen-top',
        variantCls[variant],
        accentCls[accent],
        padded && 'p-5 sm:p-6',
        lift && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        bgImage && 'text-white',
        className,
      )}
      {...props}
    >
      {bgImage && (
        <>
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center transition-transform duration-500"
            style={{ backgroundImage: `url(${bgImage})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 -z-10 bg-tile-fade"
            style={{ opacity: overlay / 100 }}
            aria-hidden
          />
        </>
      )}
      {children}
    </div>
  );
}

export function CardTitle({ icon, title, subtitle, action, accent = 'brand' }: {
  icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode;
  accent?: 'brand' | 'gold' | 'win' | 'neutral';
}) {
  const chip = {
    brand:   'bg-brand-gradient text-white shadow-brand',
    gold:    'bg-gold-gradient text-brand-950 shadow-gold',
    win:     'bg-win-gradient text-white shadow-win',
    neutral: 'bg-surface-2 text-fg border border-line',
  }[accent];
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon && (
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg', chip)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-bold leading-tight text-fg">{title}</h3>
        {subtitle && <p className="text-xs text-fg-subtle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
