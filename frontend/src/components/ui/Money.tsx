'use client';
import { cn } from '@/lib/cn';
import { formatChips, formatChipsCompact } from '@/lib/format';
import { Icon } from './Icon';

interface MoneyProps {
  value: number | null | undefined;
  compact?: boolean;
  showChip?: boolean;
  signed?: boolean;
  className?: string;
}

/** Muestra un monto de fichas con formato es-AR y una ficha (SVG) opcional. */
export function Money({ value, compact, showChip = true, signed, className }: MoneyProps) {
  const n = Number(value ?? 0);
  const formatted = compact ? formatChipsCompact(Math.abs(n)) : formatChips(Math.abs(n));
  const sign = signed ? (n > 0 ? '+' : n < 0 ? '−' : '') : '';
  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums font-semibold', className)}>
      {showChip && <Icon name="chip" size={14} className="text-gold-500" />}
      <span>{sign}{formatted}</span>
    </span>
  );
}
