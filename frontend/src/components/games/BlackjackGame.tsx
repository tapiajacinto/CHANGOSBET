'use client';
import { useState, useEffect } from 'react';
import { useRoom } from '@/contexts/RoomContext';
import type { BlackjackState, Card } from '@/types';
import CardComponent from '@/components/ui/CardComponent';
import { motion } from 'framer-motion';
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

const statusColor: Record<string, string> = {
  bust: 'text-red-500', blackjack: 'text-yellow-400', standing: 'text-blue-400',
  playing: 'text-green-400', done: 'text-gray-500', betting: 'text-gray-400', waiting: 'text-gray-400',
};
const statusLabel: Record<string, string> = {
  bust: '💥 BUST', blackjack: '🃏 BLACKJACK!', standing: '✋ STAND',
  playing: '▶ JUGANDO', done: '✓', betting: '💰 APOSTANDO', waiting: '⏳',
};

interface Props { code: string; }

export default function BlackjackGame({ code: _code }: Props) {
  const { emit, on, off, myId, balance, placeBet: debitBet } = useRoom();
  const [state, setState] = useState<BlackjackState | null>(null);
  const [betAmount, setBetAmount] = useState(0);

  useEffect(() => {
    const onState = (s: unknown) => {
      setState(s as BlackjackState);
      if ((s as BlackjackState).phase === 'betting') setBetAmount(0);
    };
    const onTimer = (d: unknown) => {
      const { timeLeft } = d as { timeLeft: number };
      setState(prev => prev ? { ...prev, bettingTimeLeft: timeLeft } : prev);
    };
    on('blackjack:state', onState);
    on('blackjack:timer', onTimer);
    return () => { off('blackjack:state', onState); off('blackjack:timer', onTimer); };
  }, [on, off]);

  const myPlayer = state?.players.find(p => p.socketId === myId);
  const isMyTurn = state?.currentPlayerSocketId === myId;

  const placeBet = async () => {
    if (!state || state.phase !== 'betting' || betAmount <= 0) return;
    const ok = await debitBet(betAmount);
    if (!ok) return;
    emit('blackjack:bet', { playerId: myId, amount: betAmount });
    toast(`Apuesta de $${betAmount.toLocaleString()} confirmada`, { duration: 2000 });
  };

  const action = async (type: 'hit' | 'stand' | 'double') => {
    if (type === 'double') {
      const miApuestaActual = myPlayer?.bet ?? 0;
      const ok = await debitBet(miApuestaActual);
      if (!ok) return;
    }
    emit(`blackjack:${type}`, { playerId: myId });
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
          {(state?.dealerHand?.length ?? 0) > 0 && (
            <p className="text-white text-sm mt-2 font-bold">
              {state?.phase === 'results' ? `Total: ${handVal(state.dealerHand)}` : `Muestra: ${handVal((state?.dealerHand ?? []).filter(c => c.faceUp))}`}
            </p>
          )}
        </div>

        {/* Players */}
        <div className="flex gap-4 justify-center flex-wrap">
          {(state?.players ?? []).map(player => (
            <motion.div key={player.socketId}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className={`p-3 rounded-xl text-center min-w-32 ${
                player.socketId === myId ? 'bg-yellow-400/10 border-2 border-yellow-400/60' : 'bg-white/5 border border-white/10'
              } ${isMyTurn && player.socketId === myId ? 'ring-2 ring-green-400 animate-pulse' : ''}`}>
              <p className="text-xs font-bold text-yellow-400 mb-1">
                {player.alias}{player.socketId === myId && ' (Tú)'}
              </p>
              <div className="flex gap-1 justify-center flex-wrap mb-2">
                {player.hand.map((card, i) => <CardComponent key={i} card={card} size="sm" animated />)}
                {player.hand.length === 0 && player.status === 'waiting' && (
                  <div className="w-10 h-14 rounded border border-dashed border-white/20" />
                )}
              </div>
              {player.hand.length > 0 && <p className="text-white text-xs font-bold">{handVal(player.hand)}</p>}
              <p className={`text-xs mt-1 ${statusColor[player.status] || 'text-gray-400'}`}>
                {statusLabel[player.status] || player.status}
              </p>
              {player.bet > 0 && <p className="text-yellow-400 text-xs mt-1">💰 ${player.bet.toLocaleString()}</p>}
            </motion.div>
          ))}
        </div>

        {!state && <p className="text-center text-gray-500 mt-8">Esperando al host para iniciar...</p>}
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
                <span className={`text-2xl font-bold ${(state?.bettingTimeLeft ?? 15) <= 5 ? 'countdown-urgent' : 'text-yellow-400'}`}>
                  {state?.bettingTimeLeft ?? 15}s
                </span>
              </div>
            </div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {CHIP_VALUES.map((v, i) => (
                <button key={v} onClick={() => setBetAmount(prev => prev + v)}
                  className="chip w-14 h-14"
                  style={{ background: CHIP_COLORS[i], color: v === 100 ? '#1a1a2e' : 'white' }}>
                  ${v >= 1000 ? v/1000+'K' : v}
                </button>
              ))}
            </div>
            <button onClick={placeBet} disabled={betAmount <= 0 || betAmount > balance}
              className="casino-btn w-full py-3 disabled:opacity-50">
              ✅ Confirmar Apuesta de ${betAmount.toLocaleString()}
            </button>
          </div>
        )}

        {isMyTurn && state?.phase === 'playing' && (
          <div>
            <p className="text-green-400 font-bold text-center mb-3 animate-pulse">¡Es tu turno!</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => action('hit')} className="casino-btn px-8 py-3 bg-green-600 rounded-lg">➕ Pedir</button>
              <button onClick={() => action('stand')} className="px-8 py-3 rounded-lg font-bold uppercase bg-red-700 hover:bg-red-600 text-white transition-colors">✋ Plantarse</button>
              {myPlayer?.hand.length === 2 && (myPlayer?.balance ?? 0) >= (myPlayer?.bet ?? 0) && (
                <button onClick={() => action('double')} className="px-8 py-3 rounded-lg font-bold uppercase bg-yellow-600 hover:bg-yellow-500 text-black transition-colors">×2 Doblar</button>
              )}
            </div>
          </div>
        )}

        {state?.phase === 'playing' && !isMyTurn && (
          <p className="text-center text-gray-400">
            Turno de: <span className="text-yellow-400 font-bold">
              {state.players.find(p => p.socketId === state.currentPlayerSocketId)?.alias ?? '...'}
            </span>
          </p>
        )}

        {state?.phase === 'results' && (
          <div className="text-center">
            <p className="text-yellow-400 font-bold text-lg">🃏 Resultados</p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {state.players.map(p => (
                <div key={p.socketId} className={`px-3 py-2 rounded-lg text-sm ${p.socketId === myId ? 'bg-yellow-400/20' : 'bg-white/5'}`}>
                  <span className="text-white">{p.alias}: </span>
                  <span className={statusColor[p.status]}>{statusLabel[p.status]}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-3">Nueva ronda en unos segundos...</p>
          </div>
        )}
      </div>
    </div>
  );
}
