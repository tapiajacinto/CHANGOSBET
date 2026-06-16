'use client';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { HorsesState, Horse } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CHIP_VALUES = [100, 500, 1000, 5000, 10000];
const CHIP_COLORS = ['#f8f9fa', '#e63946', '#4361ee', '#2dc653', '#7b2d8b'];

interface Props { code: string; }

export default function HorsesGame({ code }: Props) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [state, setState] = useState<HorsesState | null>(null);
  const [selectedChip, setSelectedChip] = useState(500);
  const [positions, setPositions] = useState<number[]>(new Array(8).fill(0));
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [myBets, setMyBets] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ winnerId: number; winnerName: string; winnings: Record<string, number> } | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('horses:state', (s: HorsesState) => {
      setState(s);
      if (s.phase === 'betting') {
        setPositions(new Array(8).fill(0));
        setWinnerId(null);
        setResult(null);
        setMyBets({});
      }
    });

    socket.on('horses:timer', ({ timeLeft }: { timeLeft: number }) => {
      setState(prev => prev ? { ...prev, bettingTimeLeft: timeLeft } : prev);
    });

    socket.on('horses:frame', ({ positions: pos, winnerId: wId }: { positions: number[]; winnerId: number | null }) => {
      setPositions([...pos]);
      if (wId !== null) setWinnerId(wId);
    });

    socket.on('horses:result', (data: any) => {
      setResult(data);
      if (socket.id && data.winnings[socket.id]) {
        toast.success(`🏆 ¡Ganaste $${data.winnings[socket.id].toLocaleString()}!`, { duration: 4000 });
      } else {
        toast.error('Mala suerte en esta carrera', { duration: 2000 });
      }
    });

    return () => {
      socket.off('horses:state');
      socket.off('horses:timer');
      socket.off('horses:frame');
      socket.off('horses:result');
    };
  }, [socket]);

  const bet = (horseId: number) => {
    if (!socket || !state || state.phase !== 'betting') return;
    socket.emit('horses:bet', { horseId, amount: selectedChip });
    setMyBets(prev => ({ ...prev, [horseId]: (prev[horseId] || 0) + selectedChip }));
    toast(`$${selectedChip.toLocaleString()} en caballo #${horseId}`, { duration: 1500 });
  };

  if (!state) return <div className="text-center text-gray-400 pt-20">Cargando carrera...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Phase header */}
      <div className="glass-card p-3 mb-4 flex items-center justify-between">
        <div>
          {state.phase === 'betting' && (
            <div className="flex items-center gap-3">
              <span className="text-green-400 font-bold">🎲 Apostá a tu caballo</span>
              <span className={`text-2xl font-bold ${state.bettingTimeLeft <= 5 ? 'countdown-urgent' : 'text-yellow-400'}`}>
                {state.bettingTimeLeft}s
              </span>
            </div>
          )}
          {state.phase === 'racing' && <span className="text-yellow-400 font-bold animate-pulse">🏇 ¡Corriendo!</span>}
          {state.phase === 'result' && result && (
            <span className="text-yellow-400 font-bold">
              🏆 Ganador: <span style={{ color: state.horses.find(h => h.id === result.winnerId)?.color }}>
                {result.winnerName}
              </span>
            </span>
          )}
        </div>
        {state.phase === 'result' && (
          <span className="text-gray-400 text-sm">Nueva carrera en unos segundos...</span>
        )}
      </div>

      {/* Race track */}
      <div className="felt-table p-4 mb-4 overflow-hidden rounded-xl" style={{ background: 'linear-gradient(180deg, #1a3d1a 0%, #0d2b0d 100%)' }}>
        <p className="text-yellow-400/40 text-xs uppercase tracking-widest mb-3 text-center">PISTA DE CARRERAS</p>

        {state.horses.map((horse, i) => {
          const pos = positions[i] ?? 0;
          const pct = Math.min((pos / 100) * 100, 100);
          const isWinner = winnerId === horse.id;
          const myBetOnHorse = myBets[horse.id] ?? 0;

          return (
            <div key={horse.id} className={`mb-2 ${isWinner ? 'win-pulse rounded' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                <span className="text-xs font-bold" style={{ color: horse.color, minWidth: 100 }}>
                  {horse.name}
                </span>
                <span className="text-xs text-gray-500">x{horse.odds.toFixed(1)}</span>
                {myBetOnHorse > 0 && (
                  <span className="text-xs text-yellow-400">💰${myBetOnHorse.toLocaleString()}</span>
                )}
                {isWinner && <span className="text-yellow-400 text-xs font-bold ml-auto">🏆 GANADOR</span>}
              </div>

              {/* Track lane */}
              <div className="relative h-7 rounded-full border border-green-900" style={{ background: 'rgba(0,0,0,0.3)' }}>
                {/* Track stripes */}
                <div className="absolute inset-0 opacity-10 rounded-full overflow-hidden"
                  style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 42px)' }} />

                {/* Finish line */}
                <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-white/30" />

                {/* Horse */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 text-xl"
                  style={{ left: `${Math.max(0, pct - 4)}%` }}
                  transition={{ ease: 'linear' }}>
                  🏇
                </motion.div>

                {/* Progress bar */}
                <div className="absolute top-0 left-0 h-full rounded-full opacity-20 transition-all duration-100"
                  style={{ width: `${pct}%`, background: horse.color }} />
              </div>
            </div>
          );
        })}

        {/* Finish line indicator */}
        <div className="flex justify-end mt-1">
          <span className="text-gray-600 text-xs">🏁 Meta</span>
        </div>
      </div>

      {/* Betting panel */}
      {state.phase === 'betting' && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-gray-400 text-sm">Ficha:</p>
            {CHIP_VALUES.map((v, i) => (
              <button key={v} onClick={() => setSelectedChip(v)}
                className="chip w-12 h-12"
                style={{
                  background: CHIP_COLORS[i],
                  color: v === 100 ? '#1a1a2e' : 'white',
                  transform: selectedChip === v ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: selectedChip === v ? `0 0 12px ${CHIP_COLORS[i]}` : 'none',
                }}>
                ${v >= 1000 ? v/1000+'K' : v}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {state.horses.map(horse => (
              <button key={horse.id} onClick={() => bet(horse.id)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  myBets[horse.id] ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 hover:border-white/30'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: horse.color }} />
                  <span className="text-xs font-bold text-white">{horse.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400 text-sm font-bold">x{horse.odds.toFixed(1)}</span>
                  {myBets[horse.id] && (
                    <span className="text-green-400 text-xs">${myBets[horse.id].toLocaleString()}</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs">Paga x{horse.odds.toFixed(1)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
