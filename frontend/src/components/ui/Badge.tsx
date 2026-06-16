'use client';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { UserRole, UserStatus } from '@/types/database';

type Tone = 'gray' | 'green' | 'red' | 'amber' | 'gold' | 'blue' | 'brand';

const tones: Record<Tone, string> = {
  gray:  'bg-gray-100 text-gray-600',
  green: 'bg-green-100 text-green-700',
  red:   'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  gold:  'bg-gold-100 text-gold-800',
  blue:  'bg-blue-100 text-blue-700',
  brand: 'bg-brand-100 text-brand-700',
};

export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, { tone: Tone; label: string }> = {
    pending: { tone: 'amber', label: '⏳ Pendiente' },
    active:  { tone: 'green', label: '✓ Activo' },
    blocked: { tone: 'red',   label: '⛔ Bloqueado' },
  };
  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, { tone: Tone; label: string }> = {
    player:  { tone: 'brand', label: '🎮 Jugador' },
    cashier: { tone: 'blue',  label: '💵 Cajero' },
    admin:   { tone: 'gold',  label: '👑 Socio' },
  };
  const { tone, label } = map[role];
  return <Badge tone={tone}>{label}</Badge>;
}
