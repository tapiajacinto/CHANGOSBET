'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Avatar, Badge, Button, Card, EmptyState, Icon, Money, SectionHeader, SkeletonRows, Tabs,
} from '@/components/ui';
import type { IconName } from '@/components/ui';
import { formatDateTime, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
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

const TYPE_ICON: Record<TxnType, IconName> = {
  cashier_load: 'plus',
  cashier_withdraw: 'minus',
  bet: 'dice',
  win: 'trophy',
  float_assign: 'chip',
  adjustment: 'refresh',
  settlement: 'check',
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
    <div className="ambient space-y-6 animate-fade-up">
      <SectionHeader
        eyebrow="Historial"
        title="Movimientos de caja"
        subtitle="Cargas y retiros que procesaste."
        action={
          <Button variant="subtle" size="sm" onClick={load} leftIcon={<Icon name="refresh" size={16} />}>Actualizar</Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
        <div className="space-y-1.5">
          <span className="block text-[11px] uppercase tracking-wider text-fg-subtle">Período</span>
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
        </div>
        <div className="space-y-1.5">
          <span className="block text-[11px] uppercase tracking-wider text-fg-subtle">Tipo</span>
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
            <EmptyState icon={<Icon name="copy" size={36} />} title="Sin movimientos" subtitle="No hay transacciones para este filtro." />
          </div>
        ) : (
          <>
            {/* ─── MOBILE: cards ─── */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((r) => {
                const isCashierCredit = r.type === 'cashier_load';
                const isCashierDebit = r.type === 'cashier_withdraw';
                const isCashierOp = isCashierCredit || isCashierDebit;
                const amountClass = isCashierCredit
                  ? 'text-win-600 dark:text-win-400'
                  : isCashierDebit
                    ? 'text-brand-500'
                    : 'text-fg';
                return (
                  <li key={r.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-2">
                    <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl',
                      isCashierCredit ? 'bg-win-500/12 text-win-600 dark:text-win-400'
                        : isCashierDebit ? 'bg-brand-500/12 text-brand-500'
                          : 'bg-surface-2 text-fg-muted')}>
                      <Icon name={TYPE_ICON[r.type]} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-fg">
                          {r.player?.alias ?? '—'}
                        </span>
                        <Badge tone={TYPE_TONE[r.type]}>{TYPE_LABELS[r.type]}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-fg-muted">{timeAgo(r.created_at)}</p>
                    </div>
                    <Money
                      value={r.amount}
                      signed={isCashierOp}
                      className={cn('font-display font-extrabold', amountClass)}
                    />
                  </li>
                );
              })}
            </ul>

            {/* ─── DESKTOP: tabla ─── */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-fg-subtle">
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                    <th className="px-5 py-3 font-semibold">Jugador</th>
                    <th className="px-5 py-3 font-semibold">Fecha</th>
                    <th className="px-5 py-3 text-right font-semibold">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => {
                    const isCashierCredit = r.type === 'cashier_load';
                    const isCashierDebit = r.type === 'cashier_withdraw';
                    const isCashierOp = isCashierCredit || isCashierDebit;
                    const amountClass = isCashierCredit
                      ? 'text-win-600 dark:text-win-400'
                      : isCashierDebit
                        ? 'text-brand-500'
                        : 'text-fg';
                    return (
                      <tr key={r.id} className="transition-colors hover:bg-surface-2">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-2">
                            <span className={cn('grid h-7 w-7 place-items-center rounded-lg',
                              isCashierCredit ? 'bg-win-500/12 text-win-600 dark:text-win-400'
                                : isCashierDebit ? 'bg-brand-500/12 text-brand-500'
                                  : 'bg-surface-2 text-fg-muted')}>
                              <Icon name={TYPE_ICON[r.type]} size={14} />
                            </span>
                            <Badge tone={TYPE_TONE[r.type]}>{TYPE_LABELS[r.type]}</Badge>
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar alias={r.player?.alias ?? '?'} size={30} />
                            <span className="font-semibold text-fg">{r.player?.alias ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-fg-muted" title={formatDateTime(r.created_at)}>{timeAgo(r.created_at)}</td>
                        <td className="px-5 py-3 text-right">
                          <Money value={r.amount} signed={isCashierOp} className={cn('font-display font-extrabold', amountClass)} />
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
