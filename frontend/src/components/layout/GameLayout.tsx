'use client';
import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/contexts/RoomContext';
import Link from 'next/link';
import ChatPanel from '@/components/chat/ChatPanel';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  code: string;
  gameName: string;
  gameIcon: string;
  children: ReactNode;
}

export default function GameLayout({ code, gameName, gameIcon, children }: Props) {
  const { user } = useAuth();
  const { balance, reloadBalance } = useRoom();
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at top, #3a0000 0%, #1c0000 50%, #0a0000 100%)' }}>

      {/* ─── HEADER ─── */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-2.5 flex-shrink-0
                          border-b border-white/8 sticky top-0 z-40"
        style={{ background: 'rgba(20,0,0,0.85)', backdropFilter: 'blur(12px)' }}>

        {/* Left: breadcrumb + game name */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href={`/room/${code}`}
            className="flex items-center gap-1 text-white/40 hover:text-white/80
                       transition-colors text-xs sm:text-sm flex-shrink-0 group">
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Sala</span>
            <span className="font-mono font-bold">{code}</span>
          </Link>
          <span className="text-white/15">|</span>
          <span className="font-bold text-white text-sm truncate">
            {gameIcon} {gameName}
          </span>
        </div>

        {/* Right: balance + user + chat toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Balance pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
            <span className="text-yellow-300">💰</span>
            <span className="text-white">${balance.toLocaleString()}</span>
          </div>

          {/* Reload button - only when low */}
          <AnimatePresence>
            {balance < 500 && (
              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={reloadBalance}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           text-xs font-bold text-green-300 transition-all animate-pulse"
                style={{ background: 'rgba(22,101,52,0.5)', border: '1px solid rgba(74,222,128,0.3)' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recargar
              </motion.button>
            )}
          </AnimatePresence>

          {/* User badge */}
          <span className="hidden sm:block text-white/40 text-xs">
            👤 {user?.alias}
          </span>

          {/* Chat toggle */}
          <button onClick={() => setShowChat(v => !v)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
              showChat
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
            style={{
              background: showChat ? 'rgba(192,0,10,0.5)' : 'rgba(255,255,255,0.06)',
              border: showChat ? '1px solid rgba(255,100,100,0.4)' : '1px solid rgba(255,255,255,0.1)',
            }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── BODY ─── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Main game area */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 min-w-0">
          {children}
        </main>

        {/* Chat sidebar — desktop */}
        <AnimatePresence>
          {showChat && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden border-l border-white/8">
              <ChatPanel onClose={() => setShowChat(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Chat overlay — mobile */}
        <AnimatePresence>
          {showChat && (
            <>
              {/* Backdrop */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-[60]"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                onClick={() => setShowChat(false)} />
              {/* Panel */}
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="lg:hidden fixed top-0 right-0 bottom-0 w-80 z-[70] flex flex-col">
                <ChatPanel onClose={() => setShowChat(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
