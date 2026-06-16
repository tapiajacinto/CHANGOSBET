'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RoomInfo } from '@/types';
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
  const { socket } = useSocket();
  const router = useRouter();
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [balance, setBalance] = useState(100000);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    if (!socket) return;

    const onJoined = ({ room }: { room: RoomInfo }) => setRoom(room);
    const onUpdate = ({ room }: { room: RoomInfo }) => setRoom(room);
    const onBalance = ({ balance }: { balance: number }) => setBalance(balance);
    const onError = ({ message }: { message: string }) => {
      // If we're not in the room, try joining via code (user landed directly on URL)
      if (message === 'No estás en ninguna sala') {
        socket.emit('room:join', { code, alias: user.alias });
      }
    };

    socket.on('room:joined', onJoined);
    socket.on('room:update', onUpdate);
    socket.on('balance:update', onBalance);
    socket.on('error', onError);

    // Request current room state (covers redirect from lobby + direct URL load)
    socket.emit('room:request-state');

    return () => {
      socket.off('room:joined', onJoined);
      socket.off('room:update', onUpdate);
      socket.off('balance:update', onBalance);
      socket.off('error', onError);
    };
  }, [socket, user, router, code]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('¡Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const reloadBalance = () => {
    socket?.emit('balance:reload');
    toast.success('¡$100,000 fichas cargadas!');
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a14' }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🎰</div>
          <p className="text-yellow-400">Cargando sala...</p>
        </div>
      </div>
    );
  }

  const gameInfo = GAME_ROUTES[room.game];

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at center, #12122a 0%, #0a0a14 100%)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-yellow-400/20">
        <div className="flex items-center gap-3">
          <Link href="/lobby" className="text-gray-500 hover:text-yellow-400 transition-colors text-sm">
            ← Lobby
          </Link>
          <span className="text-gray-600">|</span>
          <h1 className="text-yellow-400 font-bold">{room.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            💰 <span className="text-yellow-400 font-bold">${balance.toLocaleString()}</span>
          </div>
          {balance < 1000 && (
            <button onClick={reloadBalance}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-green-800 hover:bg-green-700 text-green-300 transition-colors">
              🔄 Recargar
            </button>
          )}
          <span className="text-gray-500 text-sm">👤 {user?.alias}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Room code */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6 text-center">
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
          <p className="text-gray-500 text-xs mt-2">
            {room.players.length} jugador{room.players.length !== 1 ? 'es' : ''} en la sala
          </p>
        </motion.div>

        {/* Players */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-6">
          <h3 className="text-yellow-400 font-bold mb-3 text-sm uppercase tracking-wider">Jugadores</h3>
          <div className="flex flex-wrap gap-2">
            {room.players.map(p => (
              <div key={p.socketId}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  p.socketId === room.hostId ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-white/5'
                }`}>
                {p.socketId === room.hostId && <span className="text-yellow-400">👑</span>}
                <span>{p.alias}</span>
                <span className="text-gray-500">${p.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Go to game */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-center">
          <p className="text-gray-400 mb-4">Esta sala está configurada para:</p>
          <Link href={`/room/${code}/${room.game}`}
            className="casino-btn inline-block px-10 py-5 text-xl rounded-xl">
            {gameInfo?.icon} Jugar {gameInfo?.label}
          </Link>
          <p className="text-gray-600 text-xs mt-3">El balance se recarga gratis si llegás a cero</p>
        </motion.div>
      </div>
    </div>
  );
}
