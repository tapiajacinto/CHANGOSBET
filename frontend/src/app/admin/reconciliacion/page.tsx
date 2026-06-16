'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Card, CardTitle, Money, Button, Badge,
  Skeleton, SkeletonRows, EmptyState,
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
    <span className={cn('inline-flex items-center gap-1 font-bold tabular-nums', ok ? 'text-green-600' : 'text-red-600')}>
      {ok ? '✓' : '✗'} <Money value={v} showChip={false} signed={!ok} />
    </span>
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

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-brand-900">Reconciliación</h2>
          <p className="text-sm text-gray-400">Control de variancias por cajero e invariante de conservación.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} loading={loading} className="shrink-0">↻ Actualizar</Button>
      </div>

      {/* ─── Conservation invariant ─── */}
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card className={cn('border-2', conserves ? 'border-green-200' : 'border-red-300')}>
          <CardTitle
            icon={conserves ? '✓' : '⚠️'}
            title="Invariante de conservación de fichas"
            subtitle="El pasivo en fichas debe igualar el flujo neto de la casa"
            action={
              <Badge tone={conserves ? 'green' : 'red'}>
                {conserves ? 'Conserva ✓' : 'No conserva ✗'}
              </Badge>
            }
          />

          <div className="rounded-2xl bg-brand-50/60 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              pasivo = cargado − retirado + ganancias − apuestas
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-display text-base font-extrabold text-brand-900">
              <Money value={actualLiability} showChip={false} />
              <span className="text-gray-300">=</span>
              <Money value={house?.total_loaded} showChip={false} />
              <span className="text-green-600">−</span>
              <Money value={house?.total_withdrawn} showChip={false} />
              <span className="text-green-600">+</span>
              <Money value={house?.total_wins} showChip={false} />
              <span className="text-red-500">−</span>
              <Money value={house?.total_bets} showChip={false} />
            </div>
            <div className={cn('mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold',
              conserves ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
              {conserves ? '✓' : '✗'} Esperado: <Money value={expectedLiability} showChip={false} />
              {!conserves && (
                <>· Diferencia: <Money value={actualLiability - expectedLiability} showChip={false} signed /></>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ─── Reconciliation table ─── */}
      <Card padded={false} className="overflow-hidden">
        <div className="px-5 pt-5 sm:px-6">
          <CardTitle icon="⚖️" title="Reconciliación por cajero" subtitle="Las variancias deben dar 0 (✓)." />
        </div>

        {loading ? (
          <div className="px-5 pb-5 sm:px-6"><SkeletonRows rows={5} /></div>
        ) : rows.length === 0 ? (
          <div className="px-5 pb-5 sm:px-6">
            <EmptyState icon="⚖️" title="Sin cajeros" subtitle="No hay cajeros para reconciliar todavía." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-y border-brand-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
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
              <tbody className="divide-y divide-brand-50">
                {rows.map((r) => (
                  <tr key={r.cashier_id ?? r.cashier_alias} className="hover:bg-brand-50/40">
                    <td className="px-5 py-3 font-bold text-brand-900">{r.cashier_alias ?? '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums"><Money value={r.float_balance} showChip={false} /></td>
                    <td className="px-3 py-3 text-right tabular-nums"><Money value={r.cash_on_hand} showChip={false} /></td>
                    <td className="px-3 py-3 text-right tabular-nums text-green-700"><Money value={r.total_loaded} showChip={false} /></td>
                    <td className="px-3 py-3 text-right tabular-nums text-red-600"><Money value={r.total_withdrawn} showChip={false} /></td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-500"><Money value={r.expected_cash} showChip={false} /></td>
                    <td className="px-3 py-3 text-right"><VarianceCell value={r.cash_variance} /></td>
                    <td className="px-5 py-3 text-right"><VarianceCell value={r.float_variance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
