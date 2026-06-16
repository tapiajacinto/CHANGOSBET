'use client';
import { cn } from '@/lib/cn';
import { formatChips } from '@/lib/format';

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
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-700">{label}</label>
      <div className="rounded-3xl border-2 border-brand-100 bg-white p-4 focus-within:border-brand-500 transition-colors">
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl">🪙</span>
          <input
            inputMode="numeric"
            value={value ? formatChips(value) : ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              onChange(clamp(digits ? parseInt(digits, 10) : 0));
            }}
            placeholder="0"
            className="w-full bg-transparent text-center font-display text-4xl font-extrabold text-brand-900 placeholder:text-brand-100 focus:outline-none tabular-nums"
          />
        </div>
        {max != null && (
          <p className="mt-1 text-center text-xs text-gray-400">Disponible: {formatChips(max)}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {quickAdds.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onChange(clamp(value + q))}
            className="flex-1 rounded-xl bg-brand-50 px-2 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-100"
          >
            +{formatChips(q)}
          </button>
        ))}
        {max != null && (
          <button
            type="button"
            onClick={() => onChange(max)}
            className="rounded-xl bg-gold-gradient px-3 py-2 text-sm font-extrabold text-brand-950"
          >
            MAX
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange(0)}
          className="rounded-xl px-3 py-2 text-sm font-bold text-gray-400 hover:text-brand-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
