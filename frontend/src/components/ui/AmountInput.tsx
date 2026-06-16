'use client';
import { cn } from '@/lib/cn';
import { formatChips } from '@/lib/format';
import { Icon } from './Icon';

interface AmountInputProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  quickAdds?: number[];
  label?: string;
  className?: string;
}

const DEFAULT_QUICK = [1000, 5000, 10000, 50000];

/** Input grande para montos de fichas, con chips de suma rápida y "MAX". */
export function AmountInput({
  value, onChange, max, quickAdds = DEFAULT_QUICK, label = 'Monto', className,
}: AmountInputProps) {
  const clamp = (v: number) => Math.max(0, max != null ? Math.min(v, max) : v);
  return (
    <div className={cn('w-full', className)}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-fg-muted">{label}</label>
      <div className="rounded-3xl border border-line-2 bg-surface p-4 transition-all focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15">
        <div className="flex items-center justify-center gap-2">
          <Icon name="chip" size={28} className="text-gold-500" />
          <input
            inputMode="numeric"
            value={value ? formatChips(value) : ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              onChange(clamp(digits ? parseInt(digits, 10) : 0));
            }}
            placeholder="0"
            className="w-full bg-transparent text-center font-display text-4xl font-extrabold text-fg placeholder:text-fg-subtle focus:outline-none tabular-nums"
          />
        </div>
        {max != null && <p className="mt-1 text-center text-xs text-fg-subtle">Disponible: {formatChips(max)}</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {quickAdds.map((q) => (
          <button key={q} type="button" onClick={() => onChange(clamp(value + q))}
            className="flex-1 rounded-xl border border-line bg-surface-2 px-2 py-2 text-sm font-bold text-fg transition-colors hover:border-brand-400/60 hover:bg-surface-3 hover:text-brand-500">
            +{formatChips(q)}
          </button>
        ))}
        {max != null && (
          <button type="button" onClick={() => onChange(max)} className="rounded-xl bg-gold-gradient px-3 py-2 text-sm font-extrabold text-brand-950">MAX</button>
        )}
        <button type="button" onClick={() => onChange(0)} className="rounded-xl px-3 py-2 text-fg-subtle hover:text-brand-600"><Icon name="x" size={16} /></button>
      </div>
    </div>
  );
}
