'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [alias, setAlias] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.push('/lobby');
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = alias.trim();
    if (trimmed.length < 2) { setError('Mínimo 2 caracteres'); return; }
    if (trimmed.length > 20) { setError('Máximo 20 caracteres'); return; }
    login(trimmed);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
         style={{ background: 'radial-gradient(ellipse at center, #12122a 0%, #0a0a14 100%)' }}>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div key={i}
            className="absolute w-1 h-1 rounded-full bg-yellow-400 opacity-30"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [-20, 20], opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Card suits decoration */}
      <div className="absolute top-10 left-10 text-6xl opacity-10 text-yellow-400">♠</div>
      <div className="absolute top-10 right-10 text-6xl opacity-10 text-red-500">♥</div>
      <div className="absolute bottom-10 left-10 text-6xl opacity-10 text-red-500">♦</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-10 text-yellow-400">♣</div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <h1 className="text-6xl md:text-8xl font-bold mb-2 gold-glow" style={{ fontFamily: 'Georgia, serif' }}>
          🎰 CHANGOSBET
        </h1>
        <p className="text-yellow-400/70 text-lg tracking-widest uppercase">Casino Virtual Multijugador</p>
        <div className="flex gap-4 justify-center mt-3 text-2xl">
          <span>♠</span><span className="text-red-400">♥</span>
          <span className="text-red-400">♦</span><span>♣</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="glass-card p-8 w-full max-w-md mx-4"
      >
        <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">Entrar al Casino</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-yellow-400/70 mb-2 tracking-wider uppercase">
              Tu Alias de Jugador
            </label>
            <input
              type="text"
              value={alias}
              onChange={e => { setAlias(e.target.value); setError(''); }}
              placeholder="Ej: ElChangoCuliado"
              maxLength={20}
              className="w-full px-4 py-3 rounded-lg bg-casino-bg border border-yellow-400/30 text-white
                         focus:outline-none focus:border-yellow-400 transition-colors placeholder-gray-600
                         text-lg"
              style={{ background: 'rgba(10,10,20,0.8)' }}
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </div>

          <button type="submit" className="casino-btn w-full py-4 text-lg rounded-lg">
            🎲 Entrar a Jugar
          </button>
        </form>

        <div className="mt-6 p-4 rounded-lg bg-green-900/20 border border-green-700/30">
          <p className="text-green-400 text-sm text-center">
            💰 Recibes <strong>$100,000 fichas virtuales</strong> al entrar.
            Si te quedás sin plata, ¡recargás gratis!
          </p>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs text-gray-500">
          {['🎡 Ruleta', '🃏 Blackjack', '♠ Poker', '🏇 Caballos', '⚽ Fútbol'].map(g => (
            <div key={g} className="p-2 rounded bg-white/5">{g}</div>
          ))}
        </div>
      </motion.div>

      <p className="mt-6 text-gray-600 text-sm">Solo dinero ficticio · Sin pagos reales · Para jugar con amigos</p>
    </div>
  );
}
