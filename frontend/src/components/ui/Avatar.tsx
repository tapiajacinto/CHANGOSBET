'use client';
import { cn } from '@/lib/cn';

function initials(alias: string) {
  const parts = alias.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

const palette = [
  'from-brand-500 to-brand-800',
  'from-rose-500 to-red-800',
  'from-amber-500 to-brand-700',
  'from-orange-500 to-rose-800',
];

export function Avatar({ alias, size = 40, className }: { alias: string; size?: number; className?: string }) {
  const idx = alias.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return (
    <div
      className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-display font-bold text-white', palette[idx], className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(alias || '?')}
    </div>
  );
}
