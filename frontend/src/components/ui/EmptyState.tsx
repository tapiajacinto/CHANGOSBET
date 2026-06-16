'use client';
import { ReactNode } from 'react';
import { Icon } from './Icon';

export function EmptyState({ icon, title, subtitle, action }: {
  icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line bg-surface-2/40 px-6 py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-surface text-fg-subtle shadow-card">
        {icon ?? <Icon name="cards" size={30} />}
      </div>
      <div>
        <p className="font-display font-bold text-fg">{title}</p>
        {subtitle && <p className="mx-auto mt-1 max-w-xs text-sm text-fg-subtle">{subtitle}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
