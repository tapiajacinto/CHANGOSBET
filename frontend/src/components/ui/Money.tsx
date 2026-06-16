'use client';
import { cn } from '@/lib/cn';
import { formatChips, formatChipsCompact } from '@/lib/format';

interface MoneyProps {
  value: number | null | undefined;
  compact?: boolean;
  showChip?: boolean;
  signed?: boolean;
  className?: string;
}

/** Muestra un monto de fichas con formato es-AR y una ficha 🪙 opcional. */
export function Money({ value, compact, showChip = true, signed, className }: MoneyProps) {
  const n = Number(value ?? 0);
  const formatted = compact ? formatChipsCompact(Math.abs(n)) : formatChips(Math.abs(n));
  const sign = signed ? (n > 0 ? '+' : n < 0 ? '−' : '') : '';
  return (
    <span className={cn('tabular-nums font-semibold', className)}>
      {showChip && <span className="mr-0.5">🪙</span>}
      {sign}{formatted}
    </span>
  );
}
