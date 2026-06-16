'use client';
import {
  createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode,
} from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { GameType, PlayerInfo, ChatMessage, RouletteBet, HorseBet, FootballBet } from '@/types';

// Game logic (host only)
import { spin, resolveRouletteBets } from '@/lib/gameLogic/roulette';
import {
  createBJState, addBJPlayer, placeBJBet, startBJRound,
  hitBJ, standBJ, doubleDownBJ, serializeBJState,
} from '@/lib/gameLogic/blackjack';
import { createHorsesState, resetHorsesState, simulateRace, resolveHorsesBets } from '@/lib/gameLogic/horses';
import {
  createFootballState, simulateMatch, resolveFootballBets, resetFootballState,
} from '@/lib/gameLogic/football';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RoomContextValue {
  connected: boolean;
  roomCode: string | null;
  roomName: string;
  gameType: GameType | null;
  isHost: boolean;
  hostId: string | null;
  players: PlayerInfo[];
  balance: number;             // autoritativo: profile.balance
  chatMessages: ChatMessage[];
  myId: string;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => void;
  off: (event: string, handler: (data: unknown) => void) => void;
  createRoom: (name: string, game: GameType) => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  /** Debita una apuesta del propio saldo (RPC place_bet). Devuelve true si se aceptó. */
  placeBet: (amount: number) => Promise<boolean>;
  sendChat: (message: string) => void;
}

const RoomContext = createContext<RoomContextValue>({
  connected: false, roomCode: null, roomName: '', gameType: null,
  isHost: false, hostId: null, players: [], balance: 0,
  chatMessages: [], myId: '',
  emit: () => {}, on: () => {}, off: () => {},
  createRoom: async () => null, joinRoom: async () => false,
  leaveRoom: () => {}, placeBet: async () => false, sendChat: () => {},
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

type Settle = (roundId: string, payouts: Record<string, number>) => void;

// ─── Provider ────────────────────────────────────────────────────────────────

export function RoomProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();

  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const balance = profile?.balance ?? 0;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());
  const playersRef = useRef<PlayerInfo[]>([]);
  const balanceRef = useRef(balance);
  const hostCleanupRef = useRef<(() => void) | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const gameTypeRef = useRef<GameType | null>(null);
  const currentRoundIdRef = useRef<string | null>(null);

  const isHost = !!(user && hostId && user.id === hostId);
  const myId = user?.id ?? '';

  useEffect(() => { playersRef.current = players; }, [players]);

  // Sincronizar balance autoritativo → presence (para mostrar saldos de la mesa)
  useEffect(() => {
    balanceRef.current = balance;
    if (channelRef.current && user) {
      channelRef.current.track({ alias: user.alias, balance }).catch(() => {});
    }
  }, [balance, user]);

  // ── emit / on / off ─────────────────────────────────────────────────────────
  const emit = useCallback((event: string, data?: unknown) => {
    if (!channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'casino', payload: { e: event, d: data ?? {} } }).catch(() => {});
  }, []);

  const on = useCallback((event: string, handler: (data: unknown) => void) => {
    if (!handlersRef.current.has(event)) handlersRef.current.set(event, new Set());
    handlersRef.current.get(event)!.add(handler);
  }, []);

  const off = useCallback((event: string, handler: (data: unknown) => void) => {
    handlersRef.current.get(event)?.delete(handler);
  }, []);

  // ── round id sync (cualquier cliente lee el round actual del host) ───────────
  useEffect(() => {
    const handler = (d: unknown) => { currentRoundIdRef.current = (d as { roundId: string }).roundId; };
    on('round', handler);
    return () => off('round', handler);
  }, [on, off]);

  // ── settle (solo el host): acredita ganancias brutas vía RPC ─────────────────
  const settle = useCallback<Settle>((roundId, payouts) => {
    const entries = Object.entries(payouts).filter(([, amt]) => amt > 0);
    if (!roomCodeRef.current || !gameTypeRef.current || entries.length === 0) return;
    void supabase.rpc('settle_game_round', {
      p_round: roundId,
      p_game_type: gameTypeRef.current,
      p_room_code: roomCodeRef.current,
      p_payouts: entries.map(([player, amount]) => ({ player, amount })),
    }).then(({ error }) => { if (error) console.error('settle_game_round', error.message); });
  }, []);

  // ── placeBet (el propio jugador debita su apuesta) ───────────────────────────
  const placeBet = useCallback(async (amount: number): Promise<boolean> => {
    if (amount <= 0) return false;
    if (!roomCodeRef.current || !gameTypeRef.current) return false;
    if (!currentRoundIdRef.current) { toast.error('Esperá a que abra la ronda'); return false; }
    const { error } = await supabase.rpc('place_bet', {
      p_round: currentRoundIdRef.current,
      p_amount: amount,
      p_game_type: gameTypeRef.current,
      p_room_code: roomCodeRef.current,
    });
    if (error) {
      toast.error(error.message.includes('insuficiente') ? 'Saldo insuficiente' : 'No se pudo apostar');
      return false;
    }
    return true;
  }, []);

  // ── connectChannel ────────────────────────────────────────────────────────
  const connectChannel = useCallback(async (code: string, name: string, game: GameType, hId: string) => {
    if (!user) return;
    if (channelRef.current) await supabase.removeChannel(channelRef.current);

    const ch = supabase.channel(`room-${code}`, {
      config: { broadcast: { self: true }, presence: { key: user.id } },
    });

    ch.on('broadcast', { event: 'casino' }, ({ payload }: { payload: { e: string; d: unknown } }) => {
      handlersRef.current.get(payload.e)?.forEach(h => h(payload.d));
    });
    ch.on('broadcast', { event: 'chat' }, ({ payload }: { payload: ChatMessage }) => {
      setChatMessages(prev => [...prev.slice(-99), payload]);
    });
    ch.on('presence', { event: 'sync' }, () => {
      const ps = ch.presenceState<{ alias: string; balance: number }>();
      const list: PlayerInfo[] = Object.entries(ps).map(([id, arr]) => ({
        socketId: id, alias: arr[0]?.alias ?? id, balance: arr[0]?.balance ?? 0,
      }));
      setPlayers(list);
      playersRef.current = list;
    });

    ch.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true);
        await ch.track({ alias: user.alias, balance: balanceRef.current });
      }
    });

    channelRef.current = ch;
    roomCodeRef.current = code;
    gameTypeRef.current = game;
    setRoomCode(code); setRoomName(name); setGameType(game); setHostId(hId);
  }, [user]);

  // ── createRoom / joinRoom / leaveRoom ───────────────────────────────────────
  const createRoom = useCallback(async (name: string, game: GameType): Promise<string | null> => {
    if (!user) return null;
    const code = generateRoomCode();
    const { error } = await supabase.from('rooms').insert({ code, name, game_type: game, host_id: user.id });
    if (error) return null;
    await connectChannel(code, name, game, user.id);
    return code;
  }, [user, connectChannel]);

  const joinRoom = useCallback(async (code: string): Promise<boolean> => {
    if (!user) return false;
    const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single();
    if (!room) return false;
    await connectChannel(code, room.name, room.game_type as GameType, room.host_id);
    return true;
  }, [user, connectChannel]);

  const leaveRoom = useCallback(() => {
    hostCleanupRef.current?.();
    hostCleanupRef.current = null;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    roomCodeRef.current = null; gameTypeRef.current = null; currentRoundIdRef.current = null;
    setConnected(false); setRoomCode(null); setRoomName('');
    setGameType(null); setHostId(null); setPlayers([]); setChatMessages([]);
  }, []);

  const sendChat = useCallback((message: string) => {
    if (!channelRef.current || !user) return;
    const msg: ChatMessage = { alias: user.alias, message, timestamp: Date.now() };
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg }).catch(() => {});
  }, [user]);

  // ══════════════════════════════════════════════════════════════════════════
  // HOST GAME CYCLES — solo corren en el browser del creador
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isHost || !gameType) return;
    hostCleanupRef.current?.();
    let cleanup: (() => void) | null = null;

    const startTimer = setTimeout(() => {
      switch (gameType) {
        case 'roulette':  cleanup = startRouletteHost(emit, on, off, settle); break;
        case 'blackjack': cleanup = startBlackjackHost(emit, on, off, settle, playersRef); break;
        case 'horses':    cleanup = startHorsesHost(emit, on, off, settle); break;
        case 'football':  cleanup = startFootballHost(emit, on, off, settle); break;
        // 'poker' en mantenimiento (ciegas no compatibles con place_bet por-jugador)
      }
      hostCleanupRef.current = cleanup;
    }, 1500);

    return () => { clearTimeout(startTimer); cleanup?.(); hostCleanupRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, gameType]);

  return (
    <RoomContext.Provider value={{
      connected, roomCode, roomName, gameType, isHost, hostId,
      players, balance, chatMessages, myId,
      emit, on, off, createRoom, joinRoom, leaveRoom, placeBet, sendChat,
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);

// ══════════════════════════════════════════════════════════════════════════════
// HOST CYCLE FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

type Emit = (event: string, data?: unknown) => void;
type Sub  = (event: string, h: (d: unknown) => void) => void;

// ── Roulette ──────────────────────────────────────────────────────────────────
function startRouletteHost(emit: Emit, on: Sub, off: Sub, settle: Settle): () => void {
  let stopped = false;
  const bets: RouletteBet[] = [];
  const betHandler = (d: unknown) => { if (!stopped) bets.push(d as RouletteBet); };
  on('roulette:bet', betHandler);

  let timer: ReturnType<typeof setInterval> | null = null;
  let t1: ReturnType<typeof setTimeout> | null = null;
  let t2: ReturnType<typeof setTimeout> | null = null;

  const runCycle = () => {
    if (stopped) return;
    bets.length = 0;
    const roundId = uuidv4();
    emit('round', { roundId });
    let timeLeft = 20;
    emit('roulette:state', { phase: 'betting', bettingTimeLeft: 20, bets: [], winningNumber: null });

    timer = setInterval(() => {
      if (stopped) { clearInterval(timer!); return; }
      timeLeft--;
      emit('roulette:timer', { timeLeft });
      if (timeLeft > 0) return;
      clearInterval(timer!);

      const winningNumber = spin();
      emit('roulette:spin', { winningNumber });
      emit('roulette:state', { phase: 'spinning', bettingTimeLeft: 0, bets: [...bets], winningNumber });

      t1 = setTimeout(() => {
        if (stopped) return;
        const winnings = resolveRouletteBets([...bets], winningNumber);
        emit('roulette:result', { winningNumber, winnings: Object.fromEntries(winnings) });
        emit('roulette:state', { phase: 'result', winningNumber, bets: [...bets], bettingTimeLeft: 0 });
        settle(roundId, Object.fromEntries(winnings));
        t2 = setTimeout(() => { if (!stopped) runCycle(); }, 6000);
      }, 7000);
    }, 1000);
  };

  runCycle();
  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    if (t1) clearTimeout(t1);
    if (t2) clearTimeout(t2);
    off('roulette:bet', betHandler);
  };
}

// ── Blackjack ─────────────────────────────────────────────────────────────────
function startBlackjackHost(
  emit: Emit, on: Sub, off: Sub, settle: Settle, playersRef: { current: PlayerInfo[] },
): () => void {
  let stopped = false;
  const bjState = createBJState();
  let roundId = uuidv4();

  const initPlayers = () => {
    bjState.players = [];
    playersRef.current.forEach((p, i) => addBJPlayer(bjState, p.socketId, p.alias, p.balance, i));
  };

  const betHandler = (d: unknown) => {
    if (stopped || bjState.phase !== 'betting') return;
    const { playerId, amount } = d as { playerId: string; amount: number };
    placeBJBet(bjState, playerId, amount);
    emit('blackjack:state', serializeBJState(bjState));
  };
  const act = (fn: (s: typeof bjState, id: string) => boolean) => (d: unknown) => {
    if (stopped || bjState.phase !== 'playing') return;
    const { playerId } = d as { playerId: string };
    if (bjState.currentPlayerSocketId !== playerId) return;
    fn(bjState, playerId);
    emit('blackjack:state', serializeBJState(bjState));
    if ((bjState.phase as string) === 'results') finishBJ();
  };
  const hitHandler = act(hitBJ), standHandler = act(standBJ), doubleHandler = act(doubleDownBJ);

  on('blackjack:bet', betHandler);
  on('blackjack:hit', hitHandler);
  on('blackjack:stand', standHandler);
  on('blackjack:double', doubleHandler);

  let timer: ReturnType<typeof setInterval> | null = null;
  let t1: ReturnType<typeof setTimeout> | null = null;
  let t2: ReturnType<typeof setTimeout> | null = null;

  const finishBJ = () => {
    settle(roundId, Object.fromEntries(bjState.lastPayouts ?? new Map()));
    t2 = setTimeout(() => { if (!stopped) runCycle(); }, 6000);
  };

  const runCycle = () => {
    if (stopped) return;
    initPlayers();
    roundId = uuidv4();
    emit('round', { roundId });
    let timeLeft = 15;
    emit('blackjack:state', serializeBJState(bjState));
    emit('blackjack:timer', { timeLeft });

    timer = setInterval(() => {
      if (stopped) { clearInterval(timer!); return; }
      timeLeft--;
      emit('blackjack:timer', { timeLeft });
      if (timeLeft > 0) return;
      clearInterval(timer!);
      startBJRound(bjState);
      emit('blackjack:state', serializeBJState(bjState));
      if (bjState.phase === 'results') t1 = setTimeout(() => { if (!stopped) finishBJ(); }, 2000);
    }, 1000);
  };

  runCycle();
  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    if (t1) clearTimeout(t1);
    if (t2) clearTimeout(t2);
    off('blackjack:bet', betHandler);
    off('blackjack:hit', hitHandler);
    off('blackjack:stand', standHandler);
    off('blackjack:double', doubleHandler);
  };
}

// ── Horses ────────────────────────────────────────────────────────────────────
function startHorsesHost(emit: Emit, on: Sub, off: Sub, settle: Settle): () => void {
  let stopped = false;
  const hState = createHorsesState();
  const betHandler = (d: unknown) => {
    if (stopped || hState.phase !== 'betting') return;
    hState.bets.push(d as HorseBet);
    emit('horses:state', { ...hState });
  };
  on('horses:bet', betHandler);

  let timer: ReturnType<typeof setInterval> | null = null;
  let t2: ReturnType<typeof setTimeout> | null = null;
  let frameInterval: ReturnType<typeof setInterval> | null = null;

  const runCycle = () => {
    if (stopped) return;
    resetHorsesState(hState);
    const roundId = uuidv4();
    emit('round', { roundId });
    let timeLeft = 20;
    emit('horses:state', { ...hState });
    emit('horses:timer', { timeLeft });

    timer = setInterval(() => {
      if (stopped) { clearInterval(timer!); return; }
      timeLeft--;
      emit('horses:timer', { timeLeft });
      if (timeLeft > 0) return;
      clearInterval(timer!);

      hState.phase = 'racing';
      emit('horses:state', { ...hState });
      const { frames, winnerId } = simulateRace(hState.horses);
      let frameIdx = 0;

      frameInterval = setInterval(() => {
        if (stopped || frameIdx >= frames.length) {
          clearInterval(frameInterval!);
          if (!stopped) {
            hState.winnerId = winnerId;
            hState.phase = 'result';
            const winnings = resolveHorsesBets(hState.bets, winnerId, hState.horses);
            emit('horses:frame', { positions: frames[frames.length - 1], winnerId });
            emit('horses:result', {
              winnerId, winnerName: hState.horses.find(h => h.id === winnerId)?.name ?? '',
              winnings: Object.fromEntries(winnings),
            });
            settle(roundId, Object.fromEntries(winnings));
            t2 = setTimeout(() => { if (!stopped) runCycle(); }, 6000);
          }
          return;
        }
        const pos = frames[frameIdx];
        const wid = frameIdx === frames.length - 1 ? winnerId : null;
        emit('horses:frame', { positions: pos, winnerId: wid });
        frameIdx++;
      }, 120);
    }, 1000);
  };

  runCycle();
  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    if (frameInterval) clearInterval(frameInterval);
    if (t2) clearTimeout(t2);
    off('horses:bet', betHandler);
  };
}

// ── Football ──────────────────────────────────────────────────────────────────
function startFootballHost(emit: Emit, on: Sub, off: Sub, settle: Settle): () => void {
  let stopped = false;
  const fState = createFootballState();
  const betHandler = (d: unknown) => {
    if (stopped || fState.phase !== 'betting') return;
    fState.bets.push(d as FootballBet);
  };
  on('football:bet', betHandler);

  let timer: ReturnType<typeof setInterval> | null = null;
  let t1: ReturnType<typeof setTimeout> | null = null;
  let t2: ReturnType<typeof setTimeout> | null = null;

  const runCycle = () => {
    if (stopped) return;
    resetFootballState(fState);
    const roundId = uuidv4();
    emit('round', { roundId });
    let timeLeft = 25;
    emit('football:state', { phase: 'betting', matches: fState.matches, bets: [], bettingTimeLeft: 25 });
    emit('football:timer', { timeLeft });

    timer = setInterval(() => {
      if (stopped) { clearInterval(timer!); return; }
      timeLeft--;
      emit('football:timer', { timeLeft });
      if (timeLeft > 0) return;
      clearInterval(timer!);

      fState.phase = 'live';
      emit('football:state', { phase: 'live', matches: fState.matches, bets: fState.bets, bettingTimeLeft: 0 });

      let delay = 0;
      for (const match of fState.matches) {
        const events = simulateMatch(match);
        for (const event of events) {
          const d = delay + event.minute * 30;
          setTimeout(() => {
            if (stopped) return;
            emit('football:event', { matchId: match.id, event, homeScore: match.homeScore, awayScore: match.awayScore });
          }, d);
        }
        delay += 3200;
      }

      t1 = setTimeout(() => {
        if (stopped) return;
        const winnings = resolveFootballBets(fState.bets, fState.matches);
        emit('football:results', { matches: fState.matches, winnings: Object.fromEntries(winnings) });
        settle(roundId, Object.fromEntries(winnings));
        t2 = setTimeout(() => { if (!stopped) runCycle(); }, 8000);
      }, delay + 4000);
    }, 1000);
  };

  runCycle();
  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    if (t1) clearTimeout(t1);
    if (t2) clearTimeout(t2);
    off('football:bet', betHandler);
  };
}
