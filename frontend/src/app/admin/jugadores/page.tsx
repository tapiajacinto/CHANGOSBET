'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Card, Money, Avatar, Badge, StatusBadge, RoleBadge, Button,
  Modal, ConfirmDialog, AmountInput, Input, Skeleton, SkeletonRows, EmptyState, Icon,
  StatCard, SectionHeader,
} from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { displayPhone, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Profile, Transaction, TxnType } from '@/types/database';
import toast from 'react-hot-toast';

const TXN_META: Record<TxnType, { label: string; tone: 'green' | 'red' | 'brand' | 'amber' | 'gold' | 'blue' | 'gray' }> = {
  cashier_load:     { label: 'Carga',    tone: 'green' },
  cashier_withdraw: { label: 'Retiro',   tone: 'red'   },
  bet:              { label: 'Apuesta',  tone: 'amber' },
  win:              { label: 'Ganancia', tone: 'gold'  },
  float_assign:     { label: 'Float',    tone: 'blue'  },
  adjustment:       { label: 'Ajuste',   tone: 'brand' },
  settlement:       { label: 'Cierre',   tone: 'gray'  },
};

interface PlayerRow extends Profile {
  cashier: { alias: string } | null;
}

export default function AdminJugadoresPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    let req = supabase
      .from('profiles')
      .select('*, cashier:profiles!profiles_cashier_id_fkey(alias)')
      .order('created_at', { ascending: false })
      .limit(100);
    const term = (q ?? '').trim();
    if (term) req = req.or(`phone.ilike.%${term}%,alias.ilike.%${term}%`);
    const { data, error } = await req;
    if (error) toast.error(error.message);
    // El embed self-referencial puede venir como array; lo normalizamos a objeto.
    const normalized: PlayerRow[] = (data ?? []).map((row) => {
      const { cashier, ...rest } = row as Profile & { cashier: { alias: string } | { alias: string }[] | null };
      const c = Array.isArray(cashier) ? cashier[0] ?? null : cashier;
      return { ...(rest as Profile), cashier: c };
    });
    setRows(normalized);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Status toggle ───
  const [statusTarget, setStatusTarget] = useState<Profile | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const blocking = statusTarget?.status !== 'blocked';

  const submitStatus = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    const next = blocking ? 'blocked' : 'active';
    const { error } = await supabase.rpc('admin_set_status', { p_user: statusTarget.id, p_status: next });
    setStatusLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(blocking ? 'Usuario bloqueado' : 'Usuario reactivado');
    setStatusTarget(null);
    load(query);
  };

  // ─── Manual balance adjustment ───
  const [adjTarget, setAdjTarget] = useState<Profile | null>(null);
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjRemove, setAdjRemove] = useState(false);
  const [adjReason, setAdjReason] = useState('');
  const [adjLoading, setAdjLoading] = useState(false);

  const submitAdjust = async () => {
    if (!adjTarget || adjAmount <= 0) { toast.error('Ingresá un monto'); return; }
    if (!adjReason.trim()) { toast.error('Ingresá un motivo'); return; }
    setAdjLoading(true);
    const delta = adjRemove ? -adjAmount : adjAmount;
    const { error } = await supabase.rpc('admin_adjust_balance', {
      p_player: adjTarget.id, p_delta: delta, p_reason: adjReason.trim(),
    });
    setAdjLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Saldo ajustado');
    setAdjTarget(null); setAdjAmount(0); setAdjReason(''); setAdjRemove(false);
    load(query);
  };

  // ─── History ───
  const [histTarget, setHistTarget] = useState<Profile | null>(null);
  const [hist, setHist] = useState<Transaction[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  const openHistory = async (p: Profile) => {
    setHistTarget(p); setHist([]); setHistLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('player_id', p.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setHistLoading(false);
    if (error) { toast.error(error.message); return; }
    setHist((data as Transaction[]) ?? []);
  };

  // ─── Resumen real (sobre el set cargado) ───
  const totalBalance = rows.reduce((s, p) => s + Number(p.balance ?? 0), 0);
  const activeCount = rows.filter((p) => p.status === 'active').length;
  const blockedCount = rows.filter((p) => p.status === 'blocked').length;

  return (
    <div className="space-y-6 animate-fade-up">
      <SectionHeader
        eyebrow="Administración"
        title="Jugadores"
        subtitle="Buscá, ajustá saldos y administrá usuarios."
      />

      {/* Resumen */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Usuarios" icon={<Icon name="users" size={18} />} value={rows.length} hint="En la vista actual" />
          <StatCard tone="green" label="Activos" icon={<Icon name="check" size={18} />} value={activeCount} />
          <StatCard tone="red" label="Bloqueados" icon={<Icon name="x" size={18} />} value={blockedCount} />
          <StatCard tone="gold" label="Saldo total" icon={<Icon name="chip" size={18} />}
            value={<Money value={totalBalance} compact showChip={false} />} />
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input
          label="Buscar"
          placeholder="Teléfono o alias"
          leftIcon={<Icon name="search" size={18} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(query)}
          className="flex-1"
        />
        <Button onClick={() => load(query)} loading={loading} className="shrink-0" leftIcon={<Icon name="search" size={16} />}>Buscar</Button>
        {query && (
          <Button variant="ghost" onClick={() => { setQuery(''); load(); }} className="shrink-0">Limpiar</Button>
        )}
      </div>

      {/* Table / list */}
      {loading ? (
        <Card><SkeletonRows rows={6} /></Card>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Icon name="search" size={36} />} title="Sin resultados" subtitle="Probá con otro alias o teléfono." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-3 py-3">Teléfono</th>
                  <th className="px-3 py-3">Rol</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3 text-right">Saldo</th>
                  <th className="px-3 py-3">Cajero</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar alias={p.alias} size={32} />
                        <span className="font-bold text-fg">{p.alias}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-fg-muted">{displayPhone(p.phone)}</td>
                    <td className="px-3 py-3"><RoleBadge role={p.role} /></td>
                    <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-3 text-right"><Money value={p.balance} className="text-fg" /></td>
                    <td className="px-3 py-3 text-fg-muted">{p.cashier?.alias ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => openHistory(p)} aria-label="Historial"><Icon name="copy" size={16} /></Button>
                        <Button size="sm" variant="outline" leftIcon={<Icon name="coins" size={16} />} onClick={() => { setAdjTarget(p); setAdjAmount(0); setAdjReason(''); setAdjRemove(false); }}>
                          Saldo
                        </Button>
                        <Button size="sm" variant={p.status === 'blocked' ? 'subtle' : 'danger'} onClick={() => setStatusTarget(p)} aria-label={p.status === 'blocked' ? 'Reactivar' : 'Bloquear'}>
                          {p.status === 'blocked' ? <Icon name="check" size={16} /> : <Icon name="x" size={16} />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-line md:hidden">
            {rows.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar alias={p.alias} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-fg">{p.alias}</p>
                    <p className="text-xs text-fg-muted">{displayPhone(p.phone)}</p>
                  </div>
                  <Money value={p.balance} className="text-fg" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RoleBadge role={p.role} />
                  <StatusBadge status={p.status} />
                  {p.cashier?.alias && <Badge tone="gray"><Icon name="wallet" size={12} /> {p.cashier.alias}</Badge>}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openHistory(p)}><Icon name="copy" size={16} /> Historial</Button>
                  <Button size="sm" variant="outline" leftIcon={<Icon name="coins" size={16} />} onClick={() => { setAdjTarget(p); setAdjAmount(0); setAdjReason(''); setAdjRemove(false); }}>
                    Saldo
                  </Button>
                  <Button size="sm" variant={p.status === 'blocked' ? 'subtle' : 'danger'} onClick={() => setStatusTarget(p)}>
                    {p.status === 'blocked' ? <><Icon name="check" size={16} /> Reactivar</> : <><Icon name="x" size={16} /> Bloquear</>}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ─── Status confirm ─── */}
      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={submitStatus}
        tone={blocking ? 'danger' : 'primary'}
        loading={statusLoading}
        title={blocking ? `¿Bloquear a ${statusTarget?.alias}?` : `¿Reactivar a ${statusTarget?.alias}?`}
        description={blocking ? 'No podrá operar ni jugar hasta reactivarlo.' : 'Volverá a tener acceso normal.'}
        confirmLabel={blocking ? 'Bloquear' : 'Reactivar'}
      />

      {/* ─── Balance adjustment modal ─── */}
      <Modal
        open={!!adjTarget}
        onClose={() => setAdjTarget(null)}
        title={`Ajustar saldo — ${adjTarget?.alias ?? ''}`}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setAdjTarget(null)} disabled={adjLoading}>Cancelar</Button>
            <Button variant={adjRemove ? 'danger' : 'primary'} fullWidth onClick={submitAdjust} loading={adjLoading}>
              {adjRemove ? 'Descontar' : 'Acreditar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
            <div>
              <span className="text-sm font-semibold text-fg-muted">Saldo actual</span>
              <div className="font-display text-base font-extrabold text-fg">
                <Money value={adjTarget?.balance} />
              </div>
            </div>
            <div className="inline-flex rounded-xl border border-line bg-surface p-1">
              <button onClick={() => setAdjRemove(false)}
                className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold transition-all', !adjRemove ? 'bg-brand-gradient text-white' : 'text-fg-muted')}><Icon name="plus" size={14} /> Acreditar</button>
              <button onClick={() => setAdjRemove(true)}
                className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold transition-all', adjRemove ? 'bg-brand-gradient text-white' : 'text-fg-muted')}><Icon name="minus" size={14} /> Descontar</button>
            </div>
          </div>
          <AmountInput value={adjAmount} onChange={setAdjAmount} label="Monto del ajuste" />
          <Input
            label="Motivo"
            placeholder="Ej: corrección manual, bono, etc."
            value={adjReason}
            onChange={(e) => setAdjReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* ─── History modal ─── */}
      <Modal open={!!histTarget} onClose={() => setHistTarget(null)} title={`Historial — ${histTarget?.alias ?? ''}`} size="lg">
        {histLoading ? (
          <SkeletonRows rows={6} />
        ) : hist.length === 0 ? (
          <EmptyState icon={<Icon name="copy" size={36} />} title="Sin movimientos" subtitle="Este jugador todavía no tiene transacciones." />
        ) : (
          <ul className="divide-y divide-line">
            {hist.map((t) => {
              const positive = t.type === 'cashier_load' || t.type === 'win' || (t.type === 'adjustment' && t.amount >= 0);
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <Badge tone={TXN_META[t.type].tone} className="shrink-0 min-w-[68px] justify-center">{TXN_META[t.type].label}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-fg-muted">{timeAgo(t.created_at)}</p>
                    {t.player_balance_after != null && (
                      <p className="text-xs text-fg-muted">Saldo: <Money value={t.player_balance_after} showChip={false} /></p>
                    )}
                  </div>
                  <Money value={t.amount} signed className={cn('text-sm font-bold', positive ? 'text-win-600 dark:text-win-400' : 'text-brand-500')} />
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
}
