'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/contexts/RoomContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatChips } from '@/lib/format';

const GAME_ROUTES: Record<string, { label: string; icon: string }> = {
  roulette:  { label: 'Ruleta Europea',       icon: '🎡' },
  blackjack: { label: 'Blackjack 21',         icon: '🃏' },
  poker:     { label: "Texas Hold'em",        icon: '♠️' },
  horses:    { label: 'Carreras de Caballos', icon: '🏇' },
  football:  { label: 'Apuestas de Fútbol',  icon: '⚽' },
};

export default function RoomPage() {
  const params  = useParams();
  const code    = (params.code as string).toUpperCase();
  const { user } = useAuth();
  const { roomCode, roomName, gameType, players, balance, isHost, hostId, joinRoom } = useRoom();
  const router  = useRouter();
  const [copied,  setCopied]  = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    if (roomCode !== code) {
      setJoining(true);
      joinRoom(code).then(ok => {
        setJoining(false);
        if (!ok) { toast.error('Sala no encontrada'); router.push('/lobby'); }
      });
    }
  }, [user, code, roomCode, joinRoom, router]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('¡Código copiado!');
    setTimeout(() => setCopied(false), 2200);
  };

  /* Loading state */
  if (!user || joining || !roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #7f0000, #c0000a)' }}>
        <div className="text-center">
          <motion.div className="text-5xl mb-4"
            animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
            🎰
          </motion.div>
          <p className="text-white/70 font-semibold">Cargando sala...</p>
        </div>
      </div>
    );
  }

  const gameInfo = gameType ? GAME_ROUTES[gameType] : null;
  const isPoker  = gameType === 'poker';

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(145deg, #fff5f5 0%, #ffffff 60%, #fff0f0 100%)' }}>

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3.5
                          border-b border-brand-100 shadow-sm"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)' }}>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/lobby"
            className="flex-shrink-0 text-brand-300 hover:text-brand-700 transition-colors
                       text-sm font-semibold px-2 py-1 rounded-lg hover:bg-brand-50">
            ← Lobby
          </Link>
          <span className="text-brand-200 hidden sm:block">|</span>
          <h1 className="text-brand-800 font-black truncate max-w-[160px] sm:max-w-none">{roomName}</h1>
          {isHost && (
            <span className="flex-shrink-0 text-xs text-brand-700 font-bold bg-brand-50
                             border border-brand-200 px-2 py-0.5 rounded-full">
              👑 Host
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Saldo autoritativo (solo lectura) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full tabular-nums"
            style={{ background: '#fffbeb', border: '1px solid #ffe788' }}>
            <span className="text-sm">🪙</span>
            <span className="text-gold-700 font-black text-sm">{formatChips(balance)}</span>
          </div>

          <span className="text-gray-400 text-xs sm:text-sm hidden sm:block">👤 {user?.alias}</span>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Room code card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-6 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #7f0000, #b00000)',
            boxShadow: '0 8px 32px rgba(192,0,10,0.25)',
          }}>
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }} />
          <p className="relative text-white/50 text-xs mb-3 uppercase tracking-widest font-semibold">
            Código de la sala · Compartilo con tus amigos
          </p>
          <div className="relative flex items-center justify-center gap-4">
            <span className="text-4xl sm:text-5xl font-black tracking-[0.2em] text-white font-mono">
              {code}
            </span>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={copyCode}
              className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-brand-700 hover:bg-brand-50'
              }`}
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              {copied ? '✓ Copiado' : '📋 Copiar'}
            </motion.button>
          </div>
          <p className="relative text-white/35 text-xs mt-3">
            {players.length} jugador{players.length !== 1 ? 'es' : ''} en la sala
          </p>
        </motion.div>

        {/* Players card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-5 sm:p-6"
          style={{ background: 'white', border: '2px solid #ffc5c5', boxShadow: '0 4px 20px rgba(192,0,10,0.07)' }}>
          <h3 className="text-brand-700 font-black text-sm uppercase tracking-widest mb-4">
            👥 Jugadores en la Sala
          </h3>
          <div className="flex flex-wrap gap-2">
            {players.map(p => (
              <div key={p.socketId}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                  p.socketId === hostId
                    ? 'text-brand-700 font-bold'
                    : 'text-gray-600'
                }`}
                style={{
                  background: p.socketId === hostId ? '#fff5f5' : '#f9f9f9',
                  border: p.socketId === hostId ? '1.5px solid #ffc5c5' : '1.5px solid #f3f4f6',
                }}>
                {p.socketId === hostId && <span>👑</span>}
                <span>{p.alias}</span>
                <span className="text-gold-700 text-xs font-semibold tabular-nums">🪙 {formatChips(p.balance)}</span>
              </div>
            ))}
            {players.length === 0 && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <motion.div className="w-2 h-2 rounded-full bg-gold-400"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                Esperando jugadores...
              </div>
            )}
          </div>
        </motion.div>

        {/* Play button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-4">
          <p className="text-gray-400 text-sm mb-5">Esta sala está configurada para:</p>

          {gameInfo && isPoker && (
            <Link href={`/room/${code}/${gameType}`}>
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                className="inline-flex flex-col items-center gap-1 px-12 py-5 rounded-2xl
                           font-black text-xl cursor-pointer transition-all"
                style={{
                  background: 'linear-gradient(135deg, #1a1018, #2a1820)',
                  border: '1px solid rgba(232,185,35,0.35)',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
                }}>
                <span className="text-gold-200">{gameInfo.icon} {gameInfo.label}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-500">
                  🔧 En mantenimiento
                </span>
              </motion.div>
            </Link>
          )}

          {gameInfo && !isPoker && (
            <Link href={`/room/${code}/${gameType}`}>
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}
                className="inline-block px-12 py-5 rounded-2xl text-white font-black text-xl
                           cursor-pointer transition-all"
                style={{
                  background: 'linear-gradient(135deg, #9a0000, #c0000a)',
                  boxShadow: '0 8px 32px rgba(192,0,10,0.4)',
                }}>
                {gameInfo.icon} Jugar {gameInfo.label}
              </motion.div>
            </Link>
          )}

          <p className="text-gray-400 text-xs mt-4">
            🪙 Apostás con tu saldo real de fichas. Las ganancias se acreditan solas.
          </p>
        </motion.div>

        {/* Info strip */}
        <div className="grid grid-cols-3 gap-3 text-center pb-4">
          {[
            { icon: '🪙', label: 'Apuestas reales' },
            { icon: '🔒', label: 'Sala privada'    },
            { icon: '⚡', label: 'Pagos al instante' },
          ].map(item => (
            <div key={item.label} className="py-3 rounded-2xl"
              style={{ background: 'white', border: '1px solid #ffc5c5' }}>
              <div className="text-2xl mb-0.5">{item.icon}</div>
              <div className="text-xs text-brand-600 font-semibold">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
