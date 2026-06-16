'use client';
import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { PokerState, PokerPlayer } from '@/types';
import CardComponent from '@/components/ui/CardComponent';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PHASE_LABELS: Record<string, string> = {
  waiting: '⏳ Esperando jugadores (mín. 2)',
  'pre-flop': '🃏 Pre-Flop',
  flop: '🎴 Flop',
  turn: '🔄 Turn',
  river: '🌊 River',
  showdown: '🏆 Showdown',
};

const SEAT_POSITIONS = [
  { top: '85%', left: '50%' },
  { top: '70%', left: '85%' },
  { top: '40%', left: '95%' },
  { top: '10%', left: '75%' },
  { top: '5%', left: '50%' },
  { top: '10%', left: '25%' },
  { top: '40%', left: '5%' },
  { top: '70%', left: '15%' },
];

interface Props { code: string; }

export default function PokerGame({ code }: Props) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [state, setState] = useState<PokerState | null>(null);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [balance, setBalance] = useState(100000);

  useEffect(() => {
    if (!socket) return;
    socket.on('poker:state', (s: PokerState) => {
      setState(s);
      const me = s.players.find(p => p.socketId === socket.id);
      if (me) setBalance(me.balance);
    });
    socket.on('balance:update', ({ balance }: any) => setBalance(balance));
    return () => { socket.off('poker:state'); socket.off('balance:update'); };
  }, [socket]);

  const myPlayer = state?.players.find(p => p.socketId === socket?.id);
  const isMyTurn = state?.currentPlayerSocketId === socket?.id && !myPlayer?.folded && !myPlayer?.allIn;
  const canCheck = isMyTurn && (myPlayer?.bet ?? 0) >= (state?.currentBet ?? 0);
  const callAmount = Math.min((state?.currentBet ?? 0) - (myPlayer?.bet ?? 0), myPlayer?.balance ?? 0);

  const action = (type: string, amount?: number) => {
    socket?.emit('poker:action', { action: type, amount });
  };

  const startHand = () => socket?.emit('poker:start');
  const nextHand = () => socket?.emit('poker:next-hand');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Phase and Pot */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="glass-card px-4 py-2">
          <span className="text-yellow-400 font-bold">{PHASE_LABELS[state?.phase ?? 'waiting']}</span>
        </div>
        <div className="glass-card px-4 py-2 text-center">
          <p className="text-gray-400 text-xs">POZO</p>
          <p className="text-green-400 font-bold text-lg">${(state?.pot ?? 0).toLocaleString()}</p>
        </div>
        <div className="glass-card px-4 py-2">
          <p className="text-gray-400 text-xs">Tu balance</p>
          <p className="text-yellow-400 font-bold">${balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Poker Table */}
      <div className="poker-table-outer relative" style={{ height: 400, margin: '0 auto', maxWidth: 700 }}>
        {/* Community Cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 flex-col items-center">
          <div className="flex gap-2">
            {(state?.communityCards ?? []).map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.2 }}>
                <CardComponent card={card} size="md" />
              </motion.div>
            ))}
            {Array.from({ length: 5 - (state?.communityCards?.length ?? 0) }).map((_, i) => (
              <div key={i} className="w-14 h-20 rounded-lg border-2 border-dashed border-yellow-400/10" />
            ))}
          </div>
          {(state?.currentBet ?? 0) > 0 && (
            <div className="text-xs text-yellow-400/70 bg-black/30 px-2 py-1 rounded-full">
              Apuesta actual: ${state?.currentBet.toLocaleString()}
            </div>
          )}
        </div>

        {/* Players seated around the table */}
        {(state?.players ?? []).map((player, i) => {
          const pos = SEAT_POSITIONS[i % SEAT_POSITIONS.length];
          const isMe = player.socketId === socket?.id;
          const isCurrent = player.socketId === state?.currentPlayerSocketId;

          return (
            <motion.div key={player.socketId}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 text-center ${player.folded ? 'opacity-40' : ''}`}
              style={{ top: pos.top, left: pos.left }}>

              <div className={`glass-card px-2 py-1 min-w-20 ${
                isMe ? 'border-yellow-400/60' : ''
              } ${isCurrent ? 'ring-2 ring-green-400' : ''} ${
                player.folded ? 'opacity-50' : ''
              }`}>
                <p className="text-xs font-bold text-white truncate max-w-20">
                  {isMe ? '👤 Tú' : player.alias}
                </p>
                <p className="text-yellow-400 text-xs">${player.balance.toLocaleString()}</p>
                {player.bet > 0 && (
                  <p className="text-green-400 text-xs">Apuesta: ${player.bet.toLocaleString()}</p>
                )}
                {player.allIn && <p className="text-red-400 text-xs font-bold">ALL IN!</p>}
                {player.folded && <p className="text-gray-500 text-xs">FOLD</p>}
                {player.lastAction && !player.folded && (
                  <p className="text-blue-400 text-xs capitalize">{player.lastAction}</p>
                )}

                {/* Hole Cards (only visible for own hand or showdown) */}
                <div className="flex gap-1 justify-center mt-1">
                  {(player.holeCards ?? []).map((card, ci) => (
                    <CardComponent key={ci} card={card} size="sm" />
                  ))}
                  {player.handSize > 0 && player.holeCards?.length === 0 && (
                    Array.from({ length: player.handSize }).map((_, ci) => (
                      <div key={ci} className="card-back" style={{ width: 30, height: 42 }} />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Winners */}
      <AnimatePresence>
        {state?.phase === 'showdown' && state.winners.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card p-4 mt-4 text-center">
            <p className="text-yellow-400 text-xl font-bold mb-2">🏆 Ganadores</p>
            {state.winners.map(w => (
              <p key={w.socketId} className="text-green-400">
                {w.alias} ganó ${w.amount.toLocaleString()} con <span className="text-yellow-400">{w.handName}</span>
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Cards (enlarged) */}
      {myPlayer && myPlayer.holeCards.length > 0 && (
        <div className="glass-card p-4 mt-3 flex items-center gap-4">
          <div>
            <p className="text-gray-400 text-xs mb-2">Tus cartas</p>
            <div className="flex gap-2">
              {myPlayer.holeCards.map((c, i) => <CardComponent key={i} card={c} size="lg" />)}
            </div>
          </div>
          {myPlayer.bet > 0 && (
            <div className="ml-auto text-right">
              <p className="text-gray-400 text-xs">Tu apuesta</p>
              <p className="text-yellow-400 font-bold text-xl">${myPlayer.bet.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="glass-card p-4 mt-3">
        {state?.phase === 'waiting' && (
          <div className="text-center">
            <p className="text-gray-400 mb-3">
              {(state?.players?.length ?? 0) < 2 ? 'Esperando más jugadores...' : '¡Listo para empezar!'}
            </p>
            <button onClick={startHand}
              disabled={(state?.players?.length ?? 0) < 2}
              className="casino-btn px-10 py-3 rounded-lg">
              🃏 Iniciar Mano
            </button>
          </div>
        )}

        {isMyTurn && state?.phase !== 'waiting' && state?.phase !== 'showdown' && (
          <div>
            <p className="text-green-400 font-bold text-center mb-3 animate-pulse">¡Tu turno!</p>
            <div className="flex gap-2 flex-wrap justify-center mb-3">
              <button onClick={() => action('fold')}
                className="px-6 py-2 rounded-lg font-bold bg-red-800 hover:bg-red-700 text-white transition-colors">
                🃏 Fold
              </button>
              {canCheck ? (
                <button onClick={() => action('check')}
                  className="px-6 py-2 rounded-lg font-bold bg-blue-800 hover:bg-blue-700 text-white transition-colors">
                  ✓ Check
                </button>
              ) : (
                <button onClick={() => action('call')} disabled={callAmount <= 0}
                  className="px-6 py-2 rounded-lg font-bold bg-blue-800 hover:bg-blue-700 text-white transition-colors">
                  📞 Call ${callAmount.toLocaleString()}
                </button>
              )}
              <button onClick={() => action('allin')}
                className="px-6 py-2 rounded-lg font-bold bg-purple-800 hover:bg-purple-700 text-white transition-colors">
                🔥 All In
              </button>
            </div>

            {/* Raise */}
            <div className="flex gap-2 items-center justify-center">
              <input type="number" value={raiseAmount} onChange={e => setRaiseAmount(Number(e.target.value))}
                min={state?.minRaise ?? 0} max={myPlayer?.balance ?? 0} step={state?.bigBlindAmount ?? 100}
                className="w-32 px-3 py-2 rounded-lg border border-yellow-400/30 text-white text-center text-sm"
                style={{ background: 'rgba(10,10,20,0.8)' }}
                placeholder={`Min ${state?.minRaise}`}
              />
              <button onClick={() => action('raise', raiseAmount)} disabled={raiseAmount < (state?.minRaise ?? 0)}
                className="casino-btn px-6 py-2 rounded-lg text-sm">
                ↑ Raise
              </button>
            </div>
            <div className="flex gap-2 justify-center mt-2">
              {[state?.bigBlindAmount ?? 200, (state?.bigBlindAmount ?? 200) * 2, (state?.bigBlindAmount ?? 200) * 5].map(v => (
                <button key={v} onClick={() => setRaiseAmount(v)}
                  className="px-3 py-1 rounded text-xs bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                  ${v.toLocaleString()}
                </button>
              ))}
              <button onClick={() => setRaiseAmount(myPlayer?.balance ?? 0)}
                className="px-3 py-1 rounded text-xs bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 transition-colors">
                All In
              </button>
            </div>
          </div>
        )}

        {!isMyTurn && state?.phase !== 'waiting' && state?.phase !== 'showdown' && (
          <p className="text-center text-gray-400">
            {myPlayer?.folded ? '🃏 Te retiraste de esta mano' :
             `Turno de: ${state?.players.find(p => p.socketId === state.currentPlayerSocketId)?.alias ?? '...'}`}
          </p>
        )}

        {state?.phase === 'showdown' && (
          <div className="text-center">
            <button onClick={nextHand} className="casino-btn px-10 py-3 rounded-lg">
              ▶ Siguiente Mano
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
