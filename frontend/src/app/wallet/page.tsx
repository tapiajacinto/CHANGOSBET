'use client';
import { useEffect, useState } from 'react';
import { Protected } from '@/components/auth/Protected';
import { PlayerShell } from '@/components/player/PlayerShell';
import { Card, CardTitle, Money, StatusBadge, SkeletonRows, EmptyState, Skeleton } from '@/components/ui';
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
const TXN_ICON: Record<TxnType, string> = {
  cashier_load: '💰',
  cashier_withdraw: '🏧',
  bet: '🎲',
  win: '🏆',
  float_assign: '🏦',
  adjustment: '⚖️',
  settlement: '🧾',
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
  if (signed > 0) return 'text-green-600';
  if (signed < 0) return 'text-brand-700';
  return 'text-gray-400';
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

  return (
    <div className="space-y-5">
      {/* Balance destacado */}
      <Card padded={false} className="overflow-hidden border-transparent shadow-brand-lg">
        <div className="relative bg-brand-gradient px-6 py-7 text-white">
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Tu billetera</span>
              {profile && <StatusBadge status={profile.status} />}
            </div>
            <div className="mt-3 font-display text-5xl font-extrabold tabular-nums leading-none">
              <Money value={profile?.balance ?? 0} />
            </div>
            <p className="mt-2 text-sm opacity-80">Fichas disponibles para jugar</p>
          </div>
        </div>
      </Card>

      {/* Cajero asignado */}
      <Card>
        <CardTitle icon="🤝" title="Tu cajero" subtitle="Tu socio para cargar y retirar fichas" />
        {cashierId ? (
          cashierLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : cashier ? (
            <div className="flex items-center gap-3 rounded-2xl bg-brand-50/60 p-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-lg text-white shadow-brand">
                💵
              </div>
              <div className="min-w-0">
                <p className="truncate font-display font-bold text-brand-900">{cashier.alias}</p>
                <p className="text-sm text-gray-500">{displayPhone(cashier.phone)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No pudimos cargar los datos de tu cajero.</p>
          )
        ) : (
          <EmptyState
            icon="🙋"
            title="Sin cajero"
            subtitle="Pedí que te activen para empezar a cargar fichas."
          />
        )}
      </Card>

      {/* Historial de movimientos */}
      <Card>
        <CardTitle icon="📜" title="Movimientos" subtitle="Tu historial de cargas, retiros y jugadas" />
        {txnsLoading ? (
          <SkeletonRows rows={5} />
        ) : txns.length === 0 ? (
          <EmptyState
            icon="🪙"
            title="Todavía no hay movimientos"
            subtitle="Cuando cargues fichas o juegues, vas a verlo acá."
          />
        ) : (
          <ul className="-mx-1 divide-y divide-brand-50">
            {txns.map((t) => {
              const signed = signedAmount(t);
              return (
                <li key={t.id} className="flex items-center gap-3 px-1 py-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg">
                    {TXN_ICON[t.type]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-brand-900">
                      {TXN_LABEL[t.type]}
                    </p>
                    <p className="text-xs text-gray-400">{timeAgo(t.created_at)}</p>
                  </div>
                  <Money
                    value={signed}
                    signed
                    showChip={false}
                    className={cn('text-base', txnTone(signed))}
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
