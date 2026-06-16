'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Card, CardTitle, StatCard, Money, Avatar, Badge, StatusBadge, Button,
  Modal, ConfirmDialog, AmountInput, Input, Skeleton, EmptyState,
} from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { displayPhone } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Profile, CashierReconciliation } from '@/types/database';
import toast from 'react-hot-toast';

interface CashierRow {
  profile: Profile;
  recon: CashierReconciliation | null;
}

const num = (v: number | null | undefined) => Number(v ?? 0);

export default function AdminCajerosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CashierRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [cashiersRes, reconRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'cashier').order('alias'),
      supabase.from('v_cashier_reconciliation').select('*'),
    ]);
    if (cashiersRes.error) toast.error(cashiersRes.error.message);
    const recon = (reconRes.data as CashierReconciliation[]) ?? [];
    const merged: CashierRow[] = ((cashiersRes.data as Profile[]) ?? []).map((p) => ({
      profile: p,
      recon: recon.find((r) => r.cashier_id === p.id) ?? null,
    }));
    setRows(merged);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Float modal ───
  const [floatTarget, setFloatTarget] = useState<Profile | null>(null);
  const [floatAmount, setFloatAmount] = useState(0);
  const [floatRemove, setFloatRemove] = useState(false);
  const [floatLoading, setFloatLoading] = useState(false);

  const submitFloat = async () => {
    if (!floatTarget || floatAmount <= 0) { toast.error('Ingresá un monto'); return; }
    setFloatLoading(true);
    const delta = floatRemove ? -floatAmount : floatAmount;
    const { data, error } = await supabase.rpc('admin_assign_float', {
      p_cashier: floatTarget.id, p_amount: delta,
    });
    setFloatLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${floatRemove ? 'Quitado' : 'Asignado'} float. Nuevo float: ${Number(data ?? 0).toLocaleString('es-AR')}`);
    setFloatTarget(null); setFloatAmount(0); setFloatRemove(false);
    load();
  };

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
    toast.success(blocking ? 'Cajero bloqueado' : 'Cajero reactivado');
    setStatusTarget(null);
    load();
  };

  // ─── Close caja ───
  const [closeTarget, setCloseTarget] = useState<Profile | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);

  const submitClose = async () => {
    if (!closeTarget) return;
    setCloseLoading(true);
    const { error } = await supabase.rpc('admin_close_caja', { p_cashier: closeTarget.id });
    setCloseLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Caja cerrada. Snapshot generado.');
    setCloseTarget(null);
    load();
  };

  // ─── New cashier (promote) ───
  const [newOpen, setNewOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);

  const doSearch = async () => {
    const q = search.trim();
    if (!q) { setResults([]); return; }
    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'cashier')
      .or(`phone.ilike.%${q}%,alias.ilike.%${q}%`)
      .limit(15);
    setSearching(false);
    if (error) { toast.error(error.message); return; }
    setResults((data as Profile[]) ?? []);
  };

  const promote = async (p: Profile) => {
    setPromoting(p.id);
    const { error } = await supabase.rpc('admin_set_role', { p_user: p.id, p_role: 'cashier' });
    setPromoting(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${p.alias} ahora es cajero`);
    setNewOpen(false); setSearch(''); setResults([]);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-brand-900">Cajeros</h2>
          <p className="text-sm text-gray-400">Float, caja y reconciliación de cada socio cajero.</p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setNewOpen(true)} className="shrink-0">+ Nuevo cajero</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon="💵" title="Sin cajeros" subtitle="Promové un usuario a cajero para empezar."
          action={<Button variant="gold" size="sm" onClick={() => setNewOpen(true)}>+ Nuevo cajero</Button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map(({ profile: p, recon }) => {
            const cashVar = num(recon?.cash_variance);
            const floatVar = num(recon?.float_variance);
            return (
              <Card key={p.id}>
                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                  <Avatar alias={p.alias} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-bold text-brand-900">{p.alias}</p>
                    <p className="text-xs text-gray-400">{displayPhone(p.phone)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                {/* Float / cash */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Float" icon="🏦"
                    value={<Money value={recon?.float_balance} compact showChip={false} />} />
                  <StatCard label="Efectivo en mano" icon="💵"
                    value={<Money value={recon?.cash_on_hand} compact showChip={false} />} />
                </div>

                {/* Variances */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className={cn(
                    'rounded-2xl border px-3 py-2.5',
                    cashVar === 0 ? 'border-green-100 bg-green-50' : 'border-red-200 bg-red-50',
                  )}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Var. efectivo</p>
                    <p className={cn('font-display text-lg font-extrabold tabular-nums', cashVar === 0 ? 'text-green-700' : 'text-red-600')}>
                      {cashVar === 0 ? '✓ 0' : <Money value={cashVar} showChip={false} signed />}
                    </p>
                  </div>
                  <div className={cn(
                    'rounded-2xl border px-3 py-2.5',
                    floatVar === 0 ? 'border-green-100 bg-green-50' : 'border-red-200 bg-red-50',
                  )}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Var. float</p>
                    <p className={cn('font-display text-lg font-extrabold tabular-nums', floatVar === 0 ? 'text-green-700' : 'text-red-600')}>
                      {floatVar === 0 ? '✓ 0' : <Money value={floatVar} showChip={false} signed />}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" onClick={() => { setFloatTarget(p); setFloatRemove(false); setFloatAmount(0); }}>
                    🏦 Float
                  </Button>
                  <Button size="sm" variant={p.status === 'blocked' ? 'subtle' : 'outline'} onClick={() => setStatusTarget(p)}>
                    {p.status === 'blocked' ? '✓ Reactivar' : '⛔ Bloquear'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCloseTarget(p)}>🧮 Cerrar caja</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Float modal ─── */}
      <Modal
        open={!!floatTarget}
        onClose={() => setFloatTarget(null)}
        title={floatRemove ? `Quitar float — ${floatTarget?.alias ?? ''}` : `Asignar float — ${floatTarget?.alias ?? ''}`}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setFloatTarget(null)} disabled={floatLoading}>Cancelar</Button>
            <Button variant={floatRemove ? 'danger' : 'primary'} fullWidth onClick={submitFloat} loading={floatLoading}>
              {floatRemove ? 'Quitar' : 'Asignar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3">
            <span className="text-sm font-semibold text-brand-700">Modo</span>
            <div className="inline-flex rounded-xl border border-brand-100 bg-white p-1">
              <button
                onClick={() => setFloatRemove(false)}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-bold transition-all', !floatRemove ? 'bg-brand-gradient text-white' : 'text-brand-600')}
              >Sumar</button>
              <button
                onClick={() => setFloatRemove(true)}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-bold transition-all', floatRemove ? 'bg-red-600 text-white' : 'text-brand-600')}
              >Quitar</button>
            </div>
          </div>
          <AmountInput value={floatAmount} onChange={setFloatAmount} label="Monto de float" />
        </div>
      </Modal>

      {/* ─── Status confirm ─── */}
      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={submitStatus}
        tone={blocking ? 'danger' : 'primary'}
        loading={statusLoading}
        title={blocking ? `¿Bloquear a ${statusTarget?.alias}?` : `¿Reactivar a ${statusTarget?.alias}?`}
        description={blocking
          ? 'El cajero no podrá operar hasta que lo reactives.'
          : 'El cajero volverá a poder cargar y pagar fichas.'}
        confirmLabel={blocking ? 'Bloquear' : 'Reactivar'}
      />

      {/* ─── Close caja confirm ─── */}
      <ConfirmDialog
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={submitClose}
        tone="gold"
        loading={closeLoading}
        title={`¿Cerrar la caja de ${closeTarget?.alias}?`}
        description="Se generará un snapshot de cierre con el float y el efectivo actuales. Esta acción queda registrada."
        confirmLabel="Cerrar caja"
      />

      {/* ─── New cashier modal ─── */}
      <Modal open={newOpen} onClose={() => { setNewOpen(false); setSearch(''); setResults([]); }} title="Nuevo cajero" size="md">
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <Input
              label="Buscar usuario"
              placeholder="Teléfono o alias"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              className="flex-1"
            />
            <Button onClick={doSearch} loading={searching} className="shrink-0">Buscar</Button>
          </div>

          {results.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              {searching ? 'Buscando…' : 'Buscá un jugador para promoverlo a cajero.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-2xl border border-brand-100 px-3 py-2.5">
                  <Avatar alias={u.alias} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-brand-900">{u.alias}</p>
                    <p className="text-xs text-gray-400">{displayPhone(u.phone)}</p>
                  </div>
                  <Badge tone={u.role === 'admin' ? 'gold' : 'brand'}>{u.role === 'admin' ? 'Socio' : 'Jugador'}</Badge>
                  <Button size="sm" variant="gold" loading={promoting === u.id} onClick={() => promote(u)}>Promover</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  );
}
