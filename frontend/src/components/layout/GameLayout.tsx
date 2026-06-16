'use client';
import { ReactNode, useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import ChatPanel from '@/components/chat/ChatPanel';

interface Props {
  code: string;
  gameName: string;
  gameIcon: string;
  children: ReactNode;
}

export default function GameLayout({ code, gameName, gameIcon, children }: Props) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [balance, setBalance] = useState(100000);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    if (!socket) return;
    const onBalance = ({ balance }: { balance: number }) => setBalance(balance);
    socket.on('balance:update', onBalance);
    // Re-sync balance when entering a game page
    socket.emit('room:request-state');
    return () => { socket.off('balance:update', onBalance); };
  }, [socket]);

  const reload = () => {
    socket?.emit('balance:reload');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at center, #0d1a24 0%, #0a0a14 100%)' }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-yellow-400/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/room/${code}`} className="text-gray-500 hover:text-yellow-400 transition-colors text-sm">
            ← Sala {code}
          </Link>
          <span className="text-gray-600">|</span>
          <span className="text-yellow-400 font-bold">{gameIcon} {gameName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg neon-border">
            <span className="text-yellow-400 font-bold text-sm">💰 ${balance.toLocaleString()}</span>
          </div>
          {balance < 500 && (
            <button onClick={reload}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-green-800 hover:bg-green-700 text-green-300 transition-colors animate-pulse">
              🔄 Recargar Gratis
            </button>
          )}
          <button onClick={() => setShowChat(!showChat)}
            className="px-3 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
            💬
          </button>
          <span className="text-gray-500 text-xs">👤 {user?.alias}</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
        {showChat && (
          <aside className="w-64 flex-shrink-0 border-l border-yellow-400/20 overflow-hidden">
            <ChatPanel roomCode={code} />
          </aside>
        )}
      </div>
    </div>
  );
}
