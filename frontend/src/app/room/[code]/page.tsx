'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/contexts/RoomContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const GAME_ROUTES: Record<string, { label: string; icon: string }> = {
  roulette: { label: 'Ruleta Europea', icon: '🎡' },
  blackjack: { label: 'Blackjack', icon: '🃏' },
  poker: { label: 'Texas Hold\'em', icon: '♠️' },
  horses: { label: 'Carreras de Caballos', icon: '🏇' },
  football: { label: 'Apuestas de Fútbol', icon: '⚽' },
};

export default function RoomPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { user } = useAuth();
  const { roomCode, roomName, gameType, players, balance, isHost, hostId, joinRoom, reloadBalance } = useRoom();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    // If not connected to this room yet, join it
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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    reloadBalance();
    toast.success('¡$100,000 fichas cargadas!');
  };

  if (!user || joining || !roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a14' }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🎰</div>
          <p className="text-yellow-400">Cargando sala...</p>
        </div>
      </div>
    );
  }

  const gameInfo = gameType ? GAME_ROUTES[gameType] : null;

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at center, #12122a 0%, #0a0a14 100%)' }}>
      <header className="flex items-center justify-between px-4 py-3 border-b border-yellow-400/20">
        <div className="flex items-center gap-3">
          <Link href="/lobby" className="text-gray-500 hover:text-yellow-400 transition-colors text-sm">← Lobby</Link>
          <span className="text-gray-600">|</span>
          <h1 className="text-yellow-400 font-bold">{roomName}</h1>
          {isHost && <span className="text-xs text-yellow-400/60 bg-yellow-400/10 px-2 py-0.5 rounded-full">👑 Host</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">💰 <span className="text-yellow-400 font-bold">${balance.toLocaleString()}</span></div>
          {balance < 1000 && (
            <button onClick={handleReload} className="px-3 py-1 rounded-lg text-xs font-bold bg-green-800 hover:bg-green-700 text-green-300 transition-colors">
              🔄 Recargar
            </button>
          )}
          <span className="text-gray-500 text-sm">👤 {user?.alias}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6 text-center">
          <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Código de la sala · Compartilo con tus amigos</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold tracking-widest text-yellow-400 font-mono">{code}</span>
            <button onClick={copyCode}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                copied ? 'bg-green-600 text-white' : 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30'
              }`}>
              {copied ? '✓ Copiado' : '📋 Copiar'}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">{players.length} jugador{players.length !== 1 ? 'es' : ''} en la sala</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4 mb-6">
          <h3 className="text-yellow-400 font-bold mb-3 text-sm uppercase tracking-wider">Jugadores</h3>
          <div className="flex flex-wrap gap-2">
            {players.map(p => (
              <div key={p.socketId}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  p.socketId === hostId ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-white/5'
                }`}>
                {p.socketId === hostId && <span className="text-yellow-400">👑</span>}
                <span>{p.alias}</span>
                <span className="text-gray-500">${p.balance.toLocaleString()}</span>
              </div>
            ))}
            {players.length === 0 && <p className="text-gray-600 text-sm">Conectando jugadores...</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center">
          <p className="text-gray-400 mb-4">Esta sala está configurada para:</p>
          {gameInfo && (
            <Link href={`/room/${code}/${gameType}`} className="casino-btn inline-block px-10 py-5 text-xl rounded-xl">
              {gameInfo.icon} Jugar {gameInfo.label}
            </Link>
          )}
          <p className="text-gray-600 text-xs mt-3">El balance se recarga gratis si llegás a cero</p>
        </motion.div>
      </div>
    </div>
  );
}
