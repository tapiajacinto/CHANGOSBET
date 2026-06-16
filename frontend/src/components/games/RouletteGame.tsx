'use client';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { RouletteState, RouletteBetType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

const CHIP_VALUES = [100, 500, 1000, 5000, 10000];
const CHIP_COLORS = ['#f8f9fa', '#e63946', '#4361ee', '#2dc653', '#7b2d8b'];

function numColor(n: number) {
  if (n === 0) return 'green';
  return RED.has(n) ? 'red' : 'black';
}

const OUTSIDE_BETS: { type: RouletteBetType; label: string; sub?: string }[] = [
  { type: 'low', label: '1-18', sub: 'Paga 1:1' },
  { type: 'even', label: 'PAR', sub: 'Paga 1:1' },
  { type: 'red', label: '🔴 ROJO', sub: 'Paga 1:1' },
  { type: 'black', label: '⚫ NEGRO', sub: 'Paga 1:1' },
  { type: 'odd', label: 'IMPAR', sub: 'Paga 1:1' },
  { type: 'high', label: '19-36', sub: 'Paga 1:1' },
  { type: 'dozen1', label: '1ª (1-12)', sub: 'Paga 2:1' },
  { type: 'dozen2', label: '2ª (13-24)', sub: 'Paga 2:1' },
  { type: 'dozen3', label: '3ª (25-36)', sub: 'Paga 2:1' },
  { type: 'col1', label: 'Col 1', sub: 'Paga 2:1' },
  { type: 'col2', label: 'Col 2', sub: 'Paga 2:1' },
  { type: 'col3', label: 'Col 3', sub: 'Paga 2:1' },
];

interface Props { code: string; }

export default function RouletteGame({ code }: Props) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [state, setState] = useState<RouletteState | null>(null);
  const [selectedChip, setSelectedChip] = useState(100);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('roulette:state', (s: RouletteState) => {
      setState(s);
      if (s.phase === 'betting') { setSpinning(false); setResult(null); setMyBets({}); }
    });

    socket.on('roulette:spin', ({ winningNumber }: { winningNumber: number }) => {
      setSpinning(true);
      const idx = WHEEL_ORDER.indexOf(winningNumber);
      const deg = idx * (360 / 37);
      setWheelRotation(prev => prev + 1440 + (360 - deg));
    });

    socket.on('roulette:result', ({ winningNumber, winnings }: any) => {
      setResult(winningNumber);
      setSpinning(false);
      const sid = socket.id as string;
      if (user && sid && winnings[sid]) {
        toast.success(`🎉 ¡Ganaste $${winnings[sid].toLocaleString()}!`, { duration: 4000 });
      }
    });

    socket.on('roulette:timer', ({ timeLeft }: { timeLeft: number }) => {
      setState(prev => prev ? { ...prev, bettingTimeLeft: timeLeft } : prev);
    });

    return () => {
      socket.off('roulette:state');
      socket.off('roulette:spin');
      socket.off('roulette:result');
      socket.off('roulette:timer');
    };
  }, [socket, user]);

  const placeBet = (type: RouletteBetType, numbers?: number[]) => {
    if (!socket || !state || state.phase !== 'betting') return;
    socket.emit('roulette:bet', { type, numbers: numbers ?? [], amount: selectedChip });
    setMyBets(prev => ({ ...prev, [type]: (prev[type] || 0) + selectedChip }));
    toast(`Apostaste $${selectedChip.toLocaleString()} a ${type}`, { duration: 1500 });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Left: Wheel */}
        <div className="flex flex-col items-center gap-4 lg:w-72">
          {/* Wheel */}
          <div className="relative w-64 h-64">
            <motion.div
              ref={wheelRef}
              className="w-64 h-64 rounded-full border-4 border-yellow-400 flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'conic-gradient(' + WHEEL_ORDER.map((n, i) => {
                  const pct1 = (i / 37) * 100;
                  const pct2 = ((i + 1) / 37) * 100;
                  const c = n === 0 ? '#1b4332' : RED.has(n) ? '#c0392b' : '#1a1a2e';
                  return `${c} ${pct1}% ${pct2}%`;
                }).join(', ') + ')',
                rotate: wheelRotation,
              }}
              animate={{ rotate: wheelRotation }}
              transition={{ duration: spinning ? 6 : 0, ease: 'easeOut' }}
            >
              {WHEEL_ORDER.map((n, i) => {
                const angle = (i / 37) * 360 + (360 / 37 / 2);
                return (
                  <div key={n} className="absolute text-white text-xs font-bold"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-100px) rotate(-${angle}deg)`,
                      fontSize: 9,
                    }}>
                    {n}
                  </div>
                );
              })}
            </motion.div>
            {/* Ball indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 shadow-lg flex items-center justify-center text-black font-bold text-sm z-10">
              {result !== null ? result : '●'}
            </div>
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-yellow-400 text-xl">▼</div>
          </div>

          {/* Phase / Timer */}
          <div className="glass-card p-4 text-center w-full">
            {state?.phase === 'betting' && (
              <div>
                <p className="text-green-400 font-bold text-sm uppercase tracking-wider">🎲 Apostá ahora</p>
                <p className={`text-3xl font-bold mt-1 ${state.bettingTimeLeft <= 5 ? 'countdown-urgent' : 'text-yellow-400'}`}>
                  {state.bettingTimeLeft}s
                </p>
              </div>
            )}
            {state?.phase === 'spinning' && (
              <p className="text-yellow-400 font-bold animate-pulse">🎡 Girando...</p>
            )}
            {state?.phase === 'result' && result !== null && (
              <div>
                <p className="text-gray-400 text-sm">Número ganador</p>
                <p className={`text-5xl font-bold ${numColor(result) === 'red' ? 'text-red-500' : numColor(result) === 'green' ? 'text-green-400' : 'text-white'}`}>
                  {result}
                </p>
                <p className="text-gray-400 text-xs mt-1 capitalize">{numColor(result)}</p>
              </div>
            )}
          </div>

          {/* Chip selector */}
          <div className="glass-card p-3 w-full">
            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Ficha seleccionada</p>
            <div className="flex gap-2 flex-wrap">
              {CHIP_VALUES.map((v, i) => (
                <button key={v} onClick={() => setSelectedChip(v)}
                  className="chip w-12 h-12 text-white text-xs"
                  style={{
                    background: CHIP_COLORS[i],
                    boxShadow: selectedChip === v ? `0 0 12px ${CHIP_COLORS[i]}` : 'none',
                    transform: selectedChip === v ? 'scale(1.15)' : 'scale(1)',
                    color: v === 100 ? '#1a1a2e' : 'white',
                  }}>
                  ${v >= 1000 ? v/1000+'K' : v}
                </button>
              ))}
            </div>
          </div>

          {/* My bets summary */}
          {Object.keys(myBets).length > 0 && (
            <div className="glass-card p-3 w-full">
              <p className="text-gray-400 text-xs mb-2 uppercase">Mis apuestas</p>
              {Object.entries(myBets).map(([type, amt]) => (
                <div key={type} className="flex justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-gray-300">{type}</span>
                  <span className="text-yellow-400">${amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Betting board */}
        <div className="flex-1">
          <div className="felt-table p-4">
            <p className="text-yellow-400/60 text-xs text-center mb-3 uppercase tracking-widest">Tablero de Apuestas</p>

            {/* Zero */}
            <div className="flex gap-1 mb-1">
              <button onClick={() => placeBet('straight', [0])}
                className="bet-cell green-cell rounded h-10 flex-1 text-white text-sm font-bold hover:opacity-80">
                0
              </button>
            </div>

            {/* Numbers grid 1-36 (3 columns) */}
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
              {Array.from({ length: 12 }, (_, col) => (
                [3 - 0, 2 - 0, 1 - 0].map(rowOffset => {
                  const n = col * 3 + (3 - rowOffset);
                  const c = numColor(n);
                  return (
                    <button key={n} onClick={() => placeBet('straight', [n])}
                      className={`bet-cell h-9 text-xs font-bold text-white rounded ${
                        c === 'red' ? 'red-cell' : 'black-cell'
                      }`}>
                      {n}
                      {myBets['straight'] && (
                        <span className="absolute top-0 right-0 text-yellow-400 text-xs">•</span>
                      )}
                    </button>
                  );
                })
              )).flat()}
            </div>

            {/* Outside bets */}
            <div className="grid grid-cols-6 gap-1 mb-1">
              {['low', 'even', 'red', 'black', 'odd', 'high'].map(type => (
                <button key={type} onClick={() => placeBet(type as RouletteBetType)}
                  className={`bet-cell h-9 rounded text-xs font-bold ${
                    type === 'red' ? 'red-cell text-white' :
                    type === 'black' ? 'black-cell text-white' :
                    'bg-green-900/30 text-yellow-400'
                  } ${myBets[type] ? 'ring-1 ring-yellow-400' : ''}`}>
                  {type === 'low' ? '1-18' : type === 'high' ? '19-36' :
                   type === 'even' ? 'PAR' : type === 'odd' ? 'IMPAR' :
                   type === 'red' ? '🔴' : '⚫'}
                  {myBets[type] && <span className="block text-yellow-400 text-xs">${(myBets[type]/1000).toFixed(0)}K</span>}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1 mb-1">
              {(['dozen1', 'dozen2', 'dozen3'] as const).map((d, i) => (
                <button key={d} onClick={() => placeBet(d)}
                  className={`bet-cell h-8 rounded text-xs font-bold text-yellow-400 bg-green-900/30 ${myBets[d] ? 'ring-1 ring-yellow-400' : ''}`}>
                  {i+1}ª Docena ({i*12+1}-{(i+1)*12})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1">
              {(['col1', 'col2', 'col3'] as const).map((c, i) => (
                <button key={c} onClick={() => placeBet(c)}
                  className={`bet-cell h-8 rounded text-xs font-bold text-yellow-400 bg-green-900/30 ${myBets[c] ? 'ring-1 ring-yellow-400' : ''}`}>
                  Columna {i+1} (2:1)
                </button>
              ))}
            </div>
          </div>

          {/* Quick payout reference */}
          <div className="glass-card p-3 mt-3 grid grid-cols-3 gap-2 text-xs">
            {[
              ['Pleno (1 núm.)', '35:1'],
              ['Rojo/Negro', '1:1'],
              ['Par/Impar', '1:1'],
              ['1-18 / 19-36', '1:1'],
              ['Docena', '2:1'],
              ['Columna', '2:1'],
            ].map(([name, pay]) => (
              <div key={name} className="flex justify-between gap-1">
                <span className="text-gray-400">{name}</span>
                <span className="text-yellow-400 font-bold">{pay}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
