'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRoom } from '@/contexts/RoomContext';
import { useAuth } from '@/contexts/AuthContext';
import type { FootballState, FootballMatch, FootballBetType } from '@/types';
import type { RealLeague, RealMatch } from '@/app/api/sports/route';
import type { WCData, WCMatch, WCGroup } from '@/app/api/worldcup/route';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Home, Radio, Star, Menu, X, Trophy, Zap,
  Clock, TrendingUp, Trash2, Ticket, ChevronRight,
  Users, Activity, Target, BarChart2, Flame, RefreshCw,
} from 'lucide-react';

/* ─────────────────────── STATIC DATA ─────────────────────── */
const SPORTS: { id: string; label: string; emoji: string; espnIds: string[]; featured?: boolean }[] = [
  { id: 'worldcup',   label: 'Mundial 2026', emoji: '🏆', espnIds: [], featured: true },
  { id: 'football',   label: 'Fútbol',       emoji: '⚽', espnIds: ['eng.1','esp.1','ger.1','ita.1','fra.1','arg.1','usa.1','bra.1','uefa.champions'] },
  { id: 'basketball', label: 'Básquet',      emoji: '🏀', espnIds: ['nba']   },
  { id: 'tennis',     label: 'Tenis',        emoji: '🎾', espnIds: ['tennis'] },
  { id: 'baseball',   label: 'Baseball',     emoji: '⚾', espnIds: ['mlb']   },
  { id: 'hockey',     label: 'Hockey',       emoji: '🏒', espnIds: ['nhl']   },
  { id: 'nfl',        label: 'NFL',          emoji: '🏈', espnIds: ['nfl']   },
  { id: 'esports',    label: 'eSports',      emoji: '🎮', espnIds: []        },
  { id: 'volleyball', label: 'Vóleibol',     emoji: '🏐', espnIds: []        },
];

const TIME_FILTERS = ['Todo', 'En Vivo', 'Hoy', 'Mañana', '1h', '3h'];

const POPULAR_STATIC = [
  { user: 'Martin G.', initials: 'MG', match: 'ARG vs BRA', bet: '1 Local',  odds: 2.15, amount: 500  },
  { user: 'Lucas R.',  initials: 'LR', match: 'ESP vs ITA', bet: 'X Empate', odds: 3.40, amount: 1000 },
  { user: 'Ramiro P.', initials: 'RP', match: 'FRA vs ALE', bet: '2 Visita', odds: 2.80, amount: 250  },
];

/* ─────────────────────── TYPES ─────────────────────── */
interface BetSlip {
  matchId: string;
  betType: FootballBetType;
  odds: number;
  amount: number;
  matchLabel: string;
  teamLabel: string;
}

/* ─────────────────────── REAL SPORTS DATA HOOK ─────────────────────── */
interface RealSportsData { leagues: RealLeague[]; liveCount: number; updatedAt: number; }

function useRealScores() {
  const [data, setData]       = useState<RealSportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [lastFetch, setLastFetch] = useState(0);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch('/api/sports');
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setData(json);
      setLastFetch(Date.now());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { data, loading, error, refresh: fetch_, lastFetch };
}

/* ─────────────────────── REAL SCORES SECTION ─────────────────────── */
function StatusBadge({ match }: { match: RealMatch }) {
  if (match.status === 'live') {
    return (
      <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse"
        style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
        <Radio className="w-2.5 h-2.5" />
        {match.clock ?? 'LIVE'}
      </span>
    );
  }
  if (match.status === 'halftime') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' }}>
        ET
      </span>
    );
  }
  if (match.status === 'final') {
    return <span className="text-[9px] font-bold text-white/25">FT</span>;
  }
  const d = new Date(match.date);
  const time = isNaN(d.getTime())
    ? '---'
    : `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  return <span className="text-[9px] text-white/30">{time}</span>;
}

function RealMatchRow({ match }: { match: RealMatch }) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const isLive   = match.status === 'live' || match.status === 'halftime';
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all group"
      style={{
        background: isLive ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
        border:     isLive ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.05)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.045)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isLive ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)'; }}>

      {/* Teams */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-white/80 truncate flex-1"
            style={{ fontFamily: "'Poppins', system-ui" }}>
            {match.home}
          </span>
          {hasScore && (
            <span className="font-black text-sm flex-shrink-0 text-white"
              style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", minWidth: 20, textAlign: 'center' }}>
              {match.homeScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white/55 truncate flex-1"
            style={{ fontFamily: "'Poppins', system-ui" }}>
            {match.away}
          </span>
          {hasScore && (
            <span className="font-black text-sm flex-shrink-0"
              style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", minWidth: 20, textAlign: 'center',
                color: parseInt(match.awayScore ?? '0') > parseInt(match.homeScore ?? '0') ? '#f87171' : 'rgba(255,255,255,0.6)' }}>
              {match.awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <StatusBadge match={match} />
      </div>
    </div>
  );
}

function RealScoresSection({
  data, loading, error, refresh, lastFetch, activeSport,
}: {
  data: RealSportsData | null;
  loading: boolean;
  error: boolean;
  refresh: () => void;
  lastFetch: number;
  activeSport: string;
}) {
  const sport = SPORTS.find(s => s.id === activeSport);
  const espnIds = sport?.espnIds ?? [];

  const visibleLeagues = data?.leagues.filter(l =>
    espnIds.length === 0 ? false : espnIds.includes(l.id)
  ) ?? [];

  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);

  // reset league when sport changes
  useEffect(() => { setActiveLeagueId(null); }, [activeSport]);

  const activeLeague = activeLeagueId
    ? visibleLeagues.find(l => l.id === activeLeagueId) ?? visibleLeagues[0]
    : visibleLeagues[0];

  const timeAgo = lastFetch
    ? `${Math.floor((Date.now() - lastFetch) / 1000)}s`
    : '---';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">{sport?.emoji ?? '🌐'}</span>
          <span className="font-black text-white text-sm" style={{ fontFamily: "'Poppins', system-ui" }}>
            {sport?.label ?? 'Todos'} — Resultados Reales
          </span>
          {data && data.liveCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              {data.liveCount} LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/20">↻ {timeAgo}</span>
          <button onClick={refresh}
            className={`p-1.5 rounded-lg transition-all ${loading ? 'opacity-40' : 'hover:bg-white/08'}`}
            disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 text-white/40 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* No ESPN data for this sport */}
      {espnIds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <span className="text-3xl mb-2 opacity-30">{sport?.emoji ?? '🎮'}</span>
          <p className="text-white/20 text-xs text-center">
            Datos en tiempo real no disponibles para {sport?.label ?? 'este deporte'}
          </p>
        </div>
      )}

      {espnIds.length > 0 && (
        <>
          {/* League tabs */}
          {visibleLeagues.length > 0 && (
            <div className="flex gap-1 px-3 pt-3 pb-1 overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}>
              {visibleLeagues.map(l => (
                <button key={l.id}
                  onClick={() => setActiveLeagueId(l.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex-shrink-0 transition-all"
                  style={{
                    background: (activeLeague?.id === l.id) ? '#dc2626' : 'rgba(255,255,255,0.05)',
                    color:      (activeLeague?.id === l.id) ? '#fff'    : 'rgba(255,255,255,0.4)',
                    border:     (activeLeague?.id === l.id) ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  <span>{l.emoji}</span>
                  <span>{l.name}</span>
                  {l.matches.filter(m => m.status === 'live' || m.status === 'halftime').length > 0 && (
                    <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Matches */}
          <div className="px-3 py-2">
            {loading && !data && (
              <div className="flex items-center justify-center py-6 gap-2">
                <RefreshCw className="w-4 h-4 text-red-500/50 animate-spin" />
                <span className="text-white/30 text-xs">Cargando datos en vivo...</span>
              </div>
            )}
            {error && (
              <div className="text-center py-4">
                <p className="text-white/20 text-xs">Error al cargar — la API de ESPN puede estar caída</p>
                <button onClick={refresh} className="mt-2 text-red-400 text-xs hover:text-red-300">
                  Reintentar
                </button>
              </div>
            )}
            {!loading && !error && activeLeague && activeLeague.matches.length === 0 && (
              <div className="text-center py-4">
                <p className="text-white/20 text-xs">Sin partidos programados en este momento</p>
              </div>
            )}
            {activeLeague && (
              <AnimatePresence mode="popLayout">
                <motion.div key={activeLeague.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="space-y-1">
                  {activeLeague.matches.map(match => (
                    <RealMatchRow key={match.id} match={match} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface Props { code: string; }

/* ─────────────────────── HELPERS ─────────────────────── */
function getProbs(h: number, d: number, a: number): [number, number, number] {
  const raw = [1 / h, 1 / d, 1 / a];
  const sum = raw.reduce((s, v) => s + v, 0);
  return raw.map(v => Math.round((v / sum) * 100)) as [number, number, number];
}

/* ─────────────────────── PROBABILITY RING ─────────────────────── */
function ProbRing({ pct, highlight = false, size = 40 }: { pct: number; highlight?: boolean; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={highlight ? '#ef4444' : 'rgba(255,255,255,0.25)'}
          strokeWidth={3}
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          strokeLinecap="round" />
      </svg>
      <span className="text-[10px] font-bold" style={{ color: highlight ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>
        {pct}%
      </span>
    </div>
  );
}

/* ─────────────────────── LEFT SIDEBAR ─────────────────────── */
/* ─────────────────────── WORLD CUP HOOK ─────────────────────── */
function useWorldCupData() {
  const [data, setData]           = useState<WCData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [lastFetch, setLastFetch] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const fetch_ = async () => {
      try {
        const res  = await fetch('/api/worldcup');
        if (!res.ok) return;
        const json: WCData = await res.json();
        setData(json);
        setLastFetch(Date.now());
        // adaptive: 30s when live games, 60s otherwise
        const delay = json.liveCount > 0 ? 30_000 : 60_000;
        timer = setTimeout(fetch_, delay);
      } catch {
        timer = setTimeout(fetch_, 60_000);
      } finally {
        setLoading(false);
      }
    };

    fetch_();
    return () => clearTimeout(timer);
  }, []);

  return { data, loading, lastFetch };
}

/* ─────────────────────── WORLD CUP SECTION ─────────────────────── */
const FLAG_FALLBACK: Record<string, string> = {
  ARG:'🇦🇷', BRA:'🇧🇷', FRA:'🇫🇷', ESP:'🇪🇸', ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', GER:'🇩🇪', ITA:'🇮🇹',
  POR:'🇵🇹', NED:'🇳🇱', BEL:'🇧🇪', CRO:'🇭🇷', SEN:'🇸🇳', MOR:'🇲🇦', MEX:'🇲🇽',
  USA:'🇺🇸', JPN:'🇯🇵', KOR:'🇰🇷', URU:'🇺🇾', COL:'🇨🇴', AUS:'🇦🇺', SUI:'🇨🇭',
  POL:'🇵🇱', DEN:'🇩🇰', ECU:'🇪🇨', WAL:'🏴󠁧󠁢󠁷󠁬󠁳󠁿', CMR:'🇨🇲', QAT:'🇶🇦', SAU:'🇸🇦',
  CAN:'🇨🇦', MAR:'🇲🇦', GHA:'🇬🇭', SRB:'🇷🇸', CRC:'🇨🇷', TUN:'🇹🇳',
};

function flagEmoji(code: string) {
  return FLAG_FALLBACK[code.toUpperCase()] ?? '🏳';
}

function WCStatusPill({ match }: { match: WCMatch }) {
  if (match.status === 'live') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse"
      style={{ background: 'rgba(239,68,68,0.25)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}>
      <Radio className="w-2.5 h-2.5" /> {match.clock ?? 'EN VIVO'}
    </span>
  );
  if (match.status === 'halftime') return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-black"
      style={{ background: 'rgba(234,179,8,0.2)', color: '#eab308', border: '1px solid rgba(234,179,8,0.35)' }}>
      ET
    </span>
  );
  if (match.status === 'final') return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white/30"
      style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      FT
    </span>
  );
  const d = new Date(match.date);
  const t = isNaN(d.getTime()) ? '' : `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  return <span className="text-[9px] text-white/30">{t}</span>;
}

function WCMatchCard({ match, onBet, myBet, canBet }: {
  match: WCMatch;
  onBet?: (type: 'home' | 'draw' | 'away', odds: number) => void;
  myBet?: string;
  canBet?: boolean;
}) {
  const isLive  = match.status === 'live' || match.status === 'halftime';
  const isDone  = match.status === 'final';
  const hasOdds = match.oddsHome !== null;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: isLive ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
        border:     isLive ? '1.5px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow:  isLive ? '0 0 24px rgba(239,68,68,0.08)' : 'none',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] font-bold text-white/30"
          style={{ fontFamily: "'Poppins', system-ui" }}>
          🌍 FIFA World Cup 2026 {match.round ? `· ${match.round}` : ''}
        </span>
        <WCStatusPill match={match} />
      </div>

      <div className="p-4">
        {/* Scoreboard */}
        <div className="flex items-center gap-3 mb-3">
          {/* Home */}
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              {match.homeLogo
                ? <img src={match.homeLogo} alt={match.homeCode} className="w-8 h-8 object-contain" />
                : <span className="text-2xl">{flagEmoji(match.homeCode)}</span>}
            </div>
            <p className="font-bold text-sm text-white leading-tight"
              style={{ fontFamily: "'Poppins', system-ui" }}>
              {match.home}
            </p>
            <p className="text-[9px] text-white/30">{match.homeCode}</p>
          </div>

          {/* Score / VS */}
          <div className="flex-shrink-0 text-center">
            <div className="px-4 py-2 rounded-2xl min-w-[88px]"
              style={{
                background: (isLive || isDone) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
              {(isLive || isDone) ? (
                <span className="font-black text-2xl text-white"
                  style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.06em' }}>
                  {match.homeScore} – {match.awayScore}
                </span>
              ) : (
                <span className="font-black text-lg text-white/30"
                  style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.08em' }}>
                  VS
                </span>
              )}
            </div>
            {match.venue && (
              <p className="text-[8px] text-white/20 mt-1 max-w-[100px] truncate mx-auto">
                🏟 {match.venue}
              </p>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              {match.awayLogo
                ? <img src={match.awayLogo} alt={match.awayCode} className="w-8 h-8 object-contain" />
                : <span className="text-2xl">{flagEmoji(match.awayCode)}</span>}
            </div>
            <p className="font-bold text-sm text-white leading-tight"
              style={{ fontFamily: "'Poppins', system-ui" }}>
              {match.away}
            </p>
            <p className="text-[9px] text-white/30">{match.awayCode}</p>
          </div>
        </div>

        {/* Odds buttons (only for upcoming + if we have odds) */}
        {!isDone && hasOdds && canBet && (
          <div className="grid grid-cols-3 gap-2 mt-1">
            {([
              { key: 'home' as const, label: '1', odds: match.oddsHome!, sublabel: match.homeCode },
              { key: 'draw' as const, label: 'X', odds: match.oddsDraw!, sublabel: 'Empate' },
              { key: 'away' as const, label: '2', odds: match.oddsAway!, sublabel: match.awayCode },
            ]).map(b => {
              const active = myBet === b.key;
              return (
                <button key={b.key} onClick={() => onBet?.(b.key, b.odds)}
                  className="rounded-xl py-2.5 px-1 text-center transition-all"
                  style={{
                    background: active ? '#dc2626' : 'rgba(255,255,255,0.06)',
                    border:     active ? '1.5px solid #ef4444' : '1.5px solid rgba(255,255,255,0.1)',
                    boxShadow:  active ? '0 4px 16px rgba(220,38,38,0.4)' : 'none',
                    transform:  active ? 'scale(1.03)' : 'scale(1)',
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.35)'; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; } }}>
                  <p className="text-[9px] uppercase tracking-wider mb-0.5"
                    style={{ color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontFamily: "'Poppins', system-ui" }}>
                    {b.label} · {b.sublabel}
                  </p>
                  <p className="font-black text-xl leading-none"
                    style={{ color: active ? '#fff' : '#f1f5f9', fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>
                    {b.odds ?? '--'}
                  </p>
                  {match.oddsSource && (
                    <p className="text-[7px] text-white/20 mt-0.5">{match.oddsSource}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* No-odds hint for upcoming matches */}
        {!isDone && !hasOdds && match.status === 'scheduled' && (
          <p className="text-center text-[10px] text-white/20 mt-1">Cuotas no disponibles aún</p>
        )}
      </div>
    </div>
  );
}

function WCGroupTable({ group }: { group: WCGroup }) {
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-3 py-2 flex items-center gap-2"
        style={{ background: 'rgba(0,0,0,0.3)' }}>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40"
          style={{ fontFamily: "'Poppins', system-ui" }}>
          {group.name}
        </span>
      </div>
      <table className="w-full text-[10px]">
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
            {['Equipo', 'J', 'G', 'E', 'P', 'GF', 'GA', 'Pts'].map(h => (
              <th key={h} className="px-2 py-1 text-white/25 font-bold text-right first:text-left"
                style={{ fontFamily: "'Poppins', system-ui" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.teams.map((t, i) => (
            <tr key={t.code} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
              <td className="px-2 py-1.5 flex items-center gap-1.5">
                <span>{flagEmoji(t.code)}</span>
                <span className="text-white/70 font-semibold">{t.name}</span>
              </td>
              {[t.played, t.won, t.drawn, t.lost, t.gf, t.ga].map((v, vi) => (
                <td key={vi} className="px-2 py-1.5 text-right text-white/40">{v}</td>
              ))}
              <td className="px-2 py-1.5 text-right font-black text-white">{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorldCupSection({
  data, loading, lastFetch, wcBets, onWCBet,
}: {
  data: WCData | null;
  loading: boolean;
  lastFetch: number;
  wcBets: Record<string, { type: string; odds: number }>;
  onWCBet: (matchId: string, type: 'home' | 'draw' | 'away', odds: number) => void;
}) {
  const [view, setView] = useState<'matches' | 'groups'>('matches');
  const [filter, setFilter] = useState<'all' | 'live' | 'today' | 'upcoming'>('all');

  const timeAgo = lastFetch
    ? Math.floor((Date.now() - lastFetch) / 1000) + 's'
    : '---';

  const allMatches = data?.matches ?? [];
  const filtered = allMatches.filter(m => {
    if (filter === 'live')     return m.status === 'live' || m.status === 'halftime';
    if (filter === 'today')    return new Date(m.date).toDateString() === new Date().toDateString();
    if (filter === 'upcoming') return m.status === 'scheduled';
    return true;
  });

  const liveMatches = allMatches.filter(m => m.status === 'live' || m.status === 'halftime');

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(255,215,0,0.2)' }}>

      {/* ── WC Header Banner ── */}
      <div className="relative overflow-hidden px-5 py-5"
        style={{ background: 'linear-gradient(135deg, #1a0000 0%, #3d0000 40%, #1a0800 100%)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,215,0,0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
        {/* Gold top border */}
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, #ffd700, #ffa500, #ffd700, transparent)' }} />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏆</span>
              <div>
                <h2 className="font-black text-white leading-none"
                  style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 28, letterSpacing: '0.06em',
                    background: 'linear-gradient(135deg, #ffd700, #ffec6e, #ffa500)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  FIFA WORLD CUP 2026
                </h2>
                <p className="text-[10px] text-white/35 font-medium"
                  style={{ fontFamily: "'Poppins', system-ui" }}>
                  🇺🇸 EE.UU · 🇨🇦 Canadá · 🇲🇽 México · 48 Selecciones
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              {liveMatches.length > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse"
                  style={{ background: 'rgba(239,68,68,0.25)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}>
                  <Radio className="w-2.5 h-2.5" /> {liveMatches.length} EN VIVO
                </span>
              )}
              {data?.hasOdds && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(255,215,0,0.12)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.25)' }}>
                  ✓ Cuotas reales
                </span>
              )}
              {!data?.hasOdds && !loading && (
                <span className="text-[9px] text-white/20">Sin ODDS_API_KEY · solo ESPN</span>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            {loading && (
              <RefreshCw className="w-4 h-4 text-white/30 animate-spin ml-auto mb-1" />
            )}
            <p className="text-[9px] text-white/20">↻ {timeAgo}</p>
          </div>
        </div>
      </div>

      {/* ── View tabs ── */}
      <div className="flex border-b" style={{ borderColor: 'rgba(255,215,0,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        {[
          { id: 'matches', label: '⚽ Partidos' },
          { id: 'groups',  label: '📊 Grupos' },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id as any)}
            className="flex-1 py-2.5 text-xs font-bold transition-all"
            style={{
              color:        view === t.id ? '#ffd700' : 'rgba(255,255,255,0.3)',
              borderBottom: view === t.id ? '2px solid #ffd700' : '2px solid transparent',
              fontFamily:   "'Poppins', system-ui",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {/* ── MATCHES view ── */}
        {view === 'matches' && (
          <>
            {/* Filters */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {([
                { id: 'all',      label: 'Todos',         count: undefined as number | undefined },
                { id: 'live',     label: '🔴 En Vivo',   count: data?.liveCount },
                { id: 'today',    label: '📅 Hoy',        count: data?.todayCount },
                { id: 'upcoming', label: '⏰ Próximos',   count: undefined as number | undefined },
              ] as const).map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                  style={{
                    background: filter === f.id ? '#dc2626' : 'rgba(255,255,255,0.05)',
                    color:      filter === f.id ? '#fff'    : 'rgba(255,255,255,0.35)',
                    border:     filter === f.id ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  {f.label}
                  {f.count != null && f.count > 0 && (
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Match list */}
            {loading && !data && (
              <div className="flex items-center justify-center py-10 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#ffd700' }} />
                <span className="text-white/30 text-xs">Cargando datos del Mundial...</span>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2 opacity-20">🏆</span>
                <p className="text-white/20 text-xs">
                  {filter === 'live'
                    ? 'No hay partidos en vivo en este momento'
                    : filter === 'today'
                    ? 'No hay partidos programados para hoy'
                    : 'Sin partidos disponibles'}
                </p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {filtered.map(match => (
                  <motion.div key={match.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }} layout>
                    <WCMatchCard
                      match={match}
                      canBet={match.status === 'scheduled' && !!match.oddsHome}
                      myBet={wcBets[match.id]?.type}
                      onBet={(type, odds) => onWCBet(match.id, type, odds)}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </>
        )}

        {/* ── GROUPS view ── */}
        {view === 'groups' && (
          <div className="space-y-3">
            {loading && !data && (
              <div className="flex items-center justify-center py-8 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#ffd700' }} />
                <span className="text-white/30 text-xs">Cargando tabla de posiciones...</span>
              </div>
            )}
            {data?.groups.length === 0 && !loading && (
              <p className="text-center text-white/20 text-xs py-6">
                Tabla de posiciones no disponible aún
              </p>
            )}
            {(data?.groups ?? []).map(g => (
              <WCGroupTable key={g.name} group={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface LeftProps {
  activeSport: string;
  setActiveSport: (s: string) => void;
  realData?: RealSportsData | null;
  liveCount?: number;
  wcData?: WCData | null;
  onClose?: () => void;
}
function LeftSidebar({ activeSport, setActiveSport, realData, liveCount = 0, wcData, onClose }: LeftProps) {
  const [q, setQ] = useState('');
  return (
    <div className="flex flex-col h-full py-3 px-2" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-white font-black text-base tracking-wide">⚽ DopartisBet</span>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400/60" />
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar deporte..."
          className="w-full pl-8 pr-3 py-2 rounded-xl text-xs text-white placeholder-white/25 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => (e.target.style.borderColor = 'rgba(239,68,68,0.5)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
      </div>

      {/* Main Nav */}
      <div className="space-y-0.5 mb-4">
        {[
          { icon: <Home className="w-4 h-4" />,        label: 'Inicio' },
          { icon: <Radio className="w-4 h-4" />,       label: 'En Vivo', badge: '12' },
          { icon: <Star className="w-4 h-4" />,        label: 'Favoritos' },
          { icon: <Trophy className="w-4 h-4" />,      label: 'Torneos' },
          { icon: <TrendingUp className="w-4 h-4" />,  label: 'Populares' },
        ].map(item => (
          <button key={item.label}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left group"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}>
            <span className="text-red-500/70 group-hover:text-red-400 transition-colors">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                style={{ background: 'rgba(239,68,68,0.25)', color: '#ef4444' }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px mb-3 mx-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] px-3 mb-2"
        style={{ color: 'rgba(255,255,255,0.25)' }}>
        Deportes
      </p>

      {/* Live count global */}
      {liveCount > 0 && (
        <div className="mx-2 mb-2 px-3 py-1.5 rounded-xl flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Radio className="w-3 h-3 text-red-400 animate-pulse" />
          <span className="text-[10px] font-bold text-red-300">{liveCount} partidos en vivo</span>
        </div>
      )}

      {/* Sports List */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#7f0000 transparent' }}>
        {SPORTS.filter(s => !q || s.label.toLowerCase().includes(q.toLowerCase())).map(sport => {
          const active   = activeSport === sport.id;
          const isWC     = sport.id === 'worldcup';

          /* WC live count */
          const wcLive = isWC ? (wcData?.liveCount ?? 0) : 0;

          /* other sports live count from ESPN */
          const liveMatchCount = isWC ? wcLive : (
            realData?.leagues
              .filter(l => sport.espnIds.includes(l.id))
              .reduce((n, l) => n + l.matches.filter(m => m.status === 'live' || m.status === 'halftime').length, 0)
            ?? 0
          );
          const totalMatchCount = isWC ? (wcData?.matches.length ?? 0) : (
            realData?.leagues
              .filter(l => sport.espnIds.includes(l.id))
              .reduce((n, l) => n + l.matches.length, 0)
            ?? 0
          );

          return (
            <button key={sport.id} onClick={() => { setActiveSport(sport.id); onClose?.(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left"
              style={{
                background: active
                  ? isWC ? 'rgba(255,215,0,0.12)' : 'rgba(239,68,68,0.18)'
                  : isWC ? 'rgba(255,215,0,0.04)' : 'transparent',
                color: active ? '#fff' : isWC ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.5)',
                border: active
                  ? isWC ? '1px solid rgba(255,215,0,0.35)' : '1px solid rgba(239,68,68,0.3)'
                  : isWC ? '1px solid rgba(255,215,0,0.15)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = isWC ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = isWC ? 'rgba(255,215,0,0.04)' : 'transparent'; (e.currentTarget as HTMLElement).style.color = isWC ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.5)'; } }}>
              <span className="text-base leading-none">{sport.emoji}</span>
              <span className="flex-1">{sport.label}</span>
              {liveMatchCount > 0 && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse"
                  style={{
                    background: isWC ? 'rgba(255,215,0,0.2)' : 'rgba(239,68,68,0.25)',
                    color:      isWC ? '#ffd700'             : '#ef4444',
                  }}>
                  {liveMatchCount}
                </span>
              )}
              {totalMatchCount > 0 && liveMatchCount === 0 && (
                <span className="text-[10px] font-bold"
                  style={{ color: active ? (isWC ? '#ffd700' : '#ef4444') : 'rgba(255,255,255,0.2)' }}>
                  {totalMatchCount}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: isWC ? '#ffd700' : '#ef4444' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────── MATCH CARD (featured) ─────────────────────── */
interface MatchCardProps {
  match: FootballMatch;
  score?: { home: number; away: number };
  phase: string;
  myBet?: BetSlip;
  disabled: boolean;
  onBet: (match: FootballMatch, type: FootballBetType, odds: number) => void;
  result?: FootballMatch;
}
function MatchCard({ match, score, phase, myBet, disabled, onBet, result }: MatchCardProps) {
  const [hp, dp, ap] = getProbs(match.homeOdds, match.drawOdds, match.awayOdds);
  const bets: { type: FootballBetType; label: string; odds: number; pct: number }[] = [
    { type: '1', label: '1', odds: match.homeOdds, pct: hp },
    { type: 'X', label: 'X', odds: match.drawOdds, pct: dp },
    { type: '2', label: '2', odds: match.awayOdds, pct: ap },
  ];

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: myBet ? '1.5px solid rgba(239,68,68,0.45)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: myBet ? '0 0 20px rgba(239,68,68,0.08)' : 'none',
      }}>

      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] font-semibold flex items-center gap-1.5"
          style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Poppins', system-ui" }}>
          🏟️ {match.home.league}
        </span>
        <div className="flex items-center gap-2">
          {myBet && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(239,68,68,0.18)', color: '#ef4444' }}>
              ✓ Apostado
            </span>
          )}
          {phase === 'live' && (
            <span className="flex items-center gap-1 text-[9px] font-black text-red-400 animate-pulse">
              <Radio className="w-2.5 h-2.5" /> LIVE
            </span>
          )}
          {result && <span className="text-[9px] text-white/25">FT</span>}
        </div>
      </div>

      <div className="p-4">
        {/* Teams + score */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-right">
            <p className="font-bold text-white text-sm leading-tight mb-0.5"
              style={{ fontFamily: "'Poppins', system-ui" }}>
              {match.home.name}
            </p>
            <div className="flex items-center justify-end gap-1.5">
              <ProbRing pct={hp} highlight={hp > ap} size={36} />
            </div>
          </div>

          <div className="flex-shrink-0 text-center">
            <div className="px-4 py-2 rounded-xl min-w-[72px]"
              style={{
                background: (score || result) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
              <span className="font-black text-xl text-white" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.06em' }}>
                {score
                  ? `${score.home} - ${score.away}`
                  : result
                  ? `${result.homeScore} - ${result.awayScore}`
                  : 'VS'}
              </span>
            </div>
            <p className="text-[9px] text-white/20 mt-1">{match.home.league}</p>
          </div>

          <div className="flex-1">
            <p className="font-bold text-white text-sm leading-tight mb-0.5"
              style={{ fontFamily: "'Poppins', system-ui" }}>
              {match.away.name}
            </p>
            <div className="flex items-center gap-1.5">
              <ProbRing pct={ap} highlight={ap > hp} size={36} />
            </div>
          </div>
        </div>

        {/* 1X2 buttons */}
        {!disabled && (
          <div className="grid grid-cols-3 gap-2">
            {bets.map(b => {
              const active = myBet?.betType === b.type;
              return (
                <button key={b.type} onClick={() => onBet(match, b.type, b.odds)}
                  className="rounded-xl py-2.5 px-1 text-center transition-all group"
                  style={{
                    background: active ? '#dc2626' : 'rgba(255,255,255,0.06)',
                    border: active ? '1.5px solid #ef4444' : '1.5px solid rgba(255,255,255,0.1)',
                    boxShadow: active ? '0 4px 16px rgba(220,38,38,0.4)' : 'none',
                    transform: active ? 'scale(1.03)' : 'scale(1)',
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.35)'; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; } }}>
                  <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5"
                    style={{ color: active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)', fontFamily: "'Poppins', system-ui" }}>
                    {b.type === '1' ? match.home.shortName : b.type === '2' ? match.away.shortName : 'Empate'}
                  </p>
                  <p className="font-black text-lg leading-none"
                    style={{ color: active ? '#fff' : '#f8fafc', fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.04em' }}>
                    {b.odds}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', fontFamily: "'Poppins', system-ui" }}>
                    {b.pct}%
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── MATCH ROW (compact list) ─────────────────────── */
interface MatchRowProps {
  match: FootballMatch;
  score?: { home: number; away: number };
  phase: string;
  myBet?: BetSlip;
  disabled: boolean;
  onBet: (match: FootballMatch, type: FootballBetType, odds: number) => void;
  result?: FootballMatch;
}
function MatchRow({ match, score, phase, myBet, disabled, onBet, result }: MatchRowProps) {
  const bets: { type: FootballBetType; label: string; odds: number }[] = [
    { type: '1', label: '1',    odds: match.homeOdds },
    { type: 'X', label: 'X',   odds: match.drawOdds },
    { type: '2', label: '2',   odds: match.awayOdds },
  ];

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
      style={{
        background: myBet ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.025)',
        border: myBet ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = myBet ? 'rgba(239,68,68,0.09)' : 'rgba(255,255,255,0.045)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = myBet ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.025)'; }}>

      {/* Live indicator */}
      <div className="flex-shrink-0 w-6 text-center">
        {phase === 'live' && <Radio className="w-3 h-3 text-red-500 animate-pulse mx-auto" />}
        {phase === 'betting' && <Clock className="w-3 h-3 text-white/20 mx-auto" />}
        {phase === 'result' && <span className="text-[8px] text-white/20">FT</span>}
      </div>

      {/* Teams */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/25 font-medium truncate mb-0.5" style={{ fontFamily: "'Poppins', system-ui" }}>
          {match.home.league}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white/80 truncate" style={{ fontFamily: "'Poppins', system-ui" }}>
            {match.home.shortName}
          </span>
          <span className="text-[10px] text-white/20 font-black flex-shrink-0">
            {score
              ? `${score.home} - ${score.away}`
              : result
              ? `${result.homeScore} - ${result.awayScore}`
              : 'vs'}
          </span>
          <span className="text-xs font-semibold text-white/80 truncate" style={{ fontFamily: "'Poppins', system-ui" }}>
            {match.away.shortName}
          </span>
        </div>
      </div>

      {/* Odds buttons */}
      {!disabled && (
        <div className="flex gap-1.5 flex-shrink-0">
          {bets.map(b => {
            const active = myBet?.betType === b.type;
            return (
              <button key={b.type} onClick={() => onBet(match, b.type, b.odds)}
                className="w-14 py-1.5 rounded-lg text-center transition-all"
                style={{
                  background: active ? '#dc2626' : 'rgba(255,255,255,0.07)',
                  border: active ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: active ? '0 2px 10px rgba(220,38,38,0.35)' : 'none',
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; } }}>
                <p className="text-[8px] text-white/30 font-medium" style={{ fontFamily: "'Poppins', system-ui" }}>{b.label}</p>
                <p className="text-xs font-black text-white" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.04em' }}>
                  {b.odds}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── BET SLIP PANEL ─────────────────────── */
interface BetSlipProps {
  betSlips: BetSlip[];
  onRemove: (id: string) => void;
  onConfirm: () => void;
  betAmount: number;
  betAmountStr: string;
  setBetAmountStr: (s: string) => void;
  setBetAmount: (n: number) => void;
  balance: number;
  alias: string;
  betMode: 'simple' | 'combinada';
  setBetMode: (m: 'simple' | 'combinada') => void;
  phase: string;
  results: any;
  myId: string | null;
  onClose?: () => void;
}
function BetSlipPanel({
  betSlips, onRemove, onConfirm, betAmount, betAmountStr,
  setBetAmountStr, setBetAmount, balance, alias, betMode, setBetMode,
  phase, results, myId, onClose,
}: BetSlipProps) {
  const [activeTab, setActiveTab] = useState<'cupon' | 'historial'>('cupon');

  const combinedOdds = betSlips.reduce((p, s) => p * s.odds, 1);
  const potentialWin = betMode === 'combinada'
    ? betAmount * combinedOdds
    : betSlips.reduce((sum, s) => sum + s.amount * s.odds, 0);

  const quickAmounts = [100, 500, 1000, 5000];

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>

      {/* Balance Header */}
      <div className="px-4 py-3 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(127,0,0,0.6) 0%, rgba(80,0,0,0.4) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">{alias?.[0]?.toUpperCase() ?? 'U'}</span>
            </div>
            <span className="text-white/60 text-xs font-medium">{alias}</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.04em' }}>
            ${balance.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-red-300/60">F$  Fichas</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {[
          { id: 'cupon',    label: 'Cupón',       icon: <Ticket className="w-3 h-3" /> },
          { id: 'historial', label: 'Mis Apuestas', icon: <BarChart2 className="w-3 h-3" /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all"
            style={{
              color: activeTab === tab.id ? '#ef4444' : 'rgba(255,255,255,0.35)',
              borderBottom: activeTab === tab.id ? '2px solid #ef4444' : '2px solid transparent',
            }}>
            {tab.icon} {tab.label}
            {tab.id === 'cupon' && betSlips.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                {betSlips.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'cupon' ? (
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#7f0000 transparent' }}>

          {/* Bet mode selector */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {(['simple', 'combinada'] as const).map(m => (
                <button key={m} onClick={() => setBetMode(m)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
                  style={{
                    background: betMode === m ? '#dc2626' : 'transparent',
                    color: betMode === m ? '#fff' : 'rgba(255,255,255,0.35)',
                    boxShadow: betMode === m ? '0 2px 8px rgba(220,38,38,0.35)' : 'none',
                  }}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {betSlips.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
              <div className="text-4xl mb-3 opacity-20">⚽</div>
              <p className="text-white/20 text-xs text-center leading-relaxed">
                Seleccioná una cuota en un partido para agregar al cupón
              </p>
            </div>
          ) : (
            <>
              {/* Slip items */}
              <div className="px-3 space-y-2 py-2 flex-shrink-0">
                <AnimatePresence>
                  {betSlips.map(slip => (
                    <motion.div key={slip.matchId}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                      className="rounded-xl overflow-hidden"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-white/35 truncate">{slip.matchLabel}</p>
                            <p className="text-xs font-bold text-white mt-0.5">{slip.teamLabel}</p>
                            <p className="text-[10px] text-red-300/70 mt-0.5">
                              {slip.betType === '1' ? '1 Local' : slip.betType === 'X' ? 'X Empate' : '2 Visita'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-black text-base text-red-400"
                              style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.04em' }}>
                              x{slip.odds}
                            </span>
                            <button onClick={() => onRemove(slip.matchId)}
                              className="text-white/20 hover:text-red-400 transition-colors p-0.5">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-white/25">Apuesta</span>
                          <span className="text-white/60 font-bold">${slip.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Combined odds badge */}
                {betMode === 'combinada' && betSlips.length > 1 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[10px] text-white/35 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400" /> Cuota combinada
                    </span>
                    <span className="font-black text-yellow-400"
                      style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 16, letterSpacing: '0.04em' }}>
                      x{combinedOdds.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stake input */}
              <div className="px-3 py-2 flex-shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                  Monto de Apuesta
                </p>
                <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-red-400">$</span>
                  <input
                    type="number"
                    value={betAmountStr}
                    onChange={e => {
                      setBetAmountStr(e.target.value);
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n) && n > 0) setBetAmount(n);
                    }}
                    onFocus={e => (e.target.style.borderColor = '#ef4444')}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(239,68,68,0.3)';
                      const n = parseFloat(betAmountStr);
                      if (isNaN(n) || n <= 0) { setBetAmount(100); setBetAmountStr('100'); }
                    }}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl text-white font-bold text-sm focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1.5px solid rgba(239,68,68,0.3)',
                      fontFamily: "'Poppins', system-ui",
                    }}
                    min={100}
                    max={balance}
                  />
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {quickAmounts.map(amt => (
                    <button key={amt} onClick={() => { setBetAmount(amt); setBetAmountStr(String(amt)); }}
                      className="py-1.5 rounded-lg text-[10px] font-bold transition-all"
                      style={{
                        background: betAmount === amt ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)',
                        border: betAmount === amt ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color: betAmount === amt ? '#ef4444' : 'rgba(255,255,255,0.4)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = betAmount === amt ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)';
                        (e.currentTarget as HTMLElement).style.color = betAmount === amt ? '#ef4444' : 'rgba(255,255,255,0.4)';
                      }}>
                      {amt >= 1000 ? `${amt / 1000}K` : amt}
                    </button>
                  ))}
                </div>

                {/* Min / Max */}
                <div className="flex gap-2 mb-4">
                  <button onClick={() => { setBetAmount(100); setBetAmountStr('100'); }}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-white/35 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
                    Min $100
                  </button>
                  <button onClick={() => { setBetAmount(balance); setBetAmountStr(String(balance)); }}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-white/35 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
                    Max ${balance >= 1000 ? `${(balance / 1000).toFixed(1)}K` : balance}
                  </button>
                </div>

                {/* Potential win */}
                <div className="px-3 py-2.5 rounded-xl mb-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/35">Posible Ganancia</span>
                    <span className="font-black text-lg text-green-400"
                      style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.04em' }}>
                      ${Math.round(potentialWin).toLocaleString()}
                    </span>
                  </div>
                  {betMode === 'simple' && betSlips.length > 1 && (
                    <p className="text-[9px] text-white/20 mt-0.5">Suma de ganancias individuales</p>
                  )}
                </div>

                {/* CTA */}
                {phase === 'betting' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={onConfirm}
                    disabled={!betSlips.length}
                    className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: betSlips.length
                        ? 'linear-gradient(135deg, #7f0000 0%, #dc2626 50%, #7f0000 100%)'
                        : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      boxShadow: betSlips.length ? '0 6px 24px rgba(220,38,38,0.5)' : 'none',
                      fontFamily: "'Poppins', system-ui",
                    }}>
                    ⚽ Apostar Fichas
                  </motion.button>
                )}
              </div>
            </>
          )}

          {/* Popular bets */}
          <div className="flex-shrink-0 border-t px-3 py-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 flex items-center gap-1.5 mb-2">
              <Flame className="w-3 h-3 text-orange-500" /> Apuestas Populares
            </p>
            <div className="space-y-2">
              {POPULAR_STATIC.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-red-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-black text-red-300">{p.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/50 truncate">{p.user} · {p.match}</p>
                    <p className="text-[10px] font-bold text-white/70">{p.bet} · <span className="text-red-400">x{p.odds}</span></p>
                  </div>
                  <span className="text-[9px] text-white/20 flex-shrink-0">${p.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Historial tab */
        <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
          <Activity className="w-8 h-8 text-white/10 mb-2" />
          <p className="text-white/20 text-xs text-center">El historial aparece al finalizar la ronda</p>
          {results && myId && results.winnings[myId] > 0 && (
            <div className="mt-4 text-center">
              <p className="text-green-400 font-black text-xl" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}>
                🏆 GANASTE
              </p>
              <p className="text-white font-black text-2xl">${results.winnings[myId].toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
export default function FootballGame({ code: _code }: Props) {
  const { emit, on, off, myId, balance, placeBet: debitBet } = useRoom();
  const { user } = useAuth();

  /* game state */
  const [state, setState] = useState<FootballState | null>(null);
  const [liveScores, setLiveScores] = useState<Record<string, { home: number; away: number }>>({});
  const [liveEvents, setLiveEvents] = useState<Array<{ matchId: string; event: { description: string } }>>([]);
  const [results, setResults] = useState<any>(null);

  /* real sports data */
  const { data: realData, loading: realLoading, error: realError, refresh: realRefresh, lastFetch } = useRealScores();

  /* world cup data */
  const { data: wcData, loading: wcLoading, lastFetch: wcLastFetch } = useWorldCupData();
  const [wcBets, setWcBets] = useState<Record<string, { type: string; odds: number }>>({});
  const handleWCBet = useCallback((matchId: string, type: 'home' | 'draw' | 'away', odds: number) => {
    setWcBets(prev => prev[matchId]?.type === type
      ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== matchId))
      : { ...prev, [matchId]: { type, odds } }
    );
  }, []);

  /* ui state */
  const [betSlips, setBetSlips] = useState<BetSlip[]>([]);
  const [betAmount, setBetAmount] = useState(500);
  const [betAmountStr, setBetAmountStr] = useState('500');
  const [betMode, setBetMode] = useState<'simple' | 'combinada'>('simple');
  const [activeSport, setActiveSport] = useState('football');
  const [activeFilter, setActiveFilter] = useState('Todo');
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showBetSlip, setShowBetSlip] = useState(false);

  /* socket listeners */
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
    const teamLabel = betType === '1' ? match.home.name : betType === '2' ? match.away.name : 'Empate';
    setBetSlips(prev => {
      const idx = prev.findIndex(b => b.matchId === match.id);
      const slip: BetSlip = {
        matchId: match.id, betType, odds, amount: betAmount,
        matchLabel: `${match.home.shortName} vs ${match.away.shortName}`,
        teamLabel,
      };
      if (idx >= 0) {
        if (prev[idx].betType === betType) return prev.filter((_, i) => i !== idx);
        const u = [...prev]; u[idx] = slip; return u;
      }
      return [...prev, slip];
    });
  };

  const removeBet = (matchId: string) => setBetSlips(prev => prev.filter(b => b.matchId !== matchId));

  const confirmBets = async () => {
    if (!betSlips.length) return;
    let confirmed = 0;
    for (const slip of betSlips) {
      // Débito instantáneo del propio saldo. Si no se acepta (saldo insuficiente
      // o ronda cerrada), no se apuesta ese slip. Las fichas NO se reembolsan.
      const ok = await debitBet(slip.amount);
      if (!ok) {
        toast.error('Saldo insuficiente o ronda cerrada');
        break;
      }
      emit('football:bet', { playerId: myId, matchId: slip.matchId, betType: slip.betType, amount: slip.amount, odds: slip.odds });
      confirmed++;
    }
    if (confirmed > 0) {
      toast.success(`⚽ ${confirmed} apuesta${confirmed !== 1 ? 's' : ''} confirmada${confirmed !== 1 ? 's' : ''}!`);
    }
    setBetSlips([]);
  };

  const betSlipProps = {
    betSlips, onRemove: removeBet, onConfirm: confirmBets,
    betAmount, betAmountStr, setBetAmountStr, setBetAmount,
    balance, alias: user?.alias ?? 'Jugador',
    betMode, setBetMode,
    phase: state?.phase ?? 'waiting',
    results, myId: myId ?? null,
  };

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]" style={{ fontFamily: "'Poppins', system-ui" }}>
        <div className="text-5xl mb-4 animate-bounce">⚽</div>
        <p className="text-white/30 text-sm">Esperando al host para iniciar la ronda...</p>
      </div>
    );
  }

  const featuredMatches = state.matches.slice(0, 2);
  const listMatches = state.matches.slice(2);
  const phase = state.phase;

  /* ── JSX ── */
  return (
    <div className="relative min-h-full" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>

      {/* ── MOBILE OVERLAYS ── */}
      <AnimatePresence>
        {showLeftSidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 xl:hidden"
              onClick={() => setShowLeftSidebar(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-[60] xl:hidden flex flex-col overflow-y-auto"
              style={{ background: '#110000', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <LeftSidebar activeSport={activeSport} setActiveSport={setActiveSport}
                realData={realData} liveCount={realData?.liveCount ?? 0}
                wcData={wcData}
                onClose={() => setShowLeftSidebar(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBetSlip && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setShowBetSlip(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 w-80 z-[60] lg:hidden flex flex-col overflow-y-auto"
              style={{ background: '#110000', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              <BetSlipPanel {...betSlipProps} onClose={() => setShowBetSlip(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 3-COLUMN LAYOUT ── */}
      <div className="flex gap-3 items-start">

        {/* LEFT SIDEBAR */}
        <aside className="hidden xl:flex flex-col w-52 flex-shrink-0 sticky top-0 rounded-2xl overflow-hidden"
          style={{
            maxHeight: 'calc(100vh - 80px)',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
          <LeftSidebar activeSport={activeSport} setActiveSport={setActiveSport}
            realData={realData} liveCount={realData?.liveCount ?? 0} wcData={wcData} />
        </aside>

        {/* CENTER COLUMN */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Mobile top bar */}
          <div className="flex items-center gap-2 xl:hidden">
            <button onClick={() => setShowLeftSidebar(true)}
              className="p-2.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Menu className="w-4 h-4 text-white/60" />
            </button>
            <span className="text-white font-black text-sm flex-1"
              style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.06em', fontSize: 20 }}>
              DopartisBet
            </span>
            <button onClick={() => setShowBetSlip(true)}
              className="relative p-2.5 rounded-xl transition-all"
              style={{ background: betSlips.length > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.06)', border: betSlips.length > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
              <Ticket className="w-4 h-4 text-white/60" />
              {betSlips.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                  {betSlips.length}
                </span>
              )}
            </button>
          </div>

          {/* HERO BANNER */}
          <div className="relative rounded-2xl overflow-hidden" style={{ height: 140 }}>
            <div className="absolute inset-0"
              style={{ backgroundImage: 'url(/messi.jpg)', backgroundSize: 'cover', backgroundPosition: 'right 15%' }} />
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.25) 80%, transparent 100%)' }} />
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444, #dc2626)' }} />
            <div className="absolute inset-0 flex flex-col justify-center px-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(220,38,38,0.35)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <Zap className="w-2.5 h-2.5" /> PROMO EXCLUSIVA
                </span>
              </div>
              <h2 className="font-black text-white leading-tight text-xl sm:text-2xl"
                style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.04em' }}>
                10% Bono de Fichas
              </h2>
              <p className="text-red-200/70 text-xs mt-0.5">Para apuestas en vivo · Solo fichas ficticias 🎮</p>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-5xl opacity-20 hidden sm:block">
              ⚽
            </div>
          </div>

          {/* CATEGORY PILLS */}
          <div className="flex gap-2 flex-wrap">
            {[
              { icon: <Radio className="w-3.5 h-3.5" />, label: 'En Vivo', badge: phase === 'live' ? '⚡' : null },
              { icon: <span className="text-sm">⚽</span>,  label: 'Fútbol' },
              { icon: <span className="text-sm">🎾</span>,  label: 'Tenis' },
              { icon: <span className="text-sm">🏀</span>,  label: 'Básquet' },
              { icon: <Trophy className="w-3.5 h-3.5" />,  label: 'Torneos' },
            ].map(item => (
              <button key={item.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: item.label === 'Fútbol' ? '#dc2626' : 'rgba(255,255,255,0.06)',
                  color: item.label === 'Fútbol' ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: item.label === 'Fútbol' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: item.label === 'Fútbol' ? '0 2px 10px rgba(220,38,38,0.3)' : 'none',
                }}
                onMouseEnter={e => { if (item.label !== 'Fútbol') { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
                onMouseLeave={e => { if (item.label !== 'Fútbol') { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; } }}>
                {item.icon}
                {item.label}
                {item.badge && <span>{item.badge}</span>}
              </button>
            ))}
          </div>

          {/* TIME FILTERS + PHASE STATUS */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 p-1 rounded-xl flex-wrap"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {TIME_FILTERS.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: activeFilter === f ? '#dc2626' : 'transparent',
                    color: activeFilter === f ? '#fff' : 'rgba(255,255,255,0.35)',
                    boxShadow: activeFilter === f ? '0 2px 8px rgba(220,38,38,0.35)' : 'none',
                  }}>
                  {f}
                </button>
              ))}
            </div>

            {/* Phase pill */}
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{
                background: phase === 'live' ? 'rgba(239,68,68,0.15)' : phase === 'result' ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.1)',
                border: phase === 'live' ? '1px solid rgba(239,68,68,0.3)' : phase === 'result' ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(34,197,94,0.25)',
              }}>
              {phase === 'live' && <><Radio className="w-3 h-3 text-red-400 animate-pulse" /><span className="text-red-400 text-xs font-bold">EN VIVO</span></>}
              {phase === 'betting' && (
                <>
                  <Clock className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-xs font-bold">Apuestas</span>
                  <span className={`text-sm font-black ml-1 ${state.bettingTimeLeft <= 5 ? 'countdown-urgent' : 'text-yellow-400'}`}
                    style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}>
                    {state.bettingTimeLeft}s
                  </span>
                </>
              )}
              {phase === 'result' && <><Trophy className="w-3 h-3 text-yellow-400" /><span className="text-yellow-400 text-xs font-bold">Finalizado</span></>}
            </div>
          </div>

          {/* FEATURED MATCH CARDS — 2-col grid */}
          {featuredMatches.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 flex items-center gap-1.5 mb-3">
                <Star className="w-3 h-3 text-yellow-500" /> Partidos Destacados
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featuredMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    score={liveScores[match.id]}
                    phase={phase}
                    myBet={betSlips.find(b => b.matchId === match.id)}
                    disabled={phase !== 'betting'}
                    onBet={addBet}
                    result={results?.matches?.find((m: FootballMatch) => m.id === match.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* MATCH LIST */}
          {listMatches.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 flex items-center gap-1.5 mb-3">
                <Activity className="w-3 h-3 text-red-500" /> Todos los Partidos
              </p>
              <div className="space-y-1.5">
                {listMatches.map(match => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    score={liveScores[match.id]}
                    phase={phase}
                    myBet={betSlips.find(b => b.matchId === match.id)}
                    disabled={phase !== 'betting'}
                    onBet={addBet}
                    result={results?.matches?.find((m: FootballMatch) => m.id === match.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Live events feed (casino game) */}
          {liveEvents.length > 0 && (
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/60 flex items-center gap-1.5 mb-3">
                <Radio className="w-3 h-3 animate-pulse" /> Feed en Vivo — Juego Actual
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#7f0000 transparent' }}>
                {liveEvents.slice(-8).reverse().map((e, i) => (
                  <p key={i} className="text-xs text-white/45 flex items-start gap-2">
                    <span className="text-red-500 flex-shrink-0 mt-0.5">⚽</span>
                    {e.event.description}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ── WORLD CUP (shown when worldcup selected) ── */}
          {activeSport === 'worldcup' ? (
            <WorldCupSection
              data={wcData}
              loading={wcLoading}
              lastFetch={wcLastFetch}
              wcBets={wcBets}
              onWCBet={handleWCBet}
            />
          ) : (
            /* ── REAL WORLD SCORES (ESPN) ── */
            <RealScoresSection
              data={realData}
              loading={realLoading}
              error={realError}
              refresh={realRefresh}
              lastFetch={lastFetch}
              activeSport={activeSport}
            />
          )}
        </div>

        {/* RIGHT SIDEBAR — BET SLIP */}
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 sticky top-0 rounded-2xl overflow-hidden"
          style={{
            maxHeight: 'calc(100vh - 80px)',
            background: 'rgba(10,0,0,0.7)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
          }}>
          <BetSlipPanel {...betSlipProps} />
        </aside>
      </div>

      {/* MOBILE FLOATING BET SLIP BUTTON */}
      <AnimatePresence>
        {betSlips.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden">
            <button onClick={() => setShowBetSlip(true)}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm text-white shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #7f0000, #dc2626)',
                boxShadow: '0 8px 28px rgba(220,38,38,0.55)',
              }}>
              <Ticket className="w-4 h-4" />
              Ver Cupón
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                {betSlips.length}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
