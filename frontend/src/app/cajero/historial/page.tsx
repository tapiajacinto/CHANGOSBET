'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Avatar, Badge, Button, Card, CardTitle, EmptyState, Money, SkeletonRows, Tabs,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import type { Profile, Transaction, TxnType } from '@/types/database';

const TYPE_LABELS: Record<TxnType, string> = {
  cashier_load: 'Carga',
  cashier_withdraw: 'Retiro',
  bet: 'Apuesta',
  win: 'Ganancia',
  float_assign: 'Float',
  adjustment: 'Ajuste',
  settlement: 'Cierre',
};

const TYPE_TONE: Record<TxnType, 'green' | 'red' | 'gold' | 'blue' | 'amber' | 'gray' | 'brand'> = {
  cashier_load: 'green',
  cashier_withdraw: 'red',
  bet: 'amber',
  win: 'green',
  float_assign: 'gold',
  adjustment: 'blue',
  settlement: 'gray',
};

type DateFilter = 'today' | '7d' | '30d' | 'all';
type TypeFilter = 'all' | 'cashier_load' | 'cashier_withdraw';

function sinceISO(f: DateFilter): string | null {
  if (f === 'all') return null;
  const d = new Date();
  if (f === 'today') d.setHours(0, 0, 0, 0);
  if (f === '7d') d.setDate(d.getDate() - 7);
  if (f === '30d') d.setDate(d.getDate() - 30);
  return d.toISOString();
}

type Row = Transaction & { player?: Pick<Profile, 'alias'> | null };

export default function HistorialPage() {
  const { user } = useAuth();
  const cashierId = user?.id;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateF, setDateF] = useState<DateFilter>('today');
  const [typeF, setTypeF] = useState<TypeFilter>('all');

  const load = useCallback(async () => {
    if (!cashierId) return;
    setLoading(true);
    let q = supabase
      .from('transactions')
      .select('*, player:player_id(alias)')
      .eq('cashier_id', cashierId)
      .order('created_at', { ascending: false })
      .limit(200);

    const since = sinceISO(dateF);
    if (since) q = q.gte('created_at', since);
    if (typeF !== 'all') q = q.eq('type', typeF);

    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }, [cashierId, dateF, typeF]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    let loaded = 0, withdrawn = 0;
    for (const r of rows) {
      if (r.type === 'cashier_load') loaded += Number(r.amount);
      if (r.type === 'cashier_withdraw') withdrawn += Number(r.amount);
    }
    return { loaded, withdrawn, count: rows.length };
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-900">Historial</h1>
          <p className="text-sm text-gray-400">Tus movimientos de caja.</p>
        </div>
        <Button variant="subtle" size="sm" onClick={load} leftIcon={<span>↻</span>}>Actualizar</Button>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={dateF}
          onChange={setDateF}
          options={[
            { value: 'today', label: 'Hoy' },
            { value: '7d', label: '7 días' },
            { value: '30d', label: '30 días' },
            { value: 'all', label: 'Todo' },
          ]}
        />
        <Tabs
          value={typeF}
          onChange={setTypeF}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'cashier_load', label: 'Cargas' },
            { value: 'cashier_withdraw', label: 'Retiros' },
          ]}
        />
      </div>

      {/* Resumen del período */}
      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge tone="green">Cargado <Money value={summary.loaded} compact /></Badge>
          <Badge tone="red">Retirado <Money value={summary.withdrawn} compact /></Badge>
          <Badge tone="gray">{summary.count} movimientos</Badge>
        </div>
      )}

      <Card padded={false}>
        {loading ? (
          <div className="p-5"><SkeletonRows rows={6} /></div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="📭" title="Sin movimientos" subtitle="No hay transacciones para este filtro." />
          </div>
        ) : (
          <>
            {/* ─── MOBILE: cards ─── */}
            <ul className="divide-y divide-brand-50 md:hidden">
              {rows.map((r) => {
                const isCredit = r.type === 'cashier_load' || r.type === 'win' || r.type === 'float_assign';
                return (
                  <li key={r.id} className="flex items-center gap-3 p-4">
                    <Avatar alias={r.player?.alias ?? '🪙'} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge tone={TYPE_TONE[r.type]}>{TYPE_LABELS[r.type]}</Badge>
                        <span className="truncate text-sm font-bold text-brand-900">
                          {r.player?.alias ?? '—'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(r.created_at)}</p>
                    </div>
                    <Money
                      value={r.amount}
                      signed
                      className={isCredit ? 'text-green-600' : 'text-red-600'}
                    />
                  </li>
                );
              })}
            </ul>

            {/* ─── DESKTOP: tabla ─── */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-100 text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                    <th className="px-5 py-3 font-semibold">Jugador</th>
                    <th className="px-5 py-3 font-semibold">Fecha</th>
                    <th className="px-5 py-3 text-right font-semibold">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {rows.map((r) => {
                    const isCredit = r.type === 'cashier_load' || r.type === 'win' || r.type === 'float_assign';
                    return (
                      <tr key={r.id} className="transition-colors hover:bg-brand-50/40">
                        <td className="px-5 py-3"><Badge tone={TYPE_TONE[r.type]}>{TYPE_LABELS[r.type]}</Badge></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar alias={r.player?.alias ?? '🪙'} size={30} />
                            <span className="font-semibold text-brand-900">{r.player?.alias ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-500">{formatDateTime(r.created_at)}</td>
                        <td className="px-5 py-3 text-right">
                          <Money value={r.amount} signed className={isCredit ? 'text-green-600' : 'text-red-600'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
