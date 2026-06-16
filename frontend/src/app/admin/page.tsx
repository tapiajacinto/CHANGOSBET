'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card, CardTitle, StatCard, Money, Avatar, Badge,
  Skeleton, SkeletonRows, EmptyState, Button, Icon,
  Sparkline, MiniBars, Donut, ProgressRing, BarTrack, SectionHeader,
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

const num = (v: number | null | undefined) => Number(v ?? 0);

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
        .limit(120),
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

  // ── Series REALES derivadas de las transacciones traídas (últimos 7 días) ──
  const series = useMemo(() => {
    const days: { key: string; label: string; volume: number; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', ''),
        volume: 0,
        count: 0,
      });
    }
    const idx = new Map(days.map((d, i) => [d.key, i]));
    for (const t of txns) {
      const key = (t.created_at ?? '').slice(0, 10);
      const i = idx.get(key);
      if (i == null) continue;
      days[i].volume += Math.abs(num(t.amount));
      days[i].count += 1;
    }
    return days;
  }, [txns]);

  const volumeSeries = series.map((d) => d.volume);
  const countSeries = series.map((d) => d.count);
  const volume7d = volumeSeries.reduce((a, b) => a + b, 0);

  // Donut de composición de flujo (cargado vs retirado) — datos reales del view.
  const loaded = num(house?.total_loaded);
  const withdrawn = num(house?.total_withdrawn);
  const flowTotal = loaded + withdrawn;

  // Game hold ratio sobre el total apostado (real).
  const bets = num(house?.total_bets);
  const gameHold = num(house?.game_hold);
  const holdRatio = bets > 0 ? Math.max(0, Math.min(1, gameHold / bets)) : 0;

  const topMax = Math.max(...topPlayers.map((p) => num(p.balance)), 1);

  return (
    <div className="space-y-6 animate-fade-up">
      <SectionHeader
        eyebrow="Posición de la casa"
        title="Economía de fichas"
        subtitle="Estado general de la economía de fichas en tiempo real."
        action={
          <Button variant="subtle" size="sm" onClick={load} loading={loading} className="shrink-0"
            leftIcon={<Icon name="refresh" size={16} />}>
            Actualizar
          </Button>
        }
      />

      {/* Stat grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard tone="gold" label="Cargado total" icon={<Icon name="plus" size={18} />}
            value={<Money value={house?.total_loaded} compact showChip={false} />} />
          <StatCard tone="brand" label="Retirado total" icon={<Icon name="minus" size={18} />}
            value={<Money value={house?.total_withdrawn} compact showChip={false} />} />
          <StatCard tone="green" label="Game hold" icon={<Icon name="trophy" size={18} />}
            value={<Money value={house?.game_hold} compact showChip={false} signed />}
            hint="Ganancia neta de la banca" />
          <StatCard
            tone={Number(house?.net_cash_position ?? 0) >= 0 ? 'default' : 'red'}
            label="Caja neta" icon={<Icon name="wallet" size={18} />}
            value={<Money value={house?.net_cash_position} compact showChip={false} signed />}
            hint="Cargado − retirado" />
          <StatCard label="Pasivo en fichas" icon={<Icon name="chip" size={18} />}
            value={<Money value={house?.outstanding_chip_liability} compact showChip={false} />}
            hint="Lo que debemos a jugadores" />
          <StatCard label="Fichas en circulación" icon={<Icon name="refresh" size={18} />}
            value={<Money value={chips} compact showChip={false} />}
            hint={`${activePlayers} jugador${activePlayers === 1 ? '' : 'es'} activo${activePlayers === 1 ? '' : 's'}`} />
        </div>
      )}

      {/* ─── Visual row: volumen diario + composición + game hold ─── */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Volumen diario (real, 7d) */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardTitle icon={<Icon name="sparkles" size={18} />} accent="win"
              title="Volumen diario" subtitle="Últimos 7 días · todas las transacciones"
              action={<Badge tone="win" dot>7d</Badge>} />
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="font-display text-3xl font-extrabold tabular-nums text-fg">
                  <Money value={volume7d} compact showChip={false} />
                </div>
                <p className="mt-0.5 text-xs text-fg-muted">Volumen acumulado de la semana</p>
              </div>
            </div>
            <div className="mt-4">
              <Sparkline data={volumeSeries} color="win" height={84} />
            </div>
            <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wide text-fg-subtle">
              {series.map((d) => <span key={d.key}>{d.label}</span>)}
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Cantidad de movimientos</p>
              <MiniBars data={countSeries} color="brand" height={40} />
            </div>
          </Card>

          {/* Composición del flujo (real) */}
          <Card>
            <CardTitle icon={<Icon name="chip" size={18} />} accent="gold"
              title="Flujo de caja" subtitle="Cargado vs. retirado" />
            <div className="flex items-center gap-5">
              <Donut
                size={132} stroke={16}
                segments={[
                  { value: loaded, color: 'win' },
                  { value: withdrawn, color: 'brand' },
                ]}
              >
                <div className="leading-none">
                  <p className="font-display text-lg font-extrabold tabular-nums text-fg">
                    {flowTotal > 0 ? `${Math.round((loaded / flowTotal) * 100)}%` : '—'}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">Cargado</p>
                </div>
              </Donut>
              <ul className="min-w-0 flex-1 space-y-3">
                <li>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-win-500" />
                    <span className="text-xs font-semibold text-fg-muted">Cargado</span>
                  </div>
                  <p className="mt-0.5 font-display text-sm font-extrabold tabular-nums text-fg">
                    <Money value={loaded} compact showChip={false} />
                  </p>
                </li>
                <li>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                    <span className="text-xs font-semibold text-fg-muted">Retirado</span>
                  </div>
                  <p className="mt-0.5 font-display text-sm font-extrabold tabular-nums text-fg">
                    <Money value={withdrawn} compact showChip={false} />
                  </p>
                </li>
              </ul>
            </div>
          </Card>

          {/* Game hold ratio (real) */}
          <Card>
            <CardTitle icon={<Icon name="trophy" size={18} />} accent="win"
              title="Margen de la banca" subtitle="Hold sobre lo apostado" />
            <div className="flex flex-col items-center justify-center gap-4 py-2">
              <ProgressRing
                value={holdRatio} size={148} stroke={14} color="win"
                label={`${(holdRatio * 100).toFixed(1)}%`}
                sublabel="game hold"
              />
              <div className="grid w-full grid-cols-2 gap-3 border-t border-line pt-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Apostado</p>
                  <p className="mt-0.5 font-display text-sm font-extrabold tabular-nums text-fg">
                    <Money value={bets} compact showChip={false} />
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Hold</p>
                  <p className="mt-0.5 font-display text-sm font-extrabold tabular-nums text-win-600 dark:text-win-400">
                    <Money value={gameHold} compact showChip={false} signed />
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent transactions */}
        <Card padded={false}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle icon={<Icon name="copy" size={18} />} title="Movimientos recientes" subtitle="Últimas transacciones de la casa" />
          </div>
          {loading ? (
            <div className="px-5 pb-5 sm:px-6"><SkeletonRows rows={6} /></div>
          ) : txns.length === 0 ? (
            <div className="px-5 pb-5 sm:px-6">
              <EmptyState icon={<Icon name="copy" size={36} />} title="Sin movimientos" subtitle="Todavía no hay transacciones registradas." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {txns.slice(0, 20).map((t) => {
                const meta = TXN_LABEL[t.type];
                const positive = t.type === 'cashier_load' || t.type === 'win' || t.type === 'float_assign';
                return (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2 sm:px-6">
                    <Badge tone={meta.tone} className="shrink-0 min-w-[68px] justify-center">{meta.label}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">
                        {t.player?.alias ?? (t.type === 'float_assign' ? 'Float a cajero' : '—')}
                      </p>
                      <p className="text-xs text-fg-muted">{timeAgo(t.created_at)}</p>
                    </div>
                    <Money
                      value={t.amount}
                      signed
                      className={cn('text-sm font-bold', positive ? 'text-win-600 dark:text-win-400' : 'text-brand-500')}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Top players */}
        <Card>
          <CardTitle icon={<Icon name="trophy" size={18} />} accent="gold" title="Top jugadores" subtitle="Mayores saldos en fichas" />
          {loading ? (
            <SkeletonRows rows={5} />
          ) : topPlayers.length === 0 ? (
            <EmptyState icon={<Icon name="users" size={36} />} title="Sin jugadores" subtitle="Todavía no hay jugadores cargados." />
          ) : (
            <ul className="space-y-2.5">
              {topPlayers.map((p, i) => {
                const top = i === 0;
                return (
                  <li key={p.id} className={cn(
                    'rounded-2xl border px-3 py-2.5 transition-colors',
                    top ? 'border-gold-500/30 bg-gold-500/5 hairline-gold' : 'border-line hover:bg-surface-2',
                  )}>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-extrabold',
                        top ? 'bg-gold-gradient text-brand-950 shadow-gold' : 'bg-surface-2 text-fg-muted',
                      )}>
                        {i + 1}
                      </span>
                      <Avatar alias={p.alias} size={32} />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-fg">{p.alias}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-extrabold tabular-nums text-fg">
                        <Icon name="chip" size={14} className="text-gold-500" /> {formatChipsCompact(p.balance)}
                      </span>
                    </div>
                    <BarTrack value={num(p.balance) / topMax} color={top ? 'gold' : 'brand'} height={5} className="mt-2" />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
