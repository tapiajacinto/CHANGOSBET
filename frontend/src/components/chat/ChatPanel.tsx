'use client';
import { useState, useEffect, useRef } from 'react';
import { useRoom } from '@/contexts/RoomContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onClose?: () => void;
}

export default function ChatPanel({ onClose }: Props) {
  const { chatMessages, sendChat } = useRoom();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendChat(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const isSystem = (alias: string) => alias === 'Sistema' || alias === 'Casino';
  const isMe = (alias: string) => alias === user?.alias;

  return (
    <div className="flex flex-col h-full"
      style={{ background: 'rgba(15,0,0,0.92)', backdropFilter: 'blur(16px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-bold text-sm">Chat de la Sala</span>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center
                       text-white/40 hover:text-white transition-colors hover:bg-white/8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#7f0000 transparent' }}>

        {chatMessages.length === 0 && (
          <div className="text-center pt-8">
            <div className="text-3xl mb-2 opacity-30">💬</div>
            <p className="text-white/25 text-xs">Los mensajes aparecerán aquí</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {chatMessages.map((msg, i) => {
            if (isSystem(msg.alias)) {
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full text-xs italic"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: msg.alias === 'Casino' ? '#86efac' : 'rgba(255,255,255,0.4)',
                    }}>
                    {msg.alias === 'Casino' ? '🎰 ' : ''}{msg.message}
                  </span>
                </motion.div>
              );
            }

            const mine = isMe(msg.alias);
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8, x: mine ? 8 : -8 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                className={`flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}>

                {/* Alias */}
                {!mine && (
                  <span className="text-[10px] font-bold ml-1"
                    style={{ color: stringToColor(msg.alias) }}>
                    {msg.alias}
                  </span>
                )}

                {/* Bubble */}
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  mine ? 'rounded-tr-sm' : 'rounded-tl-sm'
                }`}
                  style={{
                    background: mine
                      ? 'linear-gradient(135deg, #9a0000, #c0000a)'
                      : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: mine ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: mine
                      ? '0 2px 8px rgba(192,0,10,0.3)'
                      : '0 1px 4px rgba(0,0,0,0.3)',
                  }}>
                  {msg.message}
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-white/20 mx-1">
                  {formatTime(msg.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send}
        className="flex items-center gap-2 px-3 py-3 flex-shrink-0 border-t border-white/8">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribí algo..."
          maxLength={200}
          className="flex-1 px-3.5 py-2 rounded-full text-sm text-white placeholder-white/25
                     focus:outline-none transition-all min-w-0"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(192,0,10,0.6)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
        <button type="submit"
          disabled={!input.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                     transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: input.trim()
              ? 'linear-gradient(135deg, #9a0000, #c0000a)'
              : 'rgba(255,255,255,0.08)',
          }}>
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}

/* ── Helpers ── */
function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function stringToColor(str: string): string {
  const colors = ['#f87171','#fb923c','#facc15','#4ade80','#60a5fa','#c084fc','#f472b6','#34d399'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
