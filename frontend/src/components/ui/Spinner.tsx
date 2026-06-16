'use client';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg text-fg">
      <div className="animate-float text-gold-500"><Icon name="chip" size={44} /></div>
      <Spinner size={30} />
      <p className="text-sm font-medium text-fg-muted">{label}</p>
    </div>
  );
}
