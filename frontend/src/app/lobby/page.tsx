'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Protected } from '@/components/auth/Protected';
import { PlayerShell } from '@/components/player/PlayerShell';
import { PendingNotice } from '@/components/player/PendingNotice';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/contexts/RoomContext';
import { Card, Money, Input, Button, Tabs } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { GameType } from '@/types';

/* ─── Catálogo de juegos ─────────────────────────────────────────── */
const GAMES: { id: GameType; name: string; icon: string; soon?: boolean }[] = [
  { id: 'roulette',  name: 'Ruleta',    icon: '🎡' },
  { id: 'blackjack', name: 'Blackjack', icon: '🃏' },
  { id: 'poker',     name: 'Poker',     icon: '♠️', soon: true },
  { id: 'horses',    name: 'Caballos',  icon: '🏇' },
  { id: 'football',  name: 'Fútbol',    icon: '⚽' },
];

function LobbyContent() {
  const router = useRouter();
  const { profile } = useAuth();
  const { createRoom, joinRoom, balance } = useRoom();

  const [tab, setTab] = useState<'crear' | 'unirse'>('crear');

  // Crear
  const [roomName, setRoomName] = useState('');
  const [picked, setPicked] = useState<GameType | null>(null);
  const [creating, setCreating] = useState(false);

  // Unirse
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const isActive = profile?.status === 'active';

  async function handleCreate() {
    if (!picked) { toast.error('Elegí un juego'); return; }
    const name = roomName.trim() || `Mesa de ${profile?.alias ?? 'changos'}`;
    setCreating(true);
    try {
      const newCode = await createRoom(name, picked);
      if (newCode) router.push('/room/' + newCode);
      else toast.error('No se pudo crear la mesa. Probá de nuevo.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo crear la mesa.');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    const clean = code.trim().toUpperCase();
    if (clean.length !== 6) { toast.error('El código tiene 6 caracteres'); return; }
    setJoining(true);
    try {
      const ok = await joinRoom(clean);
      if (ok) router.push('/room/' + clean);
      else toast.error('No encontramos esa mesa. Revisá el código.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo entrar a la mesa.');
    } finally {
      setJoining(false);
    }
  }

  /* ── Cuenta pendiente / bloqueada: sin acciones de juego ── */
  if (!isActive) {
    return (
      <div className="space-y-5">
        <Balance value={balance} />
        <PendingNotice />
      </div>
    );
  }

  /* ── Jugador activo ── */
  return (
    <div className="space-y-6">
      <Balance value={balance} />

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-extrabold text-brand-900">Jugá con los changos</h1>
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'crear', label: 'Crear' },
            { value: 'unirse', label: 'Unirse' },
          ]}
        />
      </div>

      {tab === 'crear' ? (
        <motion.div
          key="crear"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        >
          <Card className="space-y-5">
            <Input
              label="Nombre de la mesa"
              placeholder={`Mesa de ${profile?.alias ?? 'changos'}`}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={28}
            />

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700">Elegí el juego</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {GAMES.map((g) => {
                  const active = picked === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      disabled={g.soon}
                      onClick={() => setPicked(g.id)}
                      className={cn(
                        'relative flex flex-col items-center gap-2 rounded-3xl border-2 p-4 transition-all',
                        g.soon
                          ? 'cursor-not-allowed border-brand-100 bg-brand-50/40 opacity-60'
                          : active
                            ? 'border-brand-500 bg-brand-50 shadow-brand'
                            : 'border-brand-100 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card',
                      )}
                    >
                      {g.soon && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-gold-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-700">
                          Pronto
                        </span>
                      )}
                      <span className={cn('text-3xl transition-transform', active && 'scale-110')}>{g.icon}</span>
                      <span className="font-display text-sm font-bold text-brand-900">{g.name}</span>
                      {active && (
                        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-gradient text-[10px] text-white shadow-brand">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="primary" size="lg" fullWidth
              loading={creating}
              disabled={!picked}
              onClick={handleCreate}
            >
              Crear mesa →
            </Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="unirse"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        >
          <Card className="space-y-5">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-brand-gradient text-2xl text-white shadow-brand">
                🔑
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Pedile el código de la mesa a tu chango y entrá a jugar.
              </p>
            </div>

            <Input
              label="Código de la mesa"
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              autoCapitalize="characters"
              className="text-center font-display text-2xl font-extrabold tracking-[0.4em]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
            />

            <Button
              variant="primary" size="lg" fullWidth
              loading={joining}
              disabled={code.trim().length !== 6}
              onClick={handleJoin}
            >
              Entrar a la mesa →
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/* ── Tarjeta de balance prominente ── */
function Balance({ value }: { value: number }) {
  return (
    <Card className="relative overflow-hidden !border-brand-800 !bg-brand-gradient text-white">
      <div className="absolute inset-0 bg-dots opacity-30" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Tu saldo</p>
          <Money value={value} className="!font-display text-3xl !font-extrabold" />
        </div>
        <span className="text-4xl drop-shadow">🪙</span>
      </div>
    </Card>
  );
}

export default function LobbyPage() {
  return (
    <Protected role={['player', 'cashier', 'admin']}>
      <PlayerShell>
        <LobbyContent />
      </PlayerShell>
    </Protected>
  );
}
