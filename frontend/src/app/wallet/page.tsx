'use client';
import { useEffect, useState } from 'react';
import { Protected } from '@/components/auth/Protected';
import { PlayerShell } from '@/components/player/PlayerShell';
import { Card, CardTitle, BalanceHero, StatCard, Money, StatusBadge, SkeletonRows, EmptyState, Skeleton, Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { timeAgo, displayPhone } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Transaction, TxnType, Profile, Json } from '@/types/database';

/** Etiqueta es-AR por tipo de transacción. */
const TXN_LABEL: Record<TxnType, string> = {
  cashier_load: 'Carga',
  cashier_withdraw: 'Retiro',
  bet: 'Apuesta',
  win: 'Ganancia',
  float_assign: 'Float',
  adjustment: 'Ajuste',
  settlement: 'Cierre',
};

/** Ícono es-AR por tipo de transacción. */
const TXN_ICON: Record<TxnType, IconName> = {
  cashier_load: 'coins',
  cashier_withdraw: 'wallet',
  bet: 'dice',
  win: 'trophy',
  float_assign: 'wallet',
  adjustment: 'refresh',
  settlement: 'copy',
};

/**
 * Monto con signo según el tipo, desde la perspectiva del jugador.
 * cashier_load / win => positivos. cashier_withdraw / bet => negativos.
 * adjustment => según meta.signed_amount; settlement / otros => por el signo del amount.
 */
function signedAmount(t: Transaction): number {
  const amt = Math.abs(Number(t.amount ?? 0));
  switch (t.type) {
    case 'cashier_load':
    case 'win':
      return amt;
    case 'cashier_withdraw':
    case 'bet':
      return -amt;
    case 'adjustment': {
      const meta = (t.meta ?? {}) as Record<string, Json>;
      const signed = Number(meta.signed_amount);
      if (Number.isFinite(signed)) return signed;
      return Number(t.amount ?? 0);
    }
    default:
      return Number(t.amount ?? 0);
  }
}

function txnTone(signed: number): string {
  if (signed > 0) return 'text-win-600 dark:text-win-400';
  if (signed < 0) return 'text-brand-500';
  return 'text-fg-muted';
}

export default function WalletPage() {
  return (
    <Protected role={['player', 'cashier', 'admin']}>
      <PlayerShell>
        <WalletContent />
      </PlayerShell>
    </Protected>
  );
}

function WalletContent() {
  const { profile } = useAuth();
  const [cashier, setCashier] = useState<Pick<Profile, 'alias' | 'phone'> | null>(null);
  const [cashierLoading, setCashierLoading] = useState(false);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(true);

  const uid = profile?.id ?? null;
  const cashierId = profile?.cashier_id ?? null;

  // Cajero asignado.
  useEffect(() => {
    if (!cashierId) {
      setCashier(null);
      return;
    }
    let mounted = true;
    setCashierLoading(true);
    supabase
      .from('profiles')
      .select('alias, phone')
      .eq('id', cashierId)
      .single()
      .then(({ data }) => {
        if (!mounted) return;
        setCashier((data as Pick<Profile, 'alias' | 'phone'>) ?? null);
        setCashierLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [cashierId]);

  // Historial de movimientos.
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    setTxnsLoading(true);
    supabase
      .from('transactions')
      .select('*')
      .eq('player_id', uid)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!mounted) return;
        setTxns((data as Transaction[]) ?? []);
        setTxnsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [uid]);

  // Totales reales para las métricas (derivados del historial cargado).
  const totalIn = txns.reduce((acc, t) => {
    const s = signedAmount(t);
    return s > 0 ? acc + s : acc;
  }, 0);
  const totalOut = txns.reduce((acc, t) => {
    const s = signedAmount(t);
    return s < 0 ? acc + Math.abs(s) : acc;
  }, 0);

  return (
    <div className="ambient animate-fade-up space-y-5">
      {/* Balance destacado */}
      <BalanceHero
        label="Tu billetera"
        value={profile?.balance ?? 0}
        caption="Fichas disponibles para jugar"
        badge={profile && <StatusBadge status={profile.status} />}
      />

      {/* Métricas reales del historial */}
      {!txnsLoading && txns.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total ingresado"
            value={<Money value={totalIn} showChip={false} />}
            icon={<Icon name="plus" size={18} />}
            tone="win"
          />
          <StatCard
            label="Total salido"
            value={<Money value={totalOut} showChip={false} />}
            icon={<Icon name="minus" size={18} />}
            tone="red"
          />
        </div>
      )}

      {/* Cajero asignado */}
      <Card>
        <CardTitle icon={<Icon name="users" size={20} />} title="Tu cajero" subtitle="Tu socio para cargar y retirar fichas" />
        {cashierId ? (
          cashierLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : cashier ? (
            <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
                <Icon name="wallet" size={22} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display font-bold text-fg">{cashier.alias}</p>
                <p className="text-sm text-fg-muted">{displayPhone(cashier.phone)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-fg-muted">No pudimos cargar los datos de tu cajero.</p>
          )
        ) : (
          <EmptyState
            icon={<Icon name="user" size={36} />}
            title="Sin cajero"
            subtitle="Pedí que te activen para empezar a cargar fichas."
          />
        )}
      </Card>

      {/* Historial de movimientos */}
      <Card>
        <CardTitle icon={<Icon name="coins" size={20} />} title="Movimientos" subtitle="Tu historial de cargas, retiros y jugadas" />
        {txnsLoading ? (
          <SkeletonRows rows={5} />
        ) : txns.length === 0 ? (
          <EmptyState
            icon={<Icon name="chip" size={36} />}
            title="Todavía no hay movimientos"
            subtitle="Cuando cargues fichas o juegues, vas a verlo acá."
          />
        ) : (
          <ul className="space-y-1">
            {txns.map((t) => {
              const signed = signedAmount(t);
              const pos = signed > 0;
              const neg = signed < 0;
              return (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-surface-2"
                >
                  <div
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-transform group-hover:scale-105',
                      pos
                        ? 'bg-win-500/12 text-win-600 dark:text-win-400'
                        : neg
                          ? 'bg-brand-500/12 text-brand-600 dark:text-brand-400'
                          : 'bg-surface-2 text-fg-muted',
                    )}
                  >
                    <Icon name={TXN_ICON[t.type]} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-fg">
                      {TXN_LABEL[t.type]}
                    </p>
                    <p className="text-xs text-fg-muted">{timeAgo(t.created_at)}</p>
                  </div>
                  <Money
                    value={signed}
                    signed
                    showChip={false}
                    className={cn('text-base font-bold tabular-nums', txnTone(signed))}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
