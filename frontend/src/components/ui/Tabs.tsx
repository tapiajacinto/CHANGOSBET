'use client';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '@/lib/cn';

interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  className?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

/** Control segmentado con píldora deslizante. */
export function Tabs<T extends string>({
  value, onChange, options, className, size = 'md', fullWidth,
}: TabsProps<T>) {
  const layoutId = useId();
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-sm';
  return (
    <div className={cn(
      'inline-flex rounded-2xl border border-line bg-surface-2 p-1',
      fullWidth && 'flex w-full',
      className,
    )}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-colors',
              pad,
              fullWidth && 'flex-1',
              active ? 'text-white' : 'text-fg-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-${layoutId}`}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="absolute inset-0 -z-0 rounded-xl bg-brand-gradient shadow-brand"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {o.icon}{o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
