'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/contexts/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { GameType } from '@/types';

const GAMES = [
  { id: 'roulette',  name: 'Ruleta Europea',        icon: '🎡',
    desc: 'Apostá a números, colores y docenas. La bolita decide tu destino.' },
  { id: 'blackjack', name: 'Blackjack 21',           icon: '🃏',
    desc: 'Llegá a 21 antes que el crupier. Jugá con tus amigos.' },
  { id: 'poker',     name: "Texas Hold'em",           icon: '♠️',
    desc: 'Poker completo con flop, turn, river y showdown.' },
  { id: 'horses',    name: 'Carreras de Caballos',   icon: '🏇',
    desc: 'Apostá a tu caballo favorito y miralo correr en vivo.' },
  { id: 'football',  name: 'Apuestas de Fútbol',     icon: '⚽',
    desc: 'Partidos simulados con equipos reales. 1X2, BTTS, Over/Under.' },
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(145deg, #fff5f5 0%, #ffffff 50%, #fff0f0 100%)' }}>

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-4
                          border-b border-red-100 shadow-sm"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)' }}>

        <div className="flex items-center gap-2.5">
          <span className="text-xl">🃏</span>
          <span className="font-black text-red-700 text-lg">CHANGOSBET</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Connection indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ boxShadow: connected ? '0 0 6px #22c55e' : '0 0 6px #eab308' }} />
            <span className="text-xs text-gray-400 font-medium">
              {connected ? 'Conectado' : 'Conectando...'}
            </span>
          </div>

          {/* User chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
            <span className="text-sm">👤</span>
            <span className="text-red-700 font-bold text-sm">{user.alias}</span>
          </div>

          <button onClick={logout}
            className="text-gray-400 hover:text-red-600 text-xs sm:text-sm font-semibold
                       transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
            Salir
          </button>
        </div>
      </header>

      {/* ─── HERO WELCOME ─── */}
      <div className="relative overflow-hidden px-4 pt-12 pb-8 text-center">
        {/* Messi background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/messi-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
          }} />
        {/* Dark red overlay — mantiene legibilidad */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(80,0,0,0.88) 0%, rgba(140,0,0,0.78) 50%, rgba(80,0,0,0.92) 100%)' }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10">
          <div className="text-4xl mb-3">🎰</div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Bienvenido, <span style={{ color: '#ffcdd2' }}>{user.alias}</span>
          </h2>
          <p className="text-white/55 text-sm sm:text-base">
            Creá una sala privada o unite a la de un amigo con su código
          </p>
        </motion.div>
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-8">
            <path d="M0,20 C480,40 960,0 1440,20 L1440,40 L0,40 Z"
              style={{ fill: 'linear-gradient(145deg, #fff5f5, #ffffff)' }} fill="#fff5f5" />
          </svg>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex gap-1 p-1.5 rounded-2xl w-fit mx-auto mb-8"
          style={{ background: '#fff0f0', border: '1px solid #fecaca' }}>
          {(['create', 'join'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 sm:px-8 py-2.5 rounded-xl font-black text-sm uppercase tracking-wider
                          transition-all ${
                t === tab
                  ? 'text-white shadow-lg'
                  : 'text-red-400 hover:text-red-600'
              }`}
              style={t === tab ? {
                background: 'linear-gradient(135deg, #9a0000, #c0000a)',
                boxShadow: '0 4px 14px rgba(192,0,10,0.35)',
              } : {}}>
              {t === 'create' ? '🏠 Crear Sala' : '🔑 Unirse'}
            </button>
          ))}
        </div>

        {/* ─── CREATE TAB ─── */}
        <AnimatePresence mode="wait">
          {tab === 'create' ? (
            <motion.div key="create" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <div className="rounded-3xl p-6 sm:p-8"
                style={{
                  background: 'white',
                  border: '2px solid #fecaca',
                  boxShadow: '0 8px 32px rgba(192,0,10,0.08)',
                }}>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'linear-gradient(135deg, #9a0000, #c0000a)' }}>
                    🏠
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-red-700">Nueva Sala Privada</h3>
                    <p className="text-gray-400 text-xs">Solo vos y tus amigos</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Room name */}
                  <div>
                    <label className="block text-xs font-black text-red-700 mb-2 uppercase tracking-widest">
                      Nombre de la sala
                    </label>
                    <input value={roomName} onChange={e => setRoomName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      placeholder="Ej: Mesa VIP de los Changos"
                      className="w-full px-4 py-3.5 rounded-xl text-gray-800 text-base
                                 focus:outline-none transition-all"
                      style={{ border: '2px solid #fecaca', background: '#fff5f5' }}
                      onFocus={e => (e.target.style.borderColor = '#c0000a')}
                      onBlur={e => (e.target.style.borderColor = '#fecaca')}
                    />
                  </div>

                  {/* Game selection */}
                  <div>
                    <label className="block text-xs font-black text-red-700 mb-3 uppercase tracking-widest">
                      Elegí el juego
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {GAMES.map(game => (
                        <button key={game.id} onClick={() => setSelectedGame(game.id as GameType)}
                          className={`p-4 rounded-2xl text-left transition-all border-2 group ${
                            selectedGame === game.id
                              ? 'border-red-500 shadow-md'
                              : 'border-red-100 hover:border-red-300'
                          }`}
                          style={{
                            background: selectedGame === game.id
                              ? 'linear-gradient(135deg, #fff0f0, #fff5f5)'
                              : 'white',
                          }}>
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-2xl transition-transform ${
                              selectedGame === game.id ? 'scale-110' : 'group-hover:scale-105'
                            }`}>
                              {game.icon}
                            </span>
                            <span className={`font-black text-sm ${
                              selectedGame === game.id ? 'text-red-700' : 'text-gray-700'
                            }`}>
                              {game.name}
                            </span>
                            {selectedGame === game.id && (
                              <span className="ml-auto text-red-500 text-sm">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed pl-9">{game.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleCreate} disabled={loading}
                    className="w-full py-4 rounded-2xl text-white font-black text-base
                               transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: loading
                        ? '#9ca3af'
                        : 'linear-gradient(135deg, #9a0000, #c0000a)',
                      boxShadow: loading ? 'none' : '0 6px 24px rgba(192,0,10,0.35)',
                    }}>
                    {loading ? '⏳ Creando sala...' : '🎲 Crear Sala Privada'}
                  </motion.button>
                </div>
              </div>
            </motion.div>

          ) : (
            /* ─── JOIN TAB ─── */
            <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="rounded-3xl p-6 sm:p-8 max-w-md mx-auto"
                style={{
                  background: 'white',
                  border: '2px solid #fecaca',
                  boxShadow: '0 8px 32px rgba(192,0,10,0.08)',
                }}>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'linear-gradient(135deg, #9a0000, #c0000a)' }}>
                    🔑
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-red-700">Unirse a una Sala</h3>
                    <p className="text-gray-400 text-xs">Ingresá el código de 6 letras</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-red-700 mb-2 uppercase tracking-widest">
                      Código de sala (6 caracteres)
                    </label>
                    <input value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      placeholder="ABC123" maxLength={6}
                      className="w-full px-4 py-4 rounded-xl text-gray-800 text-center
                                 text-3xl tracking-[0.4em] font-black focus:outline-none transition-all"
                      style={{ border: '2px solid #fecaca', background: '#fff5f5' }}
                      onFocus={e => (e.target.style.borderColor = '#c0000a')}
                      onBlur={e => (e.target.style.borderColor = '#fecaca')}
                    />
                  </div>

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleJoin} disabled={loading}
                    className="w-full py-4 rounded-2xl text-white font-black text-base
                               transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: loading
                        ? '#9ca3af'
                        : 'linear-gradient(135deg, #9a0000, #c0000a)',
                      boxShadow: loading ? 'none' : '0 6px 24px rgba(192,0,10,0.35)',
                    }}>
                    {loading ? '⏳ Buscando sala...' : '🚪 Entrar a la Sala'}
                  </motion.button>
                </div>

                <div className="mt-6 p-4 rounded-2xl flex items-start gap-3"
                  style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
                  <span className="text-xl flex-shrink-0">💡</span>
                  <p className="text-red-500 text-sm leading-relaxed">
                    Pedile el código de 6 caracteres a quien creó la sala.
                    El código aparece cuando entrás a la sala.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick info strip */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '♾️', label: 'Fichas ilimitadas' },
            { icon: '🔒', label: 'Solo tus amigos' },
            { icon: '🆓', label: '100% gratuito' },
          ].map(item => (
            <div key={item.label} className="py-3 px-2 rounded-2xl"
              style={{ background: 'white', border: '1px solid #fecaca' }}>
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs text-red-500 font-semibold">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
