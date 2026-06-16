'use client';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, IconName } from './Icon';
import type { UserRole, UserStatus } from '@/types/database';

type Tone = 'gray' | 'green' | 'win' | 'red' | 'amber' | 'gold' | 'blue' | 'brand';

const tones: Record<Tone, string> = {
  gray:  'bg-fg/10 text-fg-muted',
  green: 'bg-win-500/15 text-win-600 dark:text-win-400',
  win:   'bg-win-500/15 text-win-600 dark:text-win-400',
  red:   'bg-brand-500/15 text-brand-600 dark:text-brand-300',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  gold:  'bg-gold-500/15 text-gold-700 dark:text-gold-300',
  blue:  'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  brand: 'bg-brand-500/15 text-brand-600 dark:text-brand-300',
};

const dotColor: Record<Tone, string> = {
  gray: 'bg-fg-subtle', green: 'bg-win-500', win: 'bg-win-500', red: 'bg-brand-500',
  amber: 'bg-amber-500', gold: 'bg-gold-500', blue: 'bg-blue-500', brand: 'bg-brand-500',
};

export function Badge({ tone = 'gray', dot, children, className }: {
  tone?: Tone; dot?: boolean; children: ReactNode; className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', tones[tone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor[tone])} />}
      {children}
    </span>
  );
}

/** "EN VIVO" con punto que late. */
export function LiveDot({ label = 'En vivo', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-win-500/15 px-2.5 py-1 text-xs font-bold text-win-600 dark:text-win-400', className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-win-500 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-win-500" />
      </span>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, { tone: Tone; label: string; icon: IconName }> = {
    pending: { tone: 'amber', label: 'Pendiente', icon: 'alert' },
    active:  { tone: 'win',   label: 'Activo',    icon: 'check' },
    blocked: { tone: 'red',   label: 'Bloqueado', icon: 'x' },
  };
  const { tone, label, icon } = map[status];
  return <Badge tone={tone}><Icon name={icon} size={12} /> {label}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, { tone: Tone; label: string; icon: IconName }> = {
    player:  { tone: 'brand', label: 'Jugador', icon: 'user' },
    cashier: { tone: 'blue',  label: 'Cajero',  icon: 'wallet' },
    admin:   { tone: 'gold',  label: 'Socio',   icon: 'shield' },
  };
  const { tone, label, icon } = map[role];
  return <Badge tone={tone}><Icon name={icon} size={12} /> {label}</Badge>;
}
