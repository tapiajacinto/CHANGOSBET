'use client';
import { useState, useEffect, useRef } from 'react';
import { useRoom } from '@/contexts/RoomContext';

export default function ChatPanel() {
  const { chatMessages, sendChat } = useRoom();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChat(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden" style={{ minHeight: 300 }}>
      <div className="px-3 py-2 border-b border-yellow-400/20">
        <h3 className="text-yellow-400 text-sm font-bold uppercase tracking-wider">💬 Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 400 }}>
        {chatMessages.length === 0 && (
          <p className="text-gray-600 text-xs text-center pt-4">Los mensajes aparecerán aquí...</p>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className={`font-bold ${msg.alias === 'Sistema' ? 'text-yellow-600' : msg.alias === 'Casino' ? 'text-green-400' : 'text-blue-400'}`}>
              {msg.alias}:&nbsp;
            </span>
            <span className="text-gray-300">{msg.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 p-2 border-t border-yellow-400/20">
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="Escribí algo..." maxLength={200}
          className="flex-1 px-3 py-2 rounded-lg text-sm text-white border border-white/10 focus:outline-none focus:border-yellow-400/50 transition-colors"
          style={{ background: 'rgba(10,10,20,0.8)' }} />
        <button type="submit"
          className="px-3 py-2 rounded-lg bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30 transition-colors text-sm font-bold">
          ➤
        </button>
      </form>
    </div>
  );
}
