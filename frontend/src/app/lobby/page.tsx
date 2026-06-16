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
import { BalanceHero, Card, Input, Button, Tabs, Icon, GameCard, StatusBadge, SectionHeader } from '@/components/ui';
import type { IconName } from '@/components/ui';
import type { GameType } from '@/types';

/* ─── Catálogo de juegos ─────────────────────────────────────────── */
const GAMES: { id: GameType; name: string; icon: IconName; image: string; soon?: boolean }[] = [
  { id: 'roulette',  name: 'Ruleta',    icon: 'roulette', image: '/games/roulette.webp' },
  { id: 'blackjack', name: 'Blackjack', icon: 'cards',    image: '/games/blackjack.webp' },
  { id: 'poker',     name: 'Poker',     icon: 'spade',    image: '/games/poker.webp', soon: true },
  { id: 'horses',    name: 'Caballos',  icon: 'horse',    image: '/games/caballos.webp' },
  { id: 'football',  name: 'Fútbol',    icon: 'ball',     image: '/games/futbol.webp' },
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
      <div className="ambient animate-fade-up space-y-5">
        <Balance value={balance} status={profile?.status} active={false} />
        <PendingNotice />
      </div>
    );
  }

  /* ── Jugador activo ── */
  return (
    <div className="ambient animate-fade-up space-y-6">
      <Balance value={balance} status={profile?.status} active />

      <SectionHeader
        eyebrow="Lobby"
        title="Jugá con los changos"
        action={
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'crear', label: 'Crear' },
              { value: 'unirse', label: 'Unirse' },
            ]}
          />
        }
      />

      {tab === 'crear' ? (
        <motion.div
          key="crear"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="space-y-5"
        >
          <Input
            label="Nombre de la mesa"
            placeholder={`Mesa de ${profile?.alias ?? 'changos'}`}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={28}
          />

          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">Elegí el juego</p>
              {picked && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-win-600 dark:text-win-400">
                  <Icon name="check" size={14} />
                  {GAMES.find((g) => g.id === picked)?.name}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {GAMES.map((g) => (
                <GameCard
                  key={g.id}
                  title={g.name}
                  image={g.image}
                  icon={g.icon}
                  aspect="portrait"
                  soon={g.soon}
                  selected={picked === g.id}
                  onClick={() => setPicked(g.id)}
                />
              ))}
            </div>
          </div>

          <Button
            variant="primary" size="lg" fullWidth
            loading={creating}
            disabled={!picked}
            onClick={handleCreate}
            rightIcon={<Icon name="arrowRight" size={18} />}
          >
            Crear mesa
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="unirse"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        >
          <Card className="space-y-5">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-brand-gradient text-white shadow-brand">
                <Icon name="users" size={26} />
              </div>
              <p className="mt-3 text-sm text-fg-muted">
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
              rightIcon={<Icon name="arrowRight" size={18} />}
            >
              Entrar a la mesa
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/* ── Saldo prominente (BalanceHero premium) ── */
function Balance({ value, status, active }: { value: number; status?: string; active: boolean }) {
  return (
    <BalanceHero
      value={value}
      caption={active ? 'Listo para jugar con los changos' : 'Esperando que un cajero active tu cuenta'}
      badge={
        status === 'active'
          ? <StatusBadge status="active" />
          : status === 'blocked'
            ? <StatusBadge status="blocked" />
            : <StatusBadge status="pending" />
      }
    />
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
