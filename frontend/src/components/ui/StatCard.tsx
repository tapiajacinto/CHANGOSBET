'use client';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Sparkline, MiniBars, TrendPill } from './Chart';

type Tone = 'default' | 'brand' | 'gold' | 'green' | 'win' | 'red';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  tone?: Tone;
  /** Tendencia en % → pill verde/rojo. */
  trend?: number;
  /** Mini-serie para sparkline ('line') o barras ('bars'). */
  spark?: number[];
  sparkType?: 'line' | 'bars';
  className?: string;
}

const tones: Record<Tone, string> = {
  default: 'bg-surface border-line text-fg',
  brand:   'bg-brand-gradient border-transparent text-white shadow-brand',
  gold:    'bg-gold-gradient border-transparent text-brand-950 shadow-gold',
  green:   'bg-surface border-line text-fg',
  win:     'bg-surface border-line text-fg',
  red:     'bg-surface border-line text-fg',
};

const iconChip: Record<Tone, string> = {
  default: 'bg-surface-2 text-fg-muted border border-line',
  brand:   'bg-white/15 text-white',
  gold:    'bg-brand-950/10 text-brand-950',
  green:   'bg-win-500/12 text-win-600 dark:text-win-400',
  win:     'bg-win-500/12 text-win-600 dark:text-win-400',
  red:     'bg-brand-500/12 text-brand-600 dark:text-brand-400',
};

const sparkColor: Record<Tone, string> = {
  default: 'gold', brand: 'gold', gold: 'brand', green: 'win', win: 'win', red: 'brand',
};

export function StatCard({
  label, value, icon, hint, tone = 'default', trend, spark, sparkType = 'line', className,
}: StatCardProps) {
  const inverted = tone === 'brand' || tone === 'gold';
  return (
    <div className={cn(
      'relative flex flex-col justify-between overflow-hidden rounded-3xl border p-4 shadow-card sheen-top',
      tones[tone], className,
    )}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn('text-[11px] font-bold uppercase tracking-wider',
          inverted ? 'text-white/85' : 'text-fg-subtle', tone === 'gold' && 'text-brand-950/70')}>
          {label}
        </span>
        {icon && (
          <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl', iconChip[tone])}>
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display text-2xl font-extrabold tabular-nums leading-none">{value}</div>
          {hint && (
            <p className={cn('mt-1 truncate text-xs',
              inverted ? (tone === 'gold' ? 'text-brand-950/70' : 'text-white/75') : 'text-fg-subtle')}>
              {hint}
            </p>
          )}
        </div>
        {trend != null && <TrendPill delta={trend} className="mb-0.5 shrink-0" />}
      </div>

      {spark && spark.length > 1 && (
        <div className="mt-3 -mb-1 -mx-1">
          {sparkType === 'bars'
            ? <MiniBars data={spark} color={sparkColor[tone]} height={36} />
            : <Sparkline data={spark} color={sparkColor[tone]} height={36} />}
        </div>
      )}
    </div>
  );
}
