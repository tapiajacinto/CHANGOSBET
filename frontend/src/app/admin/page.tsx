'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Card, CardTitle, StatCard, Money, Avatar, Badge,
  Skeleton, SkeletonRows, EmptyState, Button,
} from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatChipsCompact, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { HousePosition, Transaction, Profile, TxnType } from '@/types/database';
import toast from 'react-hot-toast';

const TXN_LABEL: Record<TxnType, { label: string; tone: 'green' | 'red' | 'brand' | 'amber' | 'gold' | 'blue' | 'gray' }> = {
  cashier_load:     { label: 'Carga',    tone: 'green' },
  cashier_withdraw: { label: 'Retiro',   tone: 'red'   },
  bet:              { label: 'Apuesta',  tone: 'amber' },
  win:              { label: 'Ganancia', tone: 'gold'  },
  float_assign:     { label: 'Float',    tone: 'blue'  },
  adjustment:       { label: 'Ajuste',   tone: 'brand' },
  settlement:       { label: 'Cierre',   tone: 'gray'  },
};

interface TxnWithPlayer extends Transaction {
  player: { alias: string } | null;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<HousePosition | null>(null);
  const [chips, setChips] = useState<number>(0);
  const [activePlayers, setActivePlayers] = useState<number>(0);
  const [txns, setTxns] = useState<TxnWithPlayer[]>([]);
  const [topPlayers, setTopPlayers] = useState<Pick<Profile, 'id' | 'alias' | 'balance'>[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [housRes, chipsRes, activeRes, txnRes, topRes] = await Promise.all([
      supabase.from('v_house_position').select('*').single(),
      supabase.from('v_chips_in_circulation').select('chips_in_circulation').single(),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'player').eq('status', 'active'),
      supabase
        .from('transactions')
        .select('*, player:profiles!transactions_player_id_fkey(alias)')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('profiles')
        .select('id, alias, balance')
        .eq('role', 'player')
        .order('balance', { ascending: false })
        .limit(8),
    ]);

    if (housRes.error) toast.error(housRes.error.message);
    setHouse((housRes.data as HousePosition) ?? null);
    setChips(Number(chipsRes.data?.chips_in_circulation ?? 0));
    setActivePlayers(activeRes.count ?? 0);
    setTxns((txnRes.data as TxnWithPlayer[]) ?? []);
    setTopPlayers((topRes.data as Pick<Profile, 'id' | 'alias' | 'balance'>[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-brand-900">Posición de la casa</h2>
          <p className="text-sm text-gray-400">Estado general de la economía de fichas en tiempo real.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} loading={loading} className="shrink-0">↻ Actualizar</Button>
      </div>

      {/* Stat grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard tone="gold" label="Cargado total" icon="⬆️"
            value={<Money value={house?.total_loaded} compact showChip={false} />} />
          <StatCard tone="brand" label="Retirado total" icon="⬇️"
            value={<Money value={house?.total_withdrawn} compact showChip={false} />} />
          <StatCard tone="green" label="Game hold" icon="🎯"
            value={<Money value={house?.game_hold} compact showChip={false} signed />}
            hint="Ganancia neta de la banca" />
          <StatCard
            tone={Number(house?.net_cash_position ?? 0) >= 0 ? 'default' : 'red'}
            label="Caja neta" icon="💰"
            value={<Money value={house?.net_cash_position} compact showChip={false} signed />}
            hint="Cargado − retirado" />
          <StatCard label="Pasivo en fichas" icon="🪙"
            value={<Money value={house?.outstanding_chip_liability} compact showChip={false} />}
            hint="Lo que debemos a jugadores" />
          <StatCard label="Fichas en circulación" icon="🔄"
            value={<Money value={chips} compact showChip={false} />}
            hint={`${activePlayers} jugador${activePlayers === 1 ? '' : 'es'} activo${activePlayers === 1 ? '' : 's'}`} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent transactions */}
        <Card>
          <CardTitle icon="🧾" title="Movimientos recientes" subtitle="Últimas 20 transacciones de la casa" />
          {loading ? (
            <SkeletonRows rows={6} />
          ) : txns.length === 0 ? (
            <EmptyState icon="🧾" title="Sin movimientos" subtitle="Todavía no hay transacciones registradas." />
          ) : (
            <ul className="divide-y divide-brand-50">
              {txns.map((t) => {
                const meta = TXN_LABEL[t.type];
                const positive = t.type === 'cashier_load' || t.type === 'win' || t.type === 'float_assign';
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-900">
                        {t.player?.alias ?? (t.type === 'float_assign' ? 'Float a cajero' : '—')}
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(t.created_at)}</p>
                    </div>
                    <Money
                      value={t.amount}
                      signed
                      className={cn('text-sm', positive ? 'text-green-600' : 'text-red-600')}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Top players */}
        <Card>
          <CardTitle icon="🏆" title="Top jugadores" subtitle="Mayores saldos en fichas" />
          {loading ? (
            <SkeletonRows rows={5} />
          ) : topPlayers.length === 0 ? (
            <EmptyState icon="🎮" title="Sin jugadores" subtitle="Todavía no hay jugadores cargados." />
          ) : (
            <ul className="space-y-2">
              {topPlayers.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-brand-50 px-3 py-2">
                  <span className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-extrabold',
                    i === 0 ? 'bg-gold-gradient text-brand-950' : 'bg-brand-50 text-brand-600',
                  )}>
                    {i + 1}
                  </span>
                  <Avatar alias={p.alias} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-brand-900">{p.alias}</span>
                  <span className="text-sm font-extrabold tabular-nums text-brand-700">
                    🪙 {formatChipsCompact(p.balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
