'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/contexts/RoomContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { GameType } from '@/types';

const GAMES = [
  { id: 'roulette', name: 'Ruleta Europea', icon: '🎡', desc: 'Apostá a números, colores y docenas. La bolita decide tu destino.', color: '#e63946' },
  { id: 'blackjack', name: 'Blackjack', icon: '🃏', desc: 'Llegá a 21 antes que el crupier. Varios jugadores en la misma mesa.', color: '#4361ee' },
  { id: 'poker', name: 'Texas Hold\'em', icon: '♠️', desc: 'Poker completo con ciegas, flop, turn, river y showdown.', color: '#7b2d8b' },
  { id: 'horses', name: 'Carreras de Caballos', icon: '🏇', desc: 'Apostá a tu caballo favorito y miralo correr en vivo.', color: '#f77f00' },
  { id: 'football', name: 'Apuestas de Fútbol', icon: '⚽', desc: 'Partidos simulados con equipos reales. 1X2, BTTS, Over/Under.', color: '#2dc653' },
];

export default function LobbyPage() {
  const { user, logout } = useAuth();
  const { connected, createRoom, joinRoom } = useRoom();
  const router = useRouter();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameType>('roulette');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  const handleCreate = async () => {
    if (!roomName.trim()) { toast.error('Ponele un nombre a la sala'); return; }
    setLoading(true);
    const code = await createRoom(roomName.trim(), selectedGame);
    setLoading(false);
    if (code) {
      toast.success(`Sala creada: ${code}`);
      router.push(`/room/${code}`);
    } else {
      toast.error('Error al crear la sala. Verificá la conexión a Supabase.');
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error('El código tiene 6 caracteres'); return; }
    setLoading(true);
    const ok = await joinRoom(code);
    setLoading(false);
    if (ok) {
      router.push(`/room/${code}`);
    } else {
      toast.error('Sala no encontrada. Verificá el código.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at center, #12122a 0%, #0a0a14 100%)' }}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20">
        <h1 className="text-2xl font-bold gold-glow">🎰 CHANGOSBET</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-500'}`} />
            <span className="text-sm text-gray-400">{connected ? 'Conectado' : 'Conectando...'}</span>
          </div>
          <span className="text-yellow-400">👤 {user.alias}</span>
          <button onClick={logout} className="text-gray-500 hover:text-red-400 text-sm transition-colors">Salir</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Bienvenido, <span className="text-yellow-400">{user.alias}</span></h2>
          <p className="text-gray-400 mt-1">Creá una sala o unite con el código de tu amigo</p>
        </motion.div>

        <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit mx-auto" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['create', 'join'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-lg font-bold transition-all text-sm uppercase tracking-wider ${
                tab === t ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
              }`}>
              {t === 'create' ? '🏠 Crear Sala' : '🔑 Unirse'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <motion.div key="create" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-yellow-400 mb-5">Nueva Sala Privada</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">Nombre de la sala</label>
                <input value={roomName} onChange={e => setRoomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Ej: Mesa VIP de los Changos"
                  className="w-full px-4 py-3 rounded-lg border border-yellow-400/30 text-white focus:outline-none focus:border-yellow-400 transition-colors"
                  style={{ background: 'rgba(10,10,20,0.8)' }} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-3 uppercase tracking-wider">Elegí el juego</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GAMES.map(game => (
                    <button key={game.id} onClick={() => setSelectedGame(game.id as GameType)}
                      className={`p-3 rounded-lg text-left transition-all border ${
                        selectedGame === game.id ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 hover:border-white/30'
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{game.icon}</span>
                        <span className="font-bold text-sm text-white">{game.name}</span>
                      </div>
                      <p className="text-xs text-gray-400">{game.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreate} disabled={loading}
                className="casino-btn w-full py-4 text-base rounded-lg mt-2 disabled:opacity-50">
                {loading ? '⏳ Creando...' : '🎲 Crear Sala'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-yellow-400 mb-5">Unirse a una Sala</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">Código de sala (6 caracteres)</label>
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="Ej: ABC123" maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-yellow-400/30 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-yellow-400 transition-colors"
                  style={{ background: 'rgba(10,10,20,0.8)' }} />
              </div>
              <button onClick={handleJoin} disabled={loading}
                className="casino-btn w-full py-4 text-base rounded-lg disabled:opacity-50">
                {loading ? '⏳ Entrando...' : '🚪 Entrar a la Sala'}
              </button>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-700/30">
              <p className="text-blue-300 text-sm text-center">
                Pedile el código a quien creó la sala.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
