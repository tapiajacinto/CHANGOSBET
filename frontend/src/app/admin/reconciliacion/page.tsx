'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Card, CardTitle, Money, Button, Badge, LiveDot,
  Skeleton, SkeletonRows, EmptyState, Icon, ProgressRing, Avatar,
  SectionHeader,
} from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import type { CashierReconciliation, HousePosition } from '@/types/database';
import toast from 'react-hot-toast';

const num = (v: number | null | undefined) => Number(v ?? 0);

/** Celda numérica que pinta rojo si la variancia ≠ 0. */
function VarianceCell({ value }: { value: number | null | undefined }) {
  const v = num(value);
  const ok = v === 0;
  return (
    <span className={cn('inline-flex items-center gap-1 font-bold tabular-nums',
      ok ? 'text-win-600 dark:text-win-400' : 'text-brand-500')}>
      <Icon name={ok ? 'check' : 'alert'} size={14} /> <Money value={v} showChip={false} signed={!ok} />
    </span>
  );
}

/** Tile de un término de la ecuación de conservación. */
function EqTile({ label, value, sign, tone }: {
  label: string; value: number | null | undefined; sign?: '+' | '−';
  tone: 'win' | 'brand' | 'neutral';
}) {
  const toneCls = {
    win:     'text-win-600 dark:text-win-400',
    brand:   'text-brand-500',
    neutral: 'text-fg',
  }[tone];
  return (
    <div className="relative flex flex-col rounded-2xl border border-line bg-surface-2 px-3.5 py-3">
      {sign && (
        <span className={cn('absolute -left-3 top-1/2 hidden -translate-y-1/2 font-display text-lg font-extrabold sm:block',
          sign === '+' ? 'text-win-500' : 'text-brand-500')}>
          {sign}
        </span>
      )}
      <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
        {label}
        {sign && (
          <span className={cn('ml-1 font-extrabold', sign === '+' ? 'text-win-500' : 'text-brand-500')}>{sign}</span>
        )}
      </span>
      <span className={cn('mt-1 font-display text-base font-extrabold tabular-nums', toneCls)}>
        <Money value={value} showChip={false} />
      </span>
    </div>
  );
}

export default function AdminReconciliacionPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CashierReconciliation[]>([]);
  const [house, setHouse] = useState<HousePosition | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [reconRes, houseRes] = await Promise.all([
      supabase.from('v_cashier_reconciliation').select('*').order('cashier_alias'),
      supabase.from('v_house_position').select('*').single(),
    ]);
    if (reconRes.error) toast.error(reconRes.error.message);
    setRows((reconRes.data as CashierReconciliation[]) ?? []);
    setHouse((houseRes.data as HousePosition) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Invariante de conservación: outstanding_chip_liability == loaded - withdrawn + wins - bets
  const expectedLiability = house
    ? num(house.total_loaded) - num(house.total_withdrawn) + num(house.total_wins) - num(house.total_bets)
    : 0;
  const actualLiability = num(house?.outstanding_chip_liability);
  const conserves = expectedLiability === actualLiability;

  const balancedCount = rows.filter((r) => num(r.cash_variance) === 0 && num(r.float_variance) === 0).length;

  return (
    <div className="space-y-6 animate-fade-up">
      <SectionHeader
        eyebrow="Auditoría"
        title="Reconciliación"
        subtitle="Control de variancias por cajero e invariante de conservación."
        action={
          <Button variant="subtle" size="sm" onClick={load} loading={loading} className="shrink-0"
            leftIcon={<Icon name="refresh" size={16} />}>
            Actualizar
          </Button>
        }
      />

      {/* ─── Conservation invariant ─── */}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card accent={conserves ? 'win' : 'brand'}
          className={cn('relative overflow-hidden', conserves ? 'shadow-ring-win' : 'shadow-ring-brand')}>
          {/* ambient glow */}
          <div className={cn('pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl',
            conserves ? 'bg-win-500/10' : 'bg-brand-500/10')} aria-hidden />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* Estado: ring grande */}
            <div className="flex shrink-0 items-center gap-5">
              <ProgressRing
                value={conserves ? 1 : (expectedLiability ? Math.min(1, Math.abs(actualLiability / expectedLiability)) : 0)}
                size={104} stroke={10}
                color={conserves ? 'win' : 'brand'}
              >
                <span className={cn('grid h-9 w-9 place-items-center rounded-full text-xl',
                  conserves ? 'text-win-600 dark:text-win-400' : 'text-brand-500')}>
                  <Icon name={conserves ? 'check' : 'alert'} size={26} />
                </span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-fg-subtle">Invariante</p>
                <h3 className="font-display text-xl font-extrabold leading-tight text-fg">
                  {conserves ? 'Conserva' : 'No conserva'}
                </h3>
                <div className="mt-1.5">
                  {conserves
                    ? <LiveDot label="Fichas balanceadas" />
                    : <Badge tone="red" dot>Revisar diferencia</Badge>}
                </div>
              </div>
            </div>

            {/* Ecuación como tiles */}
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
                Pasivo en fichas = Cargado − Retirado + Ganancias − Apuestas
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3 sm:pl-3">
                <div className="col-span-2 sm:col-span-1">
                  <div className={cn('flex h-full flex-col justify-center rounded-2xl border px-3.5 py-3',
                    conserves ? 'border-win-500/30 bg-win-500/5' : 'border-brand-500/30 bg-brand-500/5')}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Pasivo (real)</span>
                    <span className={cn('mt-1 font-display text-base font-extrabold tabular-nums',
                      conserves ? 'text-win-600 dark:text-win-400' : 'text-brand-500')}>
                      <Money value={actualLiability} showChip={false} />
                    </span>
                  </div>
                </div>
                <EqTile label="Cargado" value={house?.total_loaded} sign="+" tone="win" />
                <EqTile label="Retirado" value={house?.total_withdrawn} sign="−" tone="brand" />
                <EqTile label="Ganancias" value={house?.total_wins} sign="+" tone="win" />
                <EqTile label="Apuestas" value={house?.total_bets} sign="−" tone="brand" />
              </div>

              {/* Esperado / diferencia */}
              <div className={cn('mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full px-4 py-2 text-sm font-bold',
                conserves
                  ? 'bg-win-500/12 text-win-600 dark:text-win-400'
                  : 'bg-brand-500/12 text-brand-600 dark:text-brand-400')}>
                <Icon name={conserves ? 'check' : 'x'} size={14} />
                <span>Esperado:</span> <Money value={expectedLiability} showChip={false} />
                {!conserves && (
                  <span className="inline-flex items-center gap-1">
                    · Diferencia: <Money value={actualLiability - expectedLiability} showChip={false} signed />
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Reconciliation by cashier ─── */}
      <Card padded={false} className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6">
          <CardTitle
            icon={<Icon name="shield" size={18} />} accent="win"
            title="Reconciliación por cajero" subtitle="Las variancias deben dar 0."
            action={!loading && rows.length > 0
              ? <Badge tone={balancedCount === rows.length ? 'win' : 'amber'} dot>
                  {balancedCount}/{rows.length} OK
                </Badge>
              : undefined}
          />
        </div>

        {loading ? (
          <div className="px-5 pb-5 sm:px-6"><SkeletonRows rows={5} /></div>
        ) : rows.length === 0 ? (
          <div className="px-5 pb-5 sm:px-6">
            <EmptyState icon={<Icon name="shield" size={36} />} title="Sin cajeros" subtitle="No hay cajeros para reconciliar todavía." />
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((r) => {
                const cashOk = num(r.cash_variance) === 0;
                const floatOk = num(r.float_variance) === 0;
                const allOk = cashOk && floatOk;
                return (
                  <li key={r.cashier_id ?? r.cashier_alias} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar alias={r.cashier_alias ?? '—'} size={38} />
                      <span className="min-w-0 flex-1 truncate font-bold text-fg">{r.cashier_alias ?? '—'}</span>
                      <Badge tone={allOk ? 'win' : 'red'} dot>{allOk ? 'OK' : 'Variancia'}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-surface-2 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Float</p>
                        <p className="font-display font-extrabold tabular-nums text-fg"><Money value={r.float_balance} showChip={false} /></p>
                      </div>
                      <div className="rounded-xl bg-surface-2 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Efectivo</p>
                        <p className="font-display font-extrabold tabular-nums text-fg"><Money value={r.cash_on_hand} showChip={false} /></p>
                      </div>
                      <div className="rounded-xl bg-surface-2 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Cargado</p>
                        <p className="font-display font-extrabold tabular-nums text-win-600 dark:text-win-400"><Money value={r.total_loaded} showChip={false} /></p>
                      </div>
                      <div className="rounded-xl bg-surface-2 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Retirado</p>
                        <p className="font-display font-extrabold tabular-nums text-brand-500"><Money value={r.total_withdrawn} showChip={false} /></p>
                      </div>
                    </div>
                    <div className={cn('mt-2 grid grid-cols-2 gap-2 rounded-xl border px-3 py-2',
                      allOk ? 'border-win-500/25 bg-win-500/5' : 'border-brand-500/25 bg-brand-500/5')}>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Var. efectivo</p>
                        <VarianceCell value={r.cash_variance} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">Var. float</p>
                        <VarianceCell value={r.float_variance} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-y border-line text-left text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
                    <th className="px-5 py-3">Cajero</th>
                    <th className="px-3 py-3 text-right">Float</th>
                    <th className="px-3 py-3 text-right">Efectivo</th>
                    <th className="px-3 py-3 text-right">Cargado</th>
                    <th className="px-3 py-3 text-right">Retirado</th>
                    <th className="px-3 py-3 text-right">Efvo. esperado</th>
                    <th className="px-3 py-3 text-right">Var. efectivo</th>
                    <th className="px-5 py-3 text-right">Var. float</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.cashier_id ?? r.cashier_alias} className="transition-colors hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar alias={r.cashier_alias ?? '—'} size={28} />
                          <span className="font-bold text-fg">{r.cashier_alias ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-fg"><Money value={r.float_balance} showChip={false} /></td>
                      <td className="px-3 py-3 text-right tabular-nums text-fg"><Money value={r.cash_on_hand} showChip={false} /></td>
                      <td className="px-3 py-3 text-right tabular-nums text-win-600 dark:text-win-400"><Money value={r.total_loaded} showChip={false} /></td>
                      <td className="px-3 py-3 text-right tabular-nums text-brand-500"><Money value={r.total_withdrawn} showChip={false} /></td>
                      <td className="px-3 py-3 text-right tabular-nums text-fg-muted"><Money value={r.expected_cash} showChip={false} /></td>
                      <td className="px-3 py-3 text-right"><VarianceCell value={r.cash_variance} /></td>
                      <td className="px-5 py-3 text-right"><VarianceCell value={r.float_variance} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
