'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRoom } from '@/contexts/RoomContext';
import { useAuth } from '@/contexts/AuthContext';
import type { RouletteState, RouletteBetType } from '@/types';
import { buildBetNumbers } from '@/lib/gameLogic/roulette';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const MAX_BET_TIME = 20;

const CHIPS = [
  { value: 100,    label: '100',  bg: '#e2e8f0', fg: '#1a1a1a', glow: 'rgba(226,232,240,0.5)' },
  { value: 500,    label: '500',  bg: '#dc2626', fg: '#ffffff', glow: 'rgba(220,38,38,0.6)'   },
  { value: 1_000,  label: '1K',   bg: '#1d4ed8', fg: '#ffffff', glow: 'rgba(29,78,216,0.6)'   },
  { value: 5_000,  label: '5K',   bg: '#15803d', fg: '#ffffff', glow: 'rgba(21,128,61,0.6)'   },
  { value: 10_000, label: '10K',  bg: '#6d28d9', fg: '#ffffff', glow: 'rgba(109,40,217,0.6)'  },
] as const;

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
type BetAction = {
  id: string;
  type: RouletteBetType;
  key: string;
  numbers: number[];
  amount: number;
};

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function numColor(n: number) {
  return n === 0 ? 'green' : RED_NUMS.has(n) ? 'red' : 'black';
}

function fmtAmt(v: number): string {
  if (v >= 10_000) return `${(v / 1_000).toFixed(0)}K`;
  if (v >= 1_000)  return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function chipForAmount(amount: number) {
  let idx = 0;
  for (let i = CHIPS.length - 1; i >= 0; i--) {
    if (amount >= CHIPS[i].value) { idx = i; break; }
  }
  return CHIPS[idx];
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════ */

/** Circular SVG countdown timer */
function TimerRing({ timeLeft, max = MAX_BET_TIME }: { timeLeft: number; max?: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, timeLeft / max));
  const urgent = timeLeft <= 5;

  return (
    <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
      <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="44" cy="44" r={r} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        {/* Progress */}
        <circle cx="44" cy="44" r={r} fill="none"
          stroke={urgent ? '#ef4444' : '#c0000a'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.3s' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
        <span className={`font-black leading-none text-2xl ${
          urgent ? 'text-red-400' : 'text-white'
        } ${urgent ? 'animate-pulse' : ''}`}>
          {timeLeft}
        </span>
        <span className="text-[9px] text-white/30 uppercase tracking-wider">seg</span>
      </div>
    </div>
  );
}

/** Chip token rendered on top of a bet cell */
function BetToken({ amount }: { amount: number }) {
  const chip = chipForAmount(amount);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <motion.div
        initial={{ scale: 0, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 16, stiffness: 300 }}
        className="flex items-center justify-center rounded-full font-black select-none"
        style={{
          width: 28, height: 28,
          background: chip.bg,
          color: chip.fg,
          fontSize: 8,
          border: '2.5px dashed rgba(255,255,255,0.55)',
          boxShadow: `0 0 8px ${chip.glow}, 0 2px 4px rgba(0,0,0,0.7)`,
          textShadow: chip.fg === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
        }}>
        {fmtAmt(amount)}
      </motion.div>
    </div>
  );
}

/** Single chip button in the selector */
function ChipButton({
  chip, selected, onClick,
}: {
  chip: typeof CHIPS[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={`Ficha de $${chip.value.toLocaleString()}`}
      className="relative flex flex-col items-center justify-center rounded-full
                 font-black text-xs select-none transition-all cursor-pointer"
      style={{
        width: 52, height: 52,
        background: chip.bg,
        color: chip.fg,
        border: selected
          ? '3px solid rgba(255,255,255,0.9)'
          : '3px dashed rgba(255,255,255,0.25)',
        boxShadow: selected
          ? `0 0 20px ${chip.glow}, 0 4px 12px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.2)`
          : `0 2px 6px rgba(0,0,0,0.5)`,
        transform: selected ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        textShadow: chip.fg === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
      }}>
      {chip.label}
      {/* Inner ring decoration */}
      <div className="absolute inset-[6px] rounded-full pointer-events-none"
        style={{ border: `1px solid ${chip.fg}22` }} />
      {/* Selection dot */}
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black"
          style={{ background: '#ffd700' }} />
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
interface Props { code: string; }

export default function RouletteGame({ code: _code }: Props) {
  const { emit, on, off, myId } = useRoom();
  const { user: _u } = useAuth();

  const [state, setState]           = useState<RouletteState | null>(null);
  const [selectedChip, setSelectedChip] = useState<number>(500);
  const [wheelDeg, setWheelDeg]     = useState(0);
  const [spinning, setSpinning]     = useState(false);
  const [result, setResult]         = useState<number | null>(null);
  const [betActions, setBetActions] = useState<BetAction[]>([]);
  const [lastWin, setLastWin]       = useState<number | null>(null);
  const [showPayouts, setShowPayouts] = useState(false);

  /* Derived */
  const myBets = betActions.reduce<Record<string, number>>((acc, a) => {
    acc[a.key] = (acc[a.key] || 0) + a.amount;
    return acc;
  }, {});
  const totalBet  = betActions.reduce((s, a) => s + a.amount, 0);
  const betCount  = betActions.length;
  const bettingOpen = state?.phase === 'betting';

  /* ── Socket events ── */
  useEffect(() => {
    const onState = (s: unknown) => {
      const rs = s as RouletteState;
      setState(rs);
      if (rs.phase === 'betting') {
        setSpinning(false);
        setResult(null);
        setBetActions([]);
        setLastWin(null);
      }
    };
    const onSpin = (d: unknown) => {
      const { winningNumber } = d as { winningNumber: number };
      setSpinning(true);
      const idx = WHEEL_ORDER.indexOf(winningNumber);
      const finalDeg = idx * (360 / 37);
      setWheelDeg(prev => prev + 1440 + (360 - finalDeg));
    };
    const onResult = (d: unknown) => {
      const { winningNumber, winnings } = d as { winningNumber: number; winnings: Record<string, number> };
      setResult(winningNumber);
      setSpinning(false);
      if (myId && winnings[myId]) {
        setLastWin(winnings[myId]);
        toast.success(`🎉 ¡Ganaste $${winnings[myId].toLocaleString()}!`, { duration: 5000 });
      } else if (myId && totalBet > 0) {
        toast(`Número: ${winningNumber}. Sin ganancias esta vez.`, { duration: 3000 });
      }
    };
    const onTimer = (d: unknown) => {
      const { timeLeft } = d as { timeLeft: number };
      setState(prev => prev ? { ...prev, bettingTimeLeft: timeLeft } : prev);
    };

    on('roulette:state', onState);
    on('roulette:spin', onSpin);
    on('roulette:result', onResult);
    on('roulette:timer', onTimer);
    return () => {
      off('roulette:state', onState);
      off('roulette:spin', onSpin);
      off('roulette:result', onResult);
      off('roulette:timer', onTimer);
    };
  }, [on, off, myId, totalBet]);

  /* ── Actions ── */
  const placeBet = useCallback((type: RouletteBetType, numbers?: number[]) => {
    if (!state || state.phase !== 'betting') return;
    const nums = numbers ?? buildBetNumbers(type);
    const key  = type === 'straight' ? `straight_${nums[0]}` : type;
    emit('roulette:bet', { playerId: myId, type, numbers: nums, amount: selectedChip });
    setBetActions(prev => [...prev, {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type, key, numbers: nums, amount: selectedChip,
    }]);
  }, [state, emit, myId, selectedChip]);

  const undoLast = useCallback(() => {
    setBetActions(prev => prev.slice(0, -1));
  }, []);

  const clearAll = useCallback(() => {
    setBetActions([]);
  }, []);

  /* ── Wheel conic gradient ── */
  const conicGradient = WHEEL_ORDER.map((n, i) => {
    const p1 = (i / 37) * 100;
    const p2 = ((i + 1) / 37) * 100;
    const c  = n === 0 ? '#15803d' : RED_NUMS.has(n) ? '#991b1b' : '#111111';
    return `${c} ${p1}% ${p2}%`;
  }).join(', ');

  /* ── Render ── */
  return (
    <div className="flex flex-col lg:flex-row gap-3 w-full">

      {/* ══════════════════════════════════
          LEFT COLUMN — Wheel + Controls
      ══════════════════════════════════ */}
      <div className="w-full lg:w-[300px] flex-shrink-0 flex flex-col gap-3">

        {/* ── WHEEL CARD ── */}
        <div className="rounded-2xl p-4 flex flex-col items-center gap-4"
          style={{
            background: 'rgba(30,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          }}>

          {/* Phase + Timer row */}
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              {!state && (
                <p className="text-white/30 text-sm">Esperando al host...</p>
              )}
              {state?.phase === 'betting' && (
                <div>
                  <p className="text-white/50 text-[11px] uppercase tracking-widest font-semibold">
                    🎲 Fase de apuestas
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5 truncate">
                    {totalBet > 0
                      ? `$${totalBet.toLocaleString()} en ${betCount} apuesta${betCount !== 1 ? 's' : ''}`
                      : 'Colocá tus fichas'}
                  </p>
                </div>
              )}
              {state?.phase === 'spinning' && (
                <div>
                  <p className="text-white/50 text-[11px] uppercase tracking-widest">Girando...</p>
                  <motion.p className="text-yellow-300 font-bold text-sm mt-0.5"
                    animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                    🎡 Buena suerte...
                  </motion.p>
                </div>
              )}
              {state?.phase === 'result' && result !== null && (
                <div>
                  <p className="text-white/50 text-[11px] uppercase tracking-widest">Número ganador</p>
                  <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className={`text-5xl font-black leading-none mt-1 ${
                      numColor(result) === 'red'   ? 'text-red-400'   :
                      numColor(result) === 'green' ? 'text-green-400' : 'text-white'
                    }`}>
                    {result}
                    <span className={`ml-2 text-lg align-middle ${
                      numColor(result) === 'red'   ? 'text-red-400/60'   :
                      numColor(result) === 'green' ? 'text-green-400/60' : 'text-white/40'
                    }`}>
                      {numColor(result) === 'red' ? 'ROJO' : numColor(result) === 'green' ? 'VERDE' : 'NEGRO'}
                    </span>
                  </motion.p>
                </div>
              )}
            </div>

            {/* Timer — only during betting */}
            {state?.phase === 'betting' && (
              <TimerRing timeLeft={state.bettingTimeLeft ?? 0} />
            )}
          </div>

          {/* ── THE WHEEL ── */}
          <div className="relative" style={{ width: 256, height: 256 }}>

            {/* Outer wooden rim */}
            <div className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #78350f 0%, #d97706 25%, #78350f 50%, #d97706 75%, #78350f 100%)',
                boxShadow: [
                  '0 0 0 3px #92400e',
                  '0 0 30px rgba(0,0,0,0.9)',
                  '0 0 60px rgba(0,0,0,0.6)',
                  'inset 0 2px 4px rgba(255,255,255,0.15)',
                ].join(', '),
                padding: 8,
              }}>

              {/* Inner track ring */}
              <div className="w-full h-full rounded-full overflow-hidden relative"
                style={{
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                  border: '2px solid rgba(255,255,255,0.05)',
                }}>

                {/* Spinning sector wheel */}
                <motion.div
                  className="w-full h-full rounded-full relative"
                  style={{ background: `conic-gradient(${conicGradient})` }}
                  animate={{ rotate: wheelDeg }}
                  transition={{ duration: spinning ? 6.5 : 0, ease: [0.25, 0.1, 0.1, 1] }}>

                  {/* Sector dividers + numbers */}
                  {WHEEL_ORDER.map((n, i) => {
                    const angle = (i / 37) * 360 + (360 / 37 / 2);
                    return (
                      <div key={n} className="absolute font-bold text-white select-none"
                        style={{
                          fontSize: 7.5,
                          left: '50%', top: '50%',
                          transformOrigin: '0 0',
                          transform: `rotate(${angle}deg) translateY(-103px) rotate(-${angle}deg)`,
                          marginLeft: -4, marginTop: -5,
                          textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                          letterSpacing: 0,
                        }}>
                        {n}
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>

            {/* Pointer arrow */}
            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 z-30 select-none"
              style={{
                color: '#ffd700',
                fontSize: 20,
                filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
              }}>
              ▼
            </div>

            {/* Ball indicator when result */}
            {result !== null && !spinning && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="absolute z-30 rounded-full"
                style={{
                  width: 14, height: 14,
                  background: 'white',
                  boxShadow: '0 0 10px white, 0 2px 4px rgba(0,0,0,0.8)',
                  top: '50%', left: '50%',
                  marginTop: -7 - 96,
                  marginLeft: -7,
                }} />
            )}

            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 z-20 flex items-center justify-center
                            rounded-full font-black border-2 border-yellow-500/80"
              style={{
                width: 48, height: 48,
                marginTop: -24, marginLeft: -24,
                background: 'radial-gradient(circle at 35% 35%, #d97706, #78350f)',
                boxShadow: '0 0 16px rgba(0,0,0,0.9), 0 0 8px rgba(217,119,6,0.4)',
                color: 'white',
                fontSize: result !== null ? (result >= 10 ? 13 : 16) : 18,
                textShadow: '0 1px 3px rgba(0,0,0,0.7)',
              }}>
              {result !== null ? result : '●'}
            </div>
          </div>

          {/* Win banner */}
          <AnimatePresence>
            {lastWin !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -5 }}
                className="w-full text-center py-2.5 px-4 rounded-xl font-black text-lg"
                style={{
                  background: 'rgba(74,222,128,0.12)',
                  border: '1px solid rgba(74,222,128,0.3)',
                  color: '#86efac',
                  boxShadow: '0 0 20px rgba(74,222,128,0.15)',
                }}>
                🎉 +${lastWin.toLocaleString()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── CHIP SELECTOR + ACTIONS ── */}
        <div className="rounded-2xl p-4"
          style={{
            background: 'rgba(30,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          }}>

          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/45 text-[11px] uppercase tracking-widest font-semibold">
              Ficha seleccionada
            </p>
            {/* Action buttons */}
            <div className="flex gap-1.5">
              {/* Undo */}
              <button onClick={undoLast} disabled={betCount === 0}
                title="Deshacer última apuesta"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold
                           transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                style={{
                  background: betCount > 0 ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.05)',
                  border: betCount > 0 ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  color: betCount > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Deshacer</span>
              </button>
              {/* Clear */}
              <button onClick={clearAll} disabled={betCount === 0}
                title="Limpiar mesa"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold
                           transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                style={{
                  background: betCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                  border: betCount > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  color: betCount > 0 ? '#f87171' : 'rgba(255,255,255,0.3)',
                }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Chips row */}
          <div className="flex items-center gap-3 flex-wrap">
            {CHIPS.map(chip => (
              <ChipButton
                key={chip.value}
                chip={chip}
                selected={selectedChip === chip.value}
                onClick={() => setSelectedChip(chip.value)}
              />
            ))}
          </div>

          {/* Active bets summary */}
          <AnimatePresence>
            {totalBet > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 pt-3 border-t border-white/8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/40 text-xs uppercase tracking-wider">
                      {betCount} apuesta{betCount !== 1 ? 's' : ''} activa{betCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-yellow-300 font-black text-sm">
                      Total: ${totalBet.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 max-h-24 overflow-y-auto">
                    {Object.entries(myBets).map(([key, amt]) => (
                      <div key={key} className="flex justify-between items-center py-0.5">
                        <span className="text-white/35 text-xs truncate">{key.replace('straight_','#')}</span>
                        <span className="text-white/65 text-xs font-bold ml-2 flex-shrink-0">
                          ${amt.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── PAYOUT TABLE (collapsible) ── */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(30,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          }}>
          <button onClick={() => setShowPayouts(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left
                       hover:bg-white/4 transition-colors">
            <span className="text-white/45 text-[11px] uppercase tracking-widest font-semibold">
              Tabla de pagos
            </span>
            <motion.span className="text-white/30 text-xs"
              animate={{ rotate: showPayouts ? 180 : 0 }}>
              ▼
            </motion.span>
          </button>
          <AnimatePresence>
            {showPayouts && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden">
                <div className="px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ['Pleno (1 número)', '35:1'],
                    ['Rojo / Negro',     '1:1' ],
                    ['Par / Impar',      '1:1' ],
                    ['1–18 / 19–36',    '1:1' ],
                    ['Docena',          '2:1' ],
                    ['Columna',         '2:1' ],
                  ].map(([label, payout]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-white/35 text-xs">{label}</span>
                      <span className="text-yellow-300/80 text-xs font-black">{payout}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════
          RIGHT COLUMN — Betting Board
      ══════════════════════════════════ */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl overflow-hidden h-full flex flex-col"
          style={{
            background: 'rgba(30,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          }}>

          {/* Board status bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8
                          flex-shrink-0">
            <p className="text-white/35 text-[11px] uppercase tracking-widest font-semibold">
              Paño de apuestas
            </p>
            <div className="flex items-center gap-2">
              {bettingOpen && (
                <motion.div className="flex items-center gap-1.5"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Abierto</span>
                </motion.div>
              )}
              {state?.phase === 'spinning' && (
                <span className="text-yellow-400 text-xs font-bold">🎡 Girando...</span>
              )}
              {state?.phase === 'result' && (
                <span className="text-white/40 text-xs">Próxima ronda en breve</span>
              )}
              {!state && (
                <span className="text-white/25 text-xs">Esperando...</span>
              )}
            </div>
          </div>

          {/* Felt table */}
          <div className="p-2 sm:p-3 flex-1 flex flex-col justify-start overflow-x-auto">
            <div className="felt-table p-2 sm:p-3 min-w-[320px]">

              {/* ── ZERO ── */}
              <div className="flex gap-0.5 mb-0.5">
                <BetCell
                  label="0"
                  cellClass="green-cell"
                  hasBet={!!myBets['straight_0']}
                  amount={myBets['straight_0'] || 0}
                  disabled={!bettingOpen}
                  onClick={() => placeBet('straight', [0])}
                  title="0 — Paga 35:1"
                  tall
                />
              </div>

              {/* ── NUMBERS GRID 1–36 ── */}
              <div className="grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                {Array.from({ length: 12 }, (_, col) =>
                  [3, 2, 1].map(row => {
                    const n   = col * 3 + row;
                    const key = `straight_${n}`;
                    return (
                      <BetCell key={n}
                        label={String(n)}
                        cellClass={numColor(n) === 'red' ? 'red-cell' : 'black-cell'}
                        hasBet={!!myBets[key]}
                        amount={myBets[key] || 0}
                        disabled={!bettingOpen}
                        onClick={() => placeBet('straight', [n])}
                        title={`${n} — Paga 35:1`}
                      />
                    );
                  })
                ).flat()}
              </div>

              {/* ── OUTSIDE BETS ── */}
              <div className="grid grid-cols-6 gap-0.5 mb-0.5">
                {([
                  ['low',   '1–18',  'bg-green-900/50 text-yellow-200'],
                  ['even',  'PAR',   'bg-green-900/50 text-yellow-200'],
                  ['red',   '🔴',    'red-cell text-white'             ],
                  ['black', '⚫',    'black-cell text-white'           ],
                  ['odd',   'IMPAR', 'bg-green-900/50 text-yellow-200'],
                  ['high',  '19–36', 'bg-green-900/50 text-yellow-200'],
                ] as [RouletteBetType, string, string][]).map(([type, label, cls]) => (
                  <BetCell key={type}
                    label={label}
                    cellClass={cls}
                    hasBet={!!myBets[type]}
                    amount={myBets[type] || 0}
                    disabled={!bettingOpen}
                    onClick={() => placeBet(type)}
                    title={`${type} — Paga 1:1`}
                    small
                  />
                ))}
              </div>

              {/* ── DOZENS ── */}
              <div className="grid grid-cols-3 gap-0.5 mb-0.5">
                {(['dozen1','dozen2','dozen3'] as const).map((d, i) => (
                  <BetCell key={d}
                    label={`${i+1}ª Docena (${i*12+1}–${(i+1)*12})`}
                    cellClass="bg-green-900/40 text-yellow-200"
                    hasBet={!!myBets[d]}
                    amount={myBets[d] || 0}
                    disabled={!bettingOpen}
                    onClick={() => placeBet(d)}
                    title={`${i+1}ª Docena — Paga 2:1`}
                    small
                  />
                ))}
              </div>

              {/* ── COLUMNS ── */}
              <div className="grid grid-cols-3 gap-0.5">
                {(['col1','col2','col3'] as const).map((c, i) => (
                  <BetCell key={c}
                    label={`Columna ${i+1} (2:1)`}
                    cellClass="bg-green-900/40 text-yellow-200"
                    hasBet={!!myBets[c]}
                    amount={myBets[c] || 0}
                    disabled={!bettingOpen}
                    onClick={() => placeBet(c)}
                    title={`Columna ${i+1} — Paga 2:1`}
                    small
                  />
                ))}
              </div>
            </div>

            {/* Board footer info */}
            {bettingOpen && totalBet > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.2)',
                }}>
                <span className="text-yellow-400">💰</span>
                <span className="text-yellow-300/80 font-semibold">
                  ${totalBet.toLocaleString()} apostados en {Object.keys(myBets).length} tipo{Object.keys(myBets).length !== 1 ? 's' : ''}
                </span>
                <span className="ml-auto text-white/25">Usá Deshacer para corregir</span>
              </motion.div>
            )}
            {!bettingOpen && state && (
              <div className="mt-2 text-center py-2 text-xs text-white/20">
                {state.phase === 'spinning'
                  ? '🎡 Las apuestas están cerradas · Esperando resultado...'
                  : '⏳ Las apuestas abrirán en la próxima ronda'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BET CELL — reusable betting board cell
═══════════════════════════════════════════════ */
interface BetCellProps {
  label: string;
  cellClass: string;
  hasBet: boolean;
  amount: number;
  disabled: boolean;
  onClick: () => void;
  title?: string;
  tall?: boolean;
  small?: boolean;
}

function BetCell({ label, cellClass, hasBet, amount, disabled, onClick, title, tall, small }: BetCellProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        relative overflow-hidden font-bold text-center select-none
        bet-cell ${cellClass}
        transition-all duration-100
        ${tall  ? 'h-12 text-sm' : small ? 'h-8 text-[10px]' : 'h-9 text-[11px]'}
        ${hasBet
          ? 'ring-2 ring-inset ring-yellow-400 brightness-110'
          : ''}
        ${disabled
          ? 'opacity-55 cursor-not-allowed'
          : 'cursor-pointer hover:brightness-125 active:brightness-90'}
      `}>
      <span className={hasBet ? 'opacity-0' : ''}>{label}</span>
      {hasBet && <BetToken amount={amount} />}
    </button>
  );
}
