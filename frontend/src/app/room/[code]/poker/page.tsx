'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GameLayout from '@/components/layout/GameLayout';
// NOTA: PokerGame queda disponible para el futuro (no se renderiza mientras esté en mantenimiento).
// import PokerGame from '@/components/games/PokerGame';

export default function PokerPage() {
  const { code } = useParams<{ code: string }>();

  return (
    <GameLayout code={code} gameName="Texas Hold'em" gameIcon="♠️">
      <div className="min-h-full flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl p-8 sm:p-10 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1a1018 0%, #140a10 60%, #0c0608 100%)',
            border: '1px solid rgba(232,185,35,0.30)',
            boxShadow: '0 24px 70px -20px rgba(0,0,0,0.7), 0 0 60px -30px rgba(232,185,35,0.5)',
          }}
        >
          {/* Patrón sutil de fieltro */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #e8b923 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />

          {/* Símbolo */}
          <motion.div
            className="relative text-7xl sm:text-8xl mb-5"
            animate={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            ♠️
          </motion.div>

          <div className="relative inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full
                          text-[11px] font-black uppercase tracking-[0.18em]"
            style={{ background: 'rgba(232,185,35,0.12)', border: '1px solid rgba(232,185,35,0.4)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-gold-300">En mantenimiento</span>
          </div>

          <h1 className="relative text-3xl sm:text-4xl font-black mb-3">
            <span className="text-gold-200">Poker — Próximamente</span>
          </h1>

          <p className="relative text-white/55 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8">
            Estamos integrando el Texas Hold&apos;em a la nueva economía de fichas con
            apuestas reales. Las ciegas y los pozos por mano necesitan un débito por jugador
            que estamos terminando de ajustar para que tu saldo siempre cuadre.
            <br className="hidden sm:block" />
            Volvé pronto: la mesa abre apenas esté lista. ♠️♥️♣️♦️
          </p>

          <Link href={`/room/${code}`}>
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl
                         font-black text-white cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, #9a0000, #c0000a)',
                boxShadow: '0 10px 30px -8px rgba(192,0,10,0.55)',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a la sala
            </motion.div>
          </Link>

          <p className="relative text-white/25 text-xs mt-6">
            Mientras tanto, probá la Ruleta, el Blackjack, los Caballos o el Fútbol.
          </p>
        </motion.div>
      </div>
    </GameLayout>
  );
}
