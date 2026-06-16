'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Avatar, Badge, Button, Card, CardTitle, Donut, EmptyState, Icon, Input, Money,
  SectionHeader, Skeleton, SkeletonRows, StatCard, StatusBadge,
} from '@/components/ui';
import { displayPhone, timeAgo } from '@/lib/format';
import type { CashierAccount, Profile, Transaction } from '@/types/database';

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function CajeroHomePage() {
  const { user } = useAuth();
  const cashierId = user?.id;

  const [account, setAccount] = useState<CashierAccount | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [today, setToday] = useState<{ loaded: number; withdrawn: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Activar jugador
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!cashierId) return;
    setLoading(true);
    const [acc, mine, txns] = await Promise.all([
      supabase.from('cashier_accounts').select('*').eq('cashier_id', cashierId).single(),
      supabase.from('profiles').select('*').eq('cashier_id', cashierId).order('alias'),
      supabase
        .from('transactions')
        .select('type, amount')
        .eq('cashier_id', cashierId)
        .gte('created_at', startOfTodayISO())
        .in('type', ['cashier_load', 'cashier_withdraw']),
    ]);

    if (acc.data) setAccount(acc.data as CashierAccount);
    if (mine.data) setPlayers(mine.data as Profile[]);

    const rows = (txns.data ?? []) as Pick<Transaction, 'type' | 'amount'>[];
    setToday({
      loaded: rows.filter((r) => r.type === 'cashier_load').reduce((s, r) => s + Number(r.amount), 0),
      withdrawn: rows.filter((r) => r.type === 'cashier_withdraw').reduce((s, r) => s + Number(r.amount), 0),
    });
    setLoading(false);
  }, [cashierId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Buscar jugadores pendientes para activar
  useEffect(() => {
    const term = query.trim();
    if (!term) { setPending([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .or(`alias.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(15);
      if (!cancelled) {
        setPending((data ?? []) as Profile[]);
        setSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  const handleActivate = async (p: Profile) => {
    setActivatingId(p.id);
    const { error } = await supabase.rpc('activate_player', { p_player: p.id });
    setActivatingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${p.alias} activado y reclamado`);
    setPending((prev) => prev.filter((x) => x.id !== p.id));
    setQuery('');
    loadAll();
  };

  const totalPlayerChips = useMemo(
    () => players.reduce((s, p) => s + Number(p.balance), 0),
    [players],
  );

  const floatBalance = Number(account?.float_balance ?? 0);
  const cashOnHand = Number(account?.cash_on_hand ?? 0);
  const liquidity = floatBalance + cashOnHand;
  const loadedToday = today?.loaded ?? 0;
  const withdrawnToday = today?.withdrawn ?? 0;
  const dayVolume = loadedToday + withdrawnToday;
  const netToday = loadedToday - withdrawnToday;

  return (
    <div className="ambient space-y-6 animate-fade-up">
      <SectionHeader
        eyebrow="Mi caja"
        title="Tu caja de hoy"
        subtitle="Tu float, tus jugadores y el movimiento del día."
        action={
          <Button variant="subtle" size="sm" onClick={loadAll} leftIcon={<Icon name="refresh" size={16} />}>
            Actualizar
          </Button>
        }
      />

      {/* ─── STATS ─── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            tone="brand"
            label="Float disponible"
            icon={<Icon name="chip" size={18} />}
            value={<Money value={floatBalance} />}
            hint="Fichas que podés cargar"
          />
          <StatCard
            tone="gold"
            label="Efectivo en mano"
            icon={<Icon name="wallet" size={18} />}
            value={<Money value={cashOnHand} showChip={false} />}
            hint="Plata física en tu poder"
          />
          <StatCard
            tone="green"
            label="Cargado hoy"
            icon={<Icon name="plus" size={18} />}
            value={<Money value={loadedToday} />}
            hint="Total de cargas del día"
          />
          <StatCard
            tone="red"
            label="Retirado hoy"
            icon={<Icon name="minus" size={18} />}
            value={<Money value={withdrawnToday} />}
            hint="Total de pagos del día"
          />
        </div>
      )}

      {/* ─── LIQUIDEZ + MOVIMIENTO DEL DÍA (datos reales) ─── */}
      {!loading && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Composición de tu liquidez: float vs efectivo */}
          <Card accent="gold">
            <CardTitle
              icon={<Icon name="coins" size={20} />}
              title="Composición de tu caja"
              subtitle="Fichas (float) frente al efectivo físico"
              accent="gold"
            />
            <div className="flex items-center gap-5">
              <Donut
                size={104}
                stroke={13}
                segments={[
                  { value: floatBalance, color: 'brand' },
                  { value: cashOnHand, color: 'gold' },
                ]}
              >
                <div className="leading-none">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Total</div>
                  <div className="font-display text-sm font-extrabold text-fg">
                    <Money value={liquidity} compact />
                  </div>
                </div>
              </Donut>
              <ul className="min-w-0 flex-1 space-y-2.5">
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-fg-muted">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Float (fichas)
                  </span>
                  <Money value={floatBalance} compact className="font-bold text-fg" />
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-fg-muted">
                    <span className="h-2.5 w-2.5 rounded-full bg-gold-500" /> Efectivo en mano
                  </span>
                  <Money value={cashOnHand} compact showChip={false} className="font-bold text-fg" />
                </li>
              </ul>
            </div>
          </Card>

          {/* Movimiento del día: cargas vs retiros */}
          <Card>
            <CardTitle
              icon={<Icon name="refresh" size={20} />}
              title="Movimiento del día"
              subtitle="Cargas y retiros procesados hoy"
              accent="win"
            />
            {dayVolume === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/50 px-4 py-5 text-sm text-fg-muted">
                <Icon name="calendar" size={18} className="text-fg-subtle" />
                Todavía no registraste movimientos hoy.
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Donut
                  size={104}
                  stroke={13}
                  segments={[
                    { value: loadedToday, color: 'win' },
                    { value: withdrawnToday, color: 'brand' },
                  ]}
                >
                  <div className="leading-none">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Neto</div>
                    <div className={`font-display text-sm font-extrabold ${netToday >= 0 ? 'text-win-600 dark:text-win-400' : 'text-fg'}`}>
                      <Money value={Math.abs(netToday)} compact />
                    </div>
                  </div>
                </Donut>
                <ul className="min-w-0 flex-1 space-y-2.5">
                  <li className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-fg-muted">
                      <span className="h-2.5 w-2.5 rounded-full bg-win-500" /> Cargado
                    </span>
                    <Money value={loadedToday} compact className="font-bold text-win-600 dark:text-win-400" />
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-fg-muted">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Retirado
                    </span>
                    <Money value={withdrawnToday} compact className="font-bold text-brand-500" />
                  </li>
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── ACTIVAR JUGADOR ─── */}
      <Card accent="brand">
        <CardTitle
          icon={<Icon name="sparkles" size={20} />}
          title="Activar jugador"
          subtitle="Buscá un jugador pendiente por teléfono o alias y reclamálo"
          accent="brand"
        />
        <Input
          leftIcon={<Icon name="search" size={18} />}
          placeholder="Teléfono o alias…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-4">
          {!query.trim() ? (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface-2/40 px-4 py-4 text-sm text-fg-muted">
              <Icon name="search" size={18} className="shrink-0 text-fg-subtle" />
              Escribí un teléfono o alias para buscar jugadores pendientes.
            </div>
          ) : searching ? (
            <SkeletonRows rows={2} />
          ) : pending.length === 0 ? (
            <EmptyState icon={<Icon name="search" size={36} />} title="Sin resultados" subtitle="No hay jugadores pendientes con ese dato." />
          ) : (
            <ul className="space-y-2.5">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/50 p-3 transition-colors hover:bg-surface-2 animate-fade-in"
                >
                  <Avatar alias={p.alias} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-fg">{p.alias}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="truncate text-xs text-fg-muted">{displayPhone(p.phone)}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={activatingId === p.id}
                    onClick={() => handleActivate(p)}
                    leftIcon={<Icon name="check" size={15} />}
                  >
                    Activar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* ─── MIS JUGADORES ─── */}
      <Card>
        <CardTitle
          icon={<Icon name="users" size={20} />}
          title="Mis jugadores"
          subtitle={loading ? undefined : `${players.length} en cartera`}
          action={
            !loading && players.length > 0 ? (
              <Badge tone="brand">
                <Money value={totalPlayerChips} compact /> en fichas
              </Badge>
            ) : undefined
          }
        />
        {loading ? (
          <SkeletonRows rows={4} />
        ) : players.length === 0 ? (
          <EmptyState
            icon={<Icon name="users" size={36} />}
            title="Todavía no tenés jugadores"
            subtitle="Activá un jugador pendiente para sumarlo a tu cartera."
          />
        ) : (
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5 transition-all hover:-translate-y-0.5 hover:border-line-2 hover:bg-surface-2 hover:shadow-card"
              >
                <div className="flex items-center gap-3">
                  <Avatar alias={p.alias} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-fg">{p.alias}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="truncate text-xs text-fg-muted">
                      {displayPhone(p.phone)} · alta {timeAgo(p.created_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Saldo</p>
                    <Money value={p.balance} compact className="font-display font-extrabold text-fg" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/cajero/cargar?player=${p.id}`} className="flex-1">
                    <Button variant="primary" size="sm" fullWidth leftIcon={<Icon name="plus" size={15} />}>Cargar</Button>
                  </Link>
                  <Link href={`/cajero/retirar?player=${p.id}`} className="flex-1">
                    <Button variant="outline" size="sm" fullWidth leftIcon={<Icon name="minus" size={15} />}>Retirar</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
