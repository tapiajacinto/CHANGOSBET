'use client';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  tone?: 'default' | 'brand' | 'gold' | 'green' | 'red';
  className?: string;
}

const tones: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-white border-brand-100',
  brand:   'bg-brand-gradient border-transparent text-white',
  gold:    'bg-gold-gradient border-transparent text-brand-950',
  green:   'bg-green-50 border-green-100',
  red:     'bg-red-50 border-red-100',
};

export function StatCard({ label, value, icon, hint, tone = 'default', className }: StatCardProps) {
  const inverted = tone === 'brand' || tone === 'gold';
  return (
    <div className={cn('rounded-3xl border p-4 shadow-card', tones[tone], className)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-semibold uppercase tracking-wider', inverted ? 'opacity-80' : 'text-gray-400')}>
          {label}
        </span>
        {icon && <span className="text-lg opacity-90">{icon}</span>}
      </div>
      <div className={cn('mt-1.5 font-display text-2xl font-extrabold tabular-nums', !inverted && 'text-brand-900')}>
        {value}
      </div>
      {hint && <p className={cn('mt-0.5 text-xs', inverted ? 'opacity-75' : 'text-gray-400')}>{hint}</p>}
    </div>
  );
}
