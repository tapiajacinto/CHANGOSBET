'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Avatar, Badge, Button, Card, CardTitle, EmptyState, Input, Money,
  Skeleton, SkeletonRows, StatCard, StatusBadge,
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

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-900">Mi caja</h1>
          <p className="text-sm text-gray-400">Tu float, tus jugadores y el movimiento del día.</p>
        </div>
        <Button variant="subtle" size="sm" onClick={loadAll} leftIcon={<span>↻</span>}>
          Actualizar
        </Button>
      </header>

      {/* ─── STATS ─── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            tone="brand"
            label="Float disponible"
            icon="🏦"
            value={<Money value={account?.float_balance ?? 0} />}
            hint="Fichas que podés cargar"
          />
          <StatCard
            tone="gold"
            label="Efectivo en mano"
            icon="💵"
            value={<Money value={account?.cash_on_hand ?? 0} showChip={false} />}
            hint="Plata física en tu poder"
          />
          <StatCard
            tone="green"
            label="Cargado hoy"
            icon="⬆️"
            value={<Money value={today?.loaded ?? 0} />}
            hint="Total de cargas del día"
          />
          <StatCard
            tone="red"
            label="Retirado hoy"
            icon="⬇️"
            value={<Money value={today?.withdrawn ?? 0} />}
            hint="Total de pagos del día"
          />
        </div>
      )}

      {/* ─── ACTIVAR JUGADOR ─── */}
      <Card>
        <CardTitle
          icon="✨"
          title="Activar jugador"
          subtitle="Buscá un jugador pendiente por teléfono o alias y reclamálo"
        />
        <Input
          leftIcon={<span>🔎</span>}
          placeholder="Teléfono o alias…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-4">
          {!query.trim() ? (
            <p className="px-1 text-sm text-gray-400">Escribí para buscar jugadores pendientes.</p>
          ) : searching ? (
            <SkeletonRows rows={2} />
          ) : pending.length === 0 ? (
            <EmptyState icon="🔍" title="Sin resultados" subtitle="No hay jugadores pendientes con ese dato." />
          ) : (
            <ul className="space-y-2.5">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3"
                >
                  <Avatar alias={p.alias} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-brand-900">{p.alias}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="truncate text-xs text-gray-400">{displayPhone(p.phone)}</p>
                  </div>
                  <Button
                    variant="gold"
                    size="sm"
                    loading={activatingId === p.id}
                    onClick={() => handleActivate(p)}
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
          icon="🎮"
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
            icon="🫥"
            title="Todavía no tenés jugadores"
            subtitle="Activá un jugador pendiente para sumarlo a tu cartera."
          />
        ) : (
          <ul className="space-y-2.5">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 transition-colors hover:bg-brand-50/40"
              >
                <Avatar alias={p.alias} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold text-brand-900">{p.alias}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="truncate text-xs text-gray-400">
                    {displayPhone(p.phone)} · alta {timeAgo(p.created_at)}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400">Saldo</p>
                  <Money value={p.balance} className="text-brand-900" />
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Link href={`/cajero/cargar?player=${p.id}`}>
                    <Button variant="primary" size="sm">Cargar</Button>
                  </Link>
                  <Link href={`/cajero/retirar?player=${p.id}`}>
                    <Button variant="outline" size="sm">Retirar</Button>
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
