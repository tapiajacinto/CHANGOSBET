'use client';
import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { BlackjackState, BJPlayer, Card } from '@/types';
import CardComponent from '@/components/ui/CardComponent';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CHIP_VALUES = [100, 500, 1000, 5000, 10000];
const CHIP_COLORS = ['#f8f9fa', '#e63946', '#4361ee', '#2dc653', '#7b2d8b'];

function handVal(hand: Card[]): number {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (!c.faceUp) continue;
    if (c.rank === 14) { aces++; total += 11; }
    else if (c.rank >= 11) total += 10;
    else total += c.rank;
  }
  while (total > 21 && aces-- > 0) total -= 10;
  return total;
}

interface Props { code: string; }

export default function BlackjackGame({ code }: Props) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [state, setState] = useState<BlackjackState | null>(null);
  const [selectedChip, setSelectedChip] = useState(500);
  const [betAmount, setBetAmount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    socket.on('blackjack:state', (s: BlackjackState) => {
      setState(s);
      if (s.phase === 'betting') setBetAmount(0);
    });
    socket.on('blackjack:timer', ({ timeLeft }: { timeLeft: number }) => {
      setState(prev => prev ? { ...prev, bettingTimeLeft: timeLeft } : prev);
    });

    return () => {
      socket.off('blackjack:state');
      socket.off('blackjack:timer');
    };
  }, [socket]);

  const myPlayer = state?.players.find(p => p.socketId === socket?.id);
  const isMyTurn = state?.currentPlayerSocketId === socket?.id;

  const placeBet = () => {
    if (!socket || !state || state.phase !== 'betting') return;
    socket.emit('blackjack:bet', { amount: betAmount });
    toast(`Apuesta de $${betAmount.toLocaleString()} confirmada`, { duration: 2000 });
  };

  const addChip = () => setBetAmount(prev => prev + selectedChip);

  const statusColor: Record<string, string> = {
    bust: 'text-red-500', blackjack: 'text-yellow-400', standing: 'text-blue-400',
    playing: 'text-green-400', done: 'text-gray-500', betting: 'text-gray-400', waiting: 'text-gray-400',
  };
  const statusLabel: Record<string, string> = {
    bust: '💥 BUST', blackjack: '🃏 BLACKJACK!', standing: '✋ STAND',
    playing: '▶ JUGANDO', done: '✓', betting: '💰 APOSTANDO', waiting: '⏳',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="felt-table p-6 min-h-96">
        {/* Dealer */}
        <div className="text-center mb-6">
          <p className="text-yellow-400/60 text-xs uppercase tracking-widest mb-2">🎩 Crupier</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {(state?.dealerHand ?? []).map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
                <CardComponent card={card} size="lg" animated />
              </motion.div>
            ))}
            {(state?.dealerHand?.length ?? 0) === 0 && (
              <div className="w-20 h-28 rounded-lg border-2 border-dashed border-yellow-400/20 flex items-center justify-center text-yellow-400/30">🃏</div>
            )}
          </div>
          {(state?.dealerHand?.length ?? 0) > 0 && state?.dealerHand && (
            <p className="text-white text-sm mt-2 font-bold">
              {state.phase === 'results' || state.phase === 'dealer'
                ? `Total: ${handVal(state.dealerHand)}`
                : `Muestra: ${handVal(state.dealerHand.filter(c => c.faceUp))}`}
            </p>
          )}
        </div>

        {/* Players */}
        <div className="flex gap-4 justify-center flex-wrap">
          {(state?.players ?? []).map(player => (
            <motion.div key={player.socketId}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className={`p-3 rounded-xl text-center min-w-32 ${
                player.socketId === socket?.id
                  ? 'bg-yellow-400/10 border-2 border-yellow-400/60'
                  : 'bg-white/5 border border-white/10'
              } ${isMyTurn && player.socketId === socket?.id ? 'ring-2 ring-green-400 animate-pulse' : ''}`}>

              <p className="text-xs font-bold text-yellow-400 mb-1">
                {player.alias}
                {player.socketId === socket?.id && ' (Tú)'}
              </p>

              <div className="flex gap-1 justify-center flex-wrap mb-2">
                {player.hand.map((card, i) => (
                  <CardComponent key={i} card={card} size="sm" animated />
                ))}
                {player.hand.length === 0 && player.status === 'waiting' && (
                  <div className="w-10 h-14 rounded border border-dashed border-white/20" />
                )}
              </div>

              {player.hand.length > 0 && (
                <p className="text-white text-xs font-bold">{handVal(player.hand)}</p>
              )}
              <p className={`text-xs mt-1 ${statusColor[player.status] || 'text-gray-400'}`}>
                {statusLabel[player.status] || player.status}
              </p>
              {player.bet > 0 && (
                <p className="text-yellow-400 text-xs mt-1">💰 ${player.bet.toLocaleString()}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Phase message */}
        {state?.phase === 'betting' && !myPlayer && (
          <p className="text-center text-gray-400 text-sm mt-4">Esperando apostadores...</p>
        )}
      </div>

      {/* Controls */}
      <div className="glass-card p-4 mt-4">
        {state?.phase === 'betting' && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-gray-400 text-sm">Apuesta:</p>
              <span className="text-yellow-400 font-bold text-xl">${betAmount.toLocaleString()}</span>
              <button onClick={() => setBetAmount(0)} className="text-red-400 text-xs hover:text-red-300">Borrar</button>
              <div className="ml-auto flex items-center gap-2">
                <span className={`text-2xl font-bold ${state.bettingTimeLeft <= 5 ? 'countdown-urgent' : 'text-yellow-400'}`}>
                  {state.bettingTimeLeft}s
                </span>
              </div>
            </div>

            <div className="flex gap-2 mb-3 flex-wrap">
              {CHIP_VALUES.map((v, i) => (
                <button key={v} onClick={() => { setSelectedChip(v); setBetAmount(prev => prev + v); }}
                  className="chip w-14 h-14"
                  style={{ background: CHIP_COLORS[i], color: v === 100 ? '#1a1a2e' : 'white' }}>
                  ${v >= 1000 ? v/1000+'K' : v}
                </button>
              ))}
            </div>

            <button onClick={placeBet} disabled={betAmount <= 0}
              className="casino-btn w-full py-3">
              ✅ Confirmar Apuesta de ${betAmount.toLocaleString()}
            </button>
          </div>
        )}

        {isMyTurn && state?.phase === 'playing' && (
          <div>
            <p className="text-green-400 font-bold text-center mb-3 animate-pulse">¡Es tu turno!</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => socket?.emit('blackjack:hit')}
                className="casino-btn px-8 py-3 bg-green-600 rounded-lg">
                ➕ Pedir
              </button>
              <button onClick={() => socket?.emit('blackjack:stand')}
                className="px-8 py-3 rounded-lg font-bold uppercase bg-red-700 hover:bg-red-600 text-white transition-colors">
                ✋ Plantarse
              </button>
              {myPlayer?.hand.length === 2 && (myPlayer?.balance ?? 0) >= (myPlayer?.bet ?? 0) && (
                <button onClick={() => socket?.emit('blackjack:double')}
                  className="px-8 py-3 rounded-lg font-bold uppercase bg-yellow-600 hover:bg-yellow-500 text-black transition-colors">
                  ×2 Doblar
                </button>
              )}
            </div>
          </div>
        )}

        {state?.phase === 'playing' && !isMyTurn && myPlayer?.status !== 'playing' && (
          <p className="text-center text-gray-400">
            Turno de: <span className="text-yellow-400 font-bold">
              {state.players.find(p => p.socketId === state.currentPlayerSocketId)?.alias ?? '...'}
            </span>
          </p>
        )}

        {state?.phase === 'results' && (
          <div className="text-center">
            <p className="text-yellow-400 font-bold text-lg mb-2">Ronda finalizada</p>
            {myPlayer && (
              <p className={`text-base ${myPlayer.status === 'bust' ? 'text-red-400' : 'text-green-400'}`}>
                Tu resultado: {statusLabel[myPlayer.status]}
              </p>
            )}
            <p className="text-gray-400 text-sm mt-2">Nueva ronda en unos segundos...</p>
          </div>
        )}

        {!state && (
          <p className="text-center text-gray-400">Conectando a la mesa...</p>
        )}
      </div>
    </div>
  );
}
