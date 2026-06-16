'use client';
import { cn } from '@/lib/cn';

export function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-2 border-brand-300 border-t-brand-700', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function FullScreenLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-soft">
      <div className="text-4xl animate-float">🃏</div>
      <Spinner size={32} />
      <p className="text-sm font-medium text-brand-700">{label}</p>
    </div>
  );
}
