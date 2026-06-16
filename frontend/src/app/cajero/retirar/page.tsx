'use client';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Avatar, Button, Card, CardTitle, ConfirmDialog, EmptyState,
  Input, Money, AmountInput, Skeleton, SkeletonRows,
} from '@/components/ui';
import { displayPhone, formatChips } from '@/lib/format';
import type { Profile } from '@/types/database';

function RetirarInner() {
  const { user } = useAuth();
  const cashierId = user?.id;
  const params = useSearchParams();
  const preselect = params.get('player');

  const [players, setPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(preselect);
  const [filter, setFilter] = useState('');
  const [amount, setAmount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!cashierId) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('cashier_id', cashierId)
      .eq('status', 'active')
      .order('alias');
    if (data) setPlayers(data as Profile[]);
    setLoading(false);
  }, [cashierId]);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(() => players.find((p) => p.id === selectedId) ?? null, [players, selectedId]);
  const playerBalance = Number(selected?.balance ?? 0);

  // Si el monto quedó por encima del saldo del jugador recién elegido, lo recortamos.
  useEffect(() => {
    if (selected && amount > playerBalance) setAmount(playerBalance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return players;
    return players.filter(
      (p) => p.alias.toLowerCase().includes(term) || (p.phone ?? '').toLowerCase().includes(term),
    );
  }, [players, filter]);

  const canSubmit = !!selected && amount > 0 && amount <= playerBalance;

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('cashier_withdraw_chips', {
      p_player: selected.id,
      p_amount: amount,
    });
    setSubmitting(false);
    setConfirmOpen(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Pagaste 🪙 ${formatChips(amount)} a ${selected.alias}. Saldo restante: 🪙 ${formatChips(Number(data))}`);
    setAmount(0);
    load();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-brand-900">Pagar retiro</h1>
        <p className="text-sm text-gray-400">Descontá fichas del jugador y entregale el efectivo.</p>
      </header>

      {/* Elegir jugador */}
      <Card>
        <CardTitle icon="🎮" title="1. Elegí el jugador" subtitle="Sólo jugadores activos de tu cartera" />
        <Input
          leftIcon={<span>🔎</span>}
          placeholder="Buscar por alias o teléfono…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="mt-4">
          {loading ? (
            <SkeletonRows rows={4} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon="🫥"
              title={players.length === 0 ? 'Sin jugadores activos' : 'Sin resultados'}
              subtitle={players.length === 0 ? 'Activá un jugador desde Inicio.' : 'Probá con otro dato.'}
            />
          ) : (
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {visible.map((p) => {
                const active = p.id === selectedId;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelectedId(p.id)}
                      className={
                        'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all ' +
                        (active
                          ? 'border-brand-500 bg-brand-50 shadow-brand'
                          : 'border-brand-100 bg-white hover:border-brand-300')
                      }
                    >
                      <Avatar alias={p.alias} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-brand-900">{p.alias}</p>
                        <p className="truncate text-xs text-gray-400">{displayPhone(p.phone)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">Saldo</p>
                        <Money value={p.balance} compact className="text-sm text-brand-900" />
                      </div>
                      {active && <span className="text-brand-600">✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {/* Monto */}
      <Card>
        <CardTitle
          icon="🪙"
          title="2. Monto a retirar"
          subtitle={selected ? `${selected.alias} tiene 🪙 ${formatChips(playerBalance)}` : 'Primero elegí un jugador'}
        />
        {loading ? (
          <Skeleton className="h-28" />
        ) : (
          <>
            <AmountInput
              value={amount}
              onChange={setAmount}
              max={selected ? playerBalance : 0}
              label="Fichas a retirar"
            />
            <Button
              className="mt-5"
              fullWidth
              size="lg"
              variant="primary"
              disabled={!canSubmit}
              onClick={() => setConfirmOpen(true)}
            >
              Pagar retiro
            </Button>
            {selected && amount > playerBalance && (
              <p className="mt-2 text-center text-xs font-semibold text-red-500">
                ⚠ El jugador no tiene tantas fichas.
              </p>
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={submitting}
        tone="danger"
        confirmLabel="Confirmar retiro"
        title="Confirmar pago de retiro"
        description={
          selected ? (
            <span>
              Vas a retirar <b>🪙 {formatChips(amount)}</b> de <b>{selected.alias}</b>.
              <br />Entregá el efectivo al confirmar.
            </span>
          ) : null
        }
      />
    </div>
  );
}

export default function RetirarPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={5} />}>
      <RetirarInner />
    </Suspense>
  );
}
