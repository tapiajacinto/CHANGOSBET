'use client';
import { ReactNode } from 'react';

export function EmptyState({ icon = '🃏', title, subtitle, action }: {
  icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-brand-100 bg-white/60 px-6 py-12 text-center">
      <div className="text-4xl opacity-70">{icon}</div>
      <p className="font-display font-bold text-brand-900">{title}</p>
      {subtitle && <p className="max-w-xs text-sm text-gray-400">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
