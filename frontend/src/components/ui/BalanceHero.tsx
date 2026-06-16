'use client';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Money } from './Money';
import { Icon } from './Icon';

interface BalanceHeroProps {
  value: number;
  label?: string;
  caption?: ReactNode;
  /** Fila de acciones (botones/links) bajo el saldo. */
  actions?: ReactNode;
  /** Slot superior derecho (ej: badge "Activo"). */
  badge?: ReactNode;
  className?: string;
}

/** Tarjeta de saldo grande, con degradé de marca, grano y emblema de ficha. */
export function BalanceHero({ value, label = 'Tu saldo', caption, actions, badge, className }: BalanceHeroProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-4xl bg-brand-gradient p-5 text-white shadow-brand sm:p-6',
      className,
    )}>
      {/* textura */}
      <div className="absolute inset-0 bg-grain opacity-60" aria-hidden />
      <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
      <div className="pointer-events-none absolute -right-6 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
      {/* emblema ficha */}
      <Icon name="chip" size={150} className="pointer-events-none absolute -bottom-10 -right-6 text-white/10" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-300" /> {label}
          </span>
          {badge}
        </div>

        <div className="mt-2 flex items-end gap-2">
          <Money value={value} showChip={false} className="!font-display text-[2.6rem] !font-extrabold leading-none tracking-tight" />
          <span className="mb-1.5 inline-flex items-center gap-1 text-sm font-bold text-white/85">
            <Icon name="chip" size={16} className="text-gold-300" /> fichas
          </span>
        </div>

        {caption && <div className="mt-1.5 text-sm text-white/80">{caption}</div>}
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
