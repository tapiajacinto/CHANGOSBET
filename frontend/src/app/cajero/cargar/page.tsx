'use client';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Avatar, BarTrack, Button, Card, CardTitle, ConfirmDialog, EmptyState,
  Icon, Input, Money, AmountInput, SectionHeader, Skeleton, SkeletonRows,
} from '@/components/ui';
import { displayPhone, formatChips } from '@/lib/format';
import type { CashierAccount, Profile } from '@/types/database';

function CargarInner() {
  const { user } = useAuth();
  const cashierId = user?.id;
  const params = useSearchParams();
  const preselect = params.get('player');

  const [players, setPlayers] = useState<Profile[]>([]);
  const [account, setAccount] = useState<CashierAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(preselect);
  const [filter, setFilter] = useState('');
  const [amount, setAmount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!cashierId) return;
    setLoading(true);
    const [mine, acc] = await Promise.all([
      supabase.from('profiles').select('*').eq('cashier_id', cashierId).eq('status', 'active').order('alias'),
      supabase.from('cashier_accounts').select('*').eq('cashier_id', cashierId).single(),
    ]);
    if (mine.data) setPlayers(mine.data as Profile[]);
    if (acc.data) setAccount(acc.data as CashierAccount);
    setLoading(false);
  }, [cashierId]);

  useEffect(() => { load(); }, [load]);

  const float = Number(account?.float_balance ?? 0);
  const selected = useMemo(() => players.find((p) => p.id === selectedId) ?? null, [players, selectedId]);

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return players;
    return players.filter(
      (p) => p.alias.toLowerCase().includes(term) || (p.phone ?? '').toLowerCase().includes(term),
    );
  }, [players, filter]);

  const canSubmit = !!selected && amount > 0 && amount <= float;

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('cashier_load_chips', {
      p_player: selected.id,
      p_amount: amount,
    });
    setSubmitting(false);
    setConfirmOpen(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Cargaste ${formatChips(amount)} fichas a ${selected.alias}. Nuevo saldo: ${formatChips(Number(data))}`);
    setAmount(0);
    load();
  };

  return (
    <div className="ambient space-y-6 animate-fade-up">
      <SectionHeader
        eyebrow="Cargar"
        title="Cargar fichas"
        subtitle="Recibí el efectivo y acreditá las fichas al jugador."
      />

      {/* Float disponible — contexto */}
      <Card accent="brand" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
              <Icon name="chip" size={22} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">Float disponible</p>
              <Money value={float} className="font-display text-2xl font-extrabold text-fg" />
            </div>
          </div>
        </div>
      </Card>

      {/* Elegir jugador */}
      <Card>
        <CardTitle icon={<Icon name="users" size={20} />} title="1. Elegí el jugador" subtitle="Sólo jugadores activos de tu cartera" />
        <Input
          leftIcon={<Icon name="search" size={18} />}
          placeholder="Buscar por alias o teléfono…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="mt-4">
          {loading ? (
            <SkeletonRows rows={4} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Icon name="users" size={36} />}
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
                          ? 'border-brand-500 bg-brand-500/10 shadow-brand'
                          : 'border-line bg-surface hover:border-brand-500/50')
                      }
                    >
                      <Avatar alias={p.alias} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-fg">{p.alias}</p>
                        <p className="truncate text-xs text-fg-muted">{displayPhone(p.phone)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Saldo</p>
                        <Money value={p.balance} compact className="text-sm text-fg" />
                      </div>
                      {active && <Icon name="check" size={18} className="text-brand-500" />}
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
          icon={<Icon name="chip" size={20} />}
          title="2. Monto a cargar"
          subtitle={selected ? `Para ${selected.alias}` : 'Primero elegí un jugador'}
          accent="gold"
        />
        {loading ? (
          <Skeleton className="h-28" />
        ) : (
          <>
            <AmountInput value={amount} onChange={setAmount} max={float} label="Fichas a cargar" />

            {/* Uso de esta carga — junto al monto */}
            {selected && amount > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-fg-muted">
                  <span>Uso de esta carga</span>
                  <span className="tabular-nums">{float > 0 ? Math.round((Math.min(amount, float) / float) * 100) : 0}%</span>
                </div>
                <BarTrack value={float > 0 ? Math.min(amount, float) / float : 0} color={amount > float ? 'brand' : 'win'} />
              </div>
            )}

            {/* Resumen de la operación */}
            {selected && amount > 0 && amount <= float && (
              <div className="mt-4 space-y-2 rounded-2xl border border-line bg-surface-2/50 p-4 text-sm animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-fg-muted"><Avatar alias={selected.alias} size={22} /> Para</span>
                  <span className="font-bold text-fg">{selected.alias}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-fg-muted">Cargás</span>
                  <Money value={amount} className="font-bold text-win-600 dark:text-win-400" />
                </div>
                <div className="my-1 border-t border-dashed border-line" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-fg-muted">Saldo del jugador</span>
                  <span className="tabular-nums text-fg">
                    <Money value={selected.balance} compact className="text-fg-muted" /> →{' '}
                    <Money value={Number(selected.balance) + amount} compact className="font-extrabold text-fg" />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-fg-muted">Float restante</span>
                  <Money value={float - amount} compact className="font-bold text-fg" />
                </div>
              </div>
            )}

            <Button
              className="mt-5"
              fullWidth
              size="lg"
              variant="win"
              leftIcon={<Icon name="plus" size={18} />}
              disabled={!canSubmit}
              onClick={() => setConfirmOpen(true)}
            >
              Cargar fichas
            </Button>
            {selected && amount > float && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-brand-500">
                <Icon name="alert" size={14} /> No te alcanza el float disponible.
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
        tone="gold"
        confirmLabel="Confirmar carga"
        title="Confirmar carga de fichas"
        description={
          selected ? (
            <span>
              Vas a cargar <b>{formatChips(amount)} fichas</b> a <b>{selected.alias}</b>.
              <br />Recibí el efectivo antes de confirmar.
            </span>
          ) : null
        }
      />
    </div>
  );
}

export default function CargarPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={5} />}>
      <CargarInner />
    </Suspense>
  );
}
