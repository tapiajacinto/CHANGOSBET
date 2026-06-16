'use client';
import { useState, useEffect } from 'react';
import { useRoom } from '@/contexts/RoomContext';
import type { FootballState, FootballMatch, FootballBetType } from '@/types';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CHIP_VALUES = [100, 500, 1000, 5000, 10000];
const CHIP_COLORS = ['#f8f9fa', '#e63946', '#4361ee', '#2dc653', '#7b2d8b'];

interface BetSlip { matchId: string; betType: FootballBetType; odds: number; amount: number; matchLabel: string; }

interface Props { code: string; }

export default function FootballGame({ code: _code }: Props) {
  const { emit, on, off, myId } = useRoom();
  const [state, setState] = useState<FootballState | null>(null);
  const [selectedChip, setSelectedChip] = useState(500);
  const [betSlips, setBetSlips] = useState<BetSlip[]>([]);
  const [liveScores, setLiveScores] = useState<Record<string, { home: number; away: number }>>({});
  const [liveEvents, setLiveEvents] = useState<Array<{ matchId: string; event: { description: string } }>>([]);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const onState = (s: unknown) => {
      const fs = s as FootballState;
      setState(fs);
      if (fs.phase === 'betting') { setLiveScores({}); setLiveEvents([]); setResults(null); setBetSlips([]); }
    };
    const onTimer = (d: unknown) => {
      const { timeLeft } = d as { timeLeft: number };
      setState(prev => prev ? { ...prev, bettingTimeLeft: timeLeft } : prev);
    };
    const onEvent = (d: unknown) => {
      const { matchId, event, homeScore, awayScore } = d as any;
      setLiveScores(prev => ({ ...prev, [matchId]: { home: homeScore, away: awayScore } }));
      setLiveEvents(prev => [...prev.slice(-30), { matchId, event }]);
    };
    const onResults = (data: unknown) => {
      setResults(data);
      const r = data as any;
      if (myId && r.winnings[myId]) {
        toast.success(`⚽ ¡Ganaste $${r.winnings[myId].toLocaleString()}!`, { duration: 5000 });
      }
    };
    on('football:state', onState);
    on('football:timer', onTimer);
    on('football:event', onEvent);
    on('football:results', onResults);
    return () => {
      off('football:state', onState); off('football:timer', onTimer);
      off('football:event', onEvent); off('football:results', onResults);
    };
  }, [on, off, myId]);

  const addBet = (match: FootballMatch, betType: FootballBetType, odds: number) => {
    setBetSlips(prev => {
      const idx = prev.findIndex(b => b.matchId === match.id);
      const slip = { matchId: match.id, betType, odds, amount: selectedChip, matchLabel: `${match.home.shortName} vs ${match.away.shortName}` };
      if (idx >= 0) { const u = [...prev]; u[idx] = slip; return u; }
      return [...prev, slip];
    });
  };

  const removeBet = (matchId: string) => setBetSlips(prev => prev.filter(b => b.matchId !== matchId));

  const confirmBets = () => {
    for (const slip of betSlips) {
      emit('football:bet', { playerId: myId, matchId: slip.matchId, betType: slip.betType, amount: slip.amount, odds: slip.odds });
    }
    toast.success(`${betSlips.length} apuesta${betSlips.length !== 1 ? 's' : ''} confirmada${betSlips.length !== 1 ? 's' : ''}!`);
    setBetSlips([]);
  };

  const betLabel: Record<FootballBetType, string> = {
    '1': '1 Local', 'X': 'X Empate', '2': '2 Visita',
    'over': 'Más de 2.5', 'under': 'Menos de 2.5',
    'bttsYes': 'Ambos anotan Sí', 'bttsNo': 'Ambos anotan No',
  };

  if (!state) return <div className="text-center text-gray-400 pt-20">Esperando al host...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Messi banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6" style={{ height: 220 }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/messi.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 20%' }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, #0a2e0a 0%, #1a5c1a 40%, #2dc653 55%, #1a5c1a 70%, #0a2e0a 100%)',
        }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)' }} />
        <div className="absolute top-3 right-4 flex flex-col items-center opacity-70">
          <span className="text-5xl">🏆</span>
          <div className="flex gap-0.5 mt-1">{[...Array(8)].map((_, i) => <span key={i} className="text-yellow-400 text-xs">★</span>)}</div>
          <span className="text-yellow-400 text-xs font-bold tracking-widest mt-1">CAMPEÓN</span>
        </div>
        <div className="absolute inset-0 flex flex-col justify-center px-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-5xl">🇦🇷</span>
            <div>
              <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold">Casino CHANGOSBET</p>
              <h2 className="text-4xl font-bold text-white leading-none" style={{ fontFamily: 'Georgia, serif' }}>Apuestas de</h2>
              <h2 className="text-4xl font-bold leading-none" style={{
                fontFamily: 'Georgia, serif',
                background: 'linear-gradient(135deg, #ffd700, #ffec6e, #ffd700)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Fútbol Mundial</h2>
            </div>
          </div>
          <p className="text-gray-300 text-sm mt-2 max-w-xs">
            Colocá <code className="text-yellow-400 text-xs bg-black/30 px-1 rounded">frontend/public/messi.jpg</code> para el fondo
          </p>
        </div>
        <div className="absolute bottom-4 right-20 text-3xl opacity-60">⚽</div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Matches */}
        <div className="flex-1 space-y-3">
          <div className="glass-card p-3 flex items-center justify-between">
            {state.phase === 'betting' && (
              <>
                <span className="text-green-400 font-bold">⚽ Apostá a los partidos</span>
                <span className={`text-xl font-bold ${state.bettingTimeLeft <= 5 ? 'countdown-urgent' : 'text-yellow-400'}`}>{state.bettingTimeLeft}s</span>
              </>
            )}
            {state.phase === 'live' && <span className="text-red-400 font-bold animate-pulse">🔴 EN VIVO</span>}
            {state.phase === 'result' && <span className="text-yellow-400 font-bold">✅ Partidos finalizados</span>}
          </div>

          {state.matches.map(match => {
            const score = liveScores[match.id];
            const matchEvents = liveEvents.filter(e => e.matchId === match.id);
            const myBetOnMatch = betSlips.find(b => b.matchId === match.id);
            const finishedMatch = results?.matches?.find((m: FootballMatch) => m.id === match.id);

            return (
              <motion.div key={match.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`glass-card p-4 ${myBetOnMatch ? 'border-yellow-400/40' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-xs">{match.home.league}</span>
                  {state.phase === 'live' && <span className="text-red-400 text-xs font-bold animate-pulse">🔴 LIVE</span>}
                  {finishedMatch && <span className="text-gray-500 text-xs">FT</span>}
                </div>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-right flex-1">
                    <p className="font-bold text-white">{match.home.name}</p>
                    <p className="text-gray-400 text-xs">{match.home.shortName}</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-xl min-w-20" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <p className="text-2xl font-bold text-white">
                      {score ? `${score.home} - ${score.away}` : finishedMatch ? `${finishedMatch.homeScore} - ${finishedMatch.awayScore}` : 'vs'}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{match.away.name}</p>
                    <p className="text-gray-400 text-xs">{match.away.shortName}</p>
                  </div>
                </div>

                {matchEvents.length > 0 && (
                  <div className="mb-3 max-h-16 overflow-y-auto space-y-1">
                    {matchEvents.slice(-3).map((e, i) => <p key={i} className="text-xs text-gray-300">{e.event.description}</p>)}
                  </div>
                )}

                {state.phase === 'betting' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {(['1', 'X', '2'] as FootballBetType[]).map(bt => (
                        <button key={bt} onClick={() => addBet(match, bt, bt === '1' ? match.homeOdds : bt === 'X' ? match.drawOdds : match.awayOdds)}
                          className={`p-2 rounded-lg text-center transition-all border text-xs ${myBetOnMatch?.betType === bt ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/10 hover:border-white/30'}`}>
                          <p className="text-gray-400">{betLabel[bt]}</p>
                          <p className="text-yellow-400 font-bold">{bt === '1' ? match.homeOdds : bt === 'X' ? match.drawOdds : match.awayOdds}</p>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['over', 'under', 'bttsYes', 'bttsNo'] as FootballBetType[]).map(bt => {
                        const oddsMap: Record<string, number> = { over: match.overOdds, under: match.underOdds, bttsYes: match.bttsYesOdds, bttsNo: match.bttsNoOdds };
                        return (
                          <button key={bt} onClick={() => addBet(match, bt, oddsMap[bt])}
                            className={`p-2 rounded-lg text-xs text-center transition-all border ${myBetOnMatch?.betType === bt ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/10 hover:border-white/30'}`}>
                            <p className="text-gray-400">{betLabel[bt]}</p>
                            <p className="text-yellow-400 font-bold">{oddsMap[bt]}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bet slip */}
        <div className="lg:w-72 space-y-3">
          <div className="glass-card p-3">
            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Ficha</p>
            <div className="flex gap-2 flex-wrap">
              {CHIP_VALUES.map((v, i) => (
                <button key={v} onClick={() => setSelectedChip(v)} className="chip w-11 h-11 text-xs"
                  style={{ background: CHIP_COLORS[i], color: v === 100 ? '#1a1a2e' : 'white', transform: selectedChip === v ? 'scale(1.1)' : 'scale(1)', boxShadow: selectedChip === v ? `0 0 10px ${CHIP_COLORS[i]}` : 'none' }}>
                  ${v >= 1000 ? v/1000+'K' : v}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-3">
            <h3 className="text-yellow-400 font-bold text-sm mb-3">📋 Boleta de Apuestas</h3>
            {betSlips.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-4">Hacé clic en una cuota para agregar apuesta</p>
            ) : (
              <div className="space-y-2">
                {betSlips.map(slip => (
                  <div key={slip.matchId} className="p-2 rounded-lg bg-white/5 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-400">{slip.matchLabel}</p>
                        <p className="text-white font-bold">{betLabel[slip.betType]}</p>
                        <p className="text-yellow-400">x{slip.odds} — ${slip.amount.toLocaleString()}</p>
                      </div>
                      <button onClick={() => removeBet(slip.matchId)} className="text-red-400 hover:text-red-300">✕</button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2">
                  <p className="text-gray-400 text-xs">Total apostado</p>
                  <p className="text-yellow-400 font-bold">${betSlips.reduce((s, b) => s + b.amount, 0).toLocaleString()}</p>
                </div>
                {state.phase === 'betting' && (
                  <button onClick={confirmBets} className="casino-btn w-full py-2 text-sm rounded-lg">✅ Confirmar Apuestas</button>
                )}
              </div>
            )}
          </div>

          {results && myId && results.winnings[myId] && (
            <div className="glass-card p-3 border-green-400/40">
              <p className="text-green-400 font-bold text-center">🎉 Ganaste ${results.winnings[myId].toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
