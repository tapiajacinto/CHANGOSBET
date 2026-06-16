'use client';
import { cn } from '@/lib/cn';

interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

/** Control segmentado (pill). */
export function Tabs<T extends string>({ value, onChange, options, className }: TabsProps<T>) {
  return (
    <div className={cn('inline-flex rounded-2xl border border-brand-100 bg-brand-50/60 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-bold transition-all',
            value === o.value ? 'bg-brand-gradient text-white shadow-brand' : 'text-brand-600 hover:text-brand-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
