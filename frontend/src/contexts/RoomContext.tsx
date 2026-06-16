'use client';
import {
  createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode,
} from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { GameType, PlayerInfo, ChatMessage, RouletteBet, HorseBet, FootballBet } from '@/types';

// Game logic (host only)
import { spin, resolveRouletteBets } from '@/lib/gameLogic/roulette';
import {
  createBJState, addBJPlayer, placeBJBet, startBJRound,
  hitBJ, standBJ, doubleDownBJ, serializeBJState,
} from '@/lib/gameLogic/blackjack';
import {
  createPokerState, addPokerPlayer, startPokerHand,
  pokerAction, endPokerHand, serializePokerState,
} from '@/lib/gameLogic/poker';
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
  balance: number;
  chatMessages: ChatMessage[];
  myId: string;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => void;
  off: (event: string, handler: (data: unknown) => void) => void;
  createRoom: (name: string, game: GameType) => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  reloadBalance: () => void;
  sendChat: (message: string) => void;
}

const RoomContext = createContext<RoomContextValue>({
  connected: false, roomCode: null, roomName: '', gameType: null,
  isHost: false, hostId: null, players: [], balance: 100000,
  chatMessages: [], myId: '',
  emit: () => {}, on: () => {}, off: () => {},
  createRoom: async () => null, joinRoom: async () => false,
  leaveRoom: () => {}, reloadBalance: () => {}, sendChat: () => {},
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function netChanges(bets: { playerId: string; amount: number }[], winnings: Map<string, number>): Record<string, number> {
  const updates: Record<string, number> = {};
  for (const b of bets) updates[b.playerId] = (updates[b.playerId] ?? 0) - b.amount;
  winnings.forEach((payout, pid) => { updates[pid] = (updates[pid] ?? 0) + payout; });
  return updates;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function RoomProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [balance, setBalance] = useState(100000);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());
  const playersRef = useRef<PlayerInfo[]>([]);
  const balanceRef = useRef(100000);
  const hostCleanupRef = useRef<(() => void) | null>(null);

  const isHost = !!(user && hostId && user.id === hostId);
  const myId = user?.id ?? '';

  // Keep refs in sync
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);

  // ── emit ──────────────────────────────────────────────────────────────────
  const emit = useCallback((event: string, data?: unknown) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'casino',
      payload: { e: event, d: data ?? {} },
    }).catch(() => {});
  }, []);

  // ── on / off ──────────────────────────────────────────────────────────────
  const on = useCallback((event: string, handler: (data: unknown) => void) => {
    if (!handlersRef.current.has(event)) handlersRef.current.set(event, new Set());
    handlersRef.current.get(event)!.add(handler);
  }, []);

  const off = useCallback((event: string, handler: (data: unknown) => void) => {
    handlersRef.current.get(event)?.delete(handler);
  }, []);

  // ── updateBalances (host → all clients) ──────────────────────────────────
  const updateBalances = useCallback((updates: Record<string, number>) => {
    emit('balance:update', { updates });
    if (!supabase) return;
    for (const [pid, delta] of Object.entries(updates)) {
      if (delta !== 0) {
        void (async () => { await supabase!.rpc('add_to_balance', { p_id: pid, delta }); })();
      }
    }
  }, [emit]);

  // ── Listen to balance:update from host ────────────────────────────────────
  useEffect(() => {
    const handler = (data: unknown) => {
      const d = data as { updates: Record<string, number> };
      const delta = d?.updates?.[user?.id ?? ''];
      if (delta !== undefined) {
        setBalance(prev => {
          const next = Math.max(0, prev + delta);
          balanceRef.current = next;
          if (supabase && user) {
            void supabase.from('players').update({ balance: next }).eq('id', user.id);
          }
          return next;
        });
      }
    };
    on('balance:update', handler);
    return () => off('balance:update', handler);
  }, [on, off, user]);

  // ── connectChannel ────────────────────────────────────────────────────────
  const connectChannel = useCallback(async (
    code: string, name: string, game: GameType, hId: string
  ) => {
    if (!supabase || !user) return;
    if (channelRef.current) await supabase.removeChannel(channelRef.current);

    const ch = supabase.channel(`room-${code}`, {
      config: {
        broadcast: { self: true },
        presence: { key: user.id },
      },
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
        socketId: id,
        alias: arr[0]?.alias ?? id,
        balance: arr[0]?.balance ?? 100000,
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
    setRoomCode(code);
    setRoomName(name);
    setGameType(game);
    setHostId(hId);
  }, [user]);

  // ── createRoom ────────────────────────────────────────────────────────────
  const createRoom = useCallback(async (name: string, game: GameType): Promise<string | null> => {
    if (!supabase || !user) return null;
    await supabase.from('players').upsert(
      { id: user.id, alias: user.alias, balance: 100000 },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    const code = generateRoomCode();
    const { error } = await supabase.from('rooms').insert({ code, name, game_type: game, host_id: user.id });
    if (error) return null;
    await connectChannel(code, name, game, user.id);
    return code;
  }, [user, connectChannel]);

  // ── joinRoom ──────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async (code: string): Promise<boolean> => {
    if (!supabase || !user) return false;
    await supabase.from('players').upsert(
      { id: user.id, alias: user.alias, balance: 100000 },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    // Fetch current balance from DB
    const { data: dbPlayer } = await supabase.from('players').select('balance').eq('id', user.id).single();
    if (dbPlayer?.balance) { setBalance(dbPlayer.balance); balanceRef.current = dbPlayer.balance; }

    const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single();
    if (!room) return false;
    await connectChannel(code, room.name, room.game_type as GameType, room.host_id);
    return true;
  }, [user, connectChannel]);

  // ── leaveRoom ─────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    hostCleanupRef.current?.();
    hostCleanupRef.current = null;
    if (supabase && channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    setConnected(false); setRoomCode(null); setRoomName('');
    setGameType(null); setHostId(null); setPlayers([]); setChatMessages([]);
  }, []);

  // ── reloadBalance ─────────────────────────────────────────────────────────
  const reloadBalance = useCallback(() => {
    const newBal = 100000;
    setBalance(newBal); balanceRef.current = newBal;
    if (supabase && user) void supabase.from('players').update({ balance: newBal }).eq('id', user.id);
    channelRef.current?.track({ alias: user?.alias, balance: newBal });
  }, [user]);

  // ── sendChat ──────────────────────────────────────────────────────────────
  const sendChat = useCallback((message: string) => {
    if (!channelRef.current || !user) return;
    const msg: ChatMessage = { alias: user.alias, message, timestamp: Date.now() };
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg }).catch(() => {});
  }, [user]);

  // ══════════════════════════════════════════════════════════════════════════
  // HOST GAME CYCLES — only runs on the creator's browser
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isHost || !gameType) return;

    hostCleanupRef.current?.();
    let cleanup: (() => void) | null = null;

    // Small delay to ensure channel is subscribed
    const startTimer = setTimeout(() => {
      switch (gameType) {
        case 'roulette':   cleanup = startRouletteHost(emit, on, off, updateBalances); break;
        case 'blackjack':  cleanup = startBlackjackHost(emit, on, off, updateBalances, playersRef); break;
        case 'poker':      cleanup = startPokerHost(emit, on, off, updateBalances, playersRef); break;
        case 'horses':     cleanup = startHorsesHost(emit, on, off, updateBalances); break;
        case 'football':   cleanup = startFootballHost(emit, on, off, updateBalances); break;
      }
      hostCleanupRef.current = cleanup;
    }, 1500);

    return () => {
      clearTimeout(startTimer);
      cleanup?.();
      hostCleanupRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, gameType]);

  return (
    <RoomContext.Provider value={{
      connected, roomCode, roomName, gameType, isHost, hostId,
      players, balance, chatMessages, myId,
      emit, on, off,
      createRoom, joinRoom, leaveRoom, reloadBalance, sendChat,
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

function startRouletteHost(
  emit: Emit, on: Sub, off: Sub,
  updateBalances: (u: Record<string, number>) => void
): () => void {
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
        const updates = netChanges([...bets], winnings);
        emit('roulette:result', { winningNumber, winnings: Object.fromEntries(winnings) });
        emit('roulette:state', { phase: 'result', winningNumber, bets: [...bets], bettingTimeLeft: 0 });
        updateBalances(updates);
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
  emit: Emit, on: Sub, off: Sub,
  updateBalances: (u: Record<string, number>) => void,
  playersRef: { current: PlayerInfo[] }
): () => void {
  let stopped = false;
  const bjState = createBJState();

  // Re-init player list each cycle
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

  const hitHandler = (d: unknown) => {
    if (stopped || bjState.phase !== 'playing') return;
    const { playerId } = d as { playerId: string };
    if (bjState.currentPlayerSocketId !== playerId) return;
    hitBJ(bjState, playerId);
    emit('blackjack:state', serializeBJState(bjState));
    if ((bjState.phase as string) === 'results') finishBJ();
  };

  const standHandler = (d: unknown) => {
    if (stopped || bjState.phase !== 'playing') return;
    const { playerId } = d as { playerId: string };
    if (bjState.currentPlayerSocketId !== playerId) return;
    standBJ(bjState, playerId);
    emit('blackjack:state', serializeBJState(bjState));
    if ((bjState.phase as string) === 'results') finishBJ();
  };

  const doubleHandler = (d: unknown) => {
    if (stopped || bjState.phase !== 'playing') return;
    const { playerId } = d as { playerId: string };
    if (bjState.currentPlayerSocketId !== playerId) return;
    doubleDownBJ(bjState, playerId);
    emit('blackjack:state', serializeBJState(bjState));
    if ((bjState.phase as string) === 'results') finishBJ();
  };

  on('blackjack:bet', betHandler);
  on('blackjack:hit', hitHandler);
  on('blackjack:stand', standHandler);
  on('blackjack:double', doubleHandler);

  let timer: ReturnType<typeof setInterval> | null = null;
  let t1: ReturnType<typeof setTimeout> | null = null;
  let t2: ReturnType<typeof setTimeout> | null = null;

  const finishBJ = () => {
    const balUpdates: Record<string, number> = {};
    for (const p of bjState.players) {
      const original = playersRef.current.find(pl => pl.socketId === p.socketId)?.balance ?? 100000;
      balUpdates[p.socketId] = p.balance - original;
    }
    updateBalances(balUpdates);
    t2 = setTimeout(() => { if (!stopped) runCycle(); }, 6000);
  };

  const runCycle = () => {
    if (stopped) return;
    initPlayers();
    let timeLeft = 15;
    emit('blackjack:state', serializeBJState(bjState));
    emit('blackjack:timer', { timeLeft });

    timer = setInterval(() => {
      if (stopped) { clearInterval(timer!); return; }
      timeLeft--;
      emit('blackjack:timer', { timeLeft });

      if (timeLeft > 0) return;
      clearInterval(timer!);

      // Start round
      startBJRound(bjState);
      emit('blackjack:state', serializeBJState(bjState));

      // If no active players, finish immediately
      if (bjState.phase === 'results') {
        t1 = setTimeout(() => { if (!stopped) finishBJ(); }, 2000);
      }
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

// ── Poker ─────────────────────────────────────────────────────────────────────

function startPokerHost(
  emit: Emit, on: Sub, off: Sub,
  updateBalances: (u: Record<string, number>) => void,
  playersRef: { current: PlayerInfo[] }
): () => void {
  let stopped = false;
  const pState = createPokerState(100);

  const initPokerPlayers = () => {
    pState.players = [];
    playersRef.current.forEach(p => addPokerPlayer(pState, p.socketId, p.alias, p.balance));
  };

  const startHandler = () => {
    if (stopped) return;
    if (pState.players.length < 2) {
      // Re-init and try again
      initPokerPlayers();
      if (pState.players.length < 2) return;
    }
    startPokerHand(pState);
    // Send personalized state to each player
    broadcastPokerState();
  };

  const actionHandler = (d: unknown) => {
    if (stopped) return;
    const { playerId, action, amount } = d as { playerId: string; action: 'fold'|'check'|'call'|'raise'|'allin'; amount?: number };
    if (pokerAction(pState, playerId, action, amount)) {
      broadcastPokerState();
      if (pState.phase === 'showdown') finishPoker();
    }
  };

  const nextHandHandler = () => {
    if (stopped) return;
    initPokerPlayers();
    startPokerHand(pState);
    broadcastPokerState();
  };

  const broadcastPokerState = () => {
    // Broadcast full state — each client sees their own hole cards
    // Security note: other players' hole cards visible in network tab (friends game, acceptable)
    const publicState = serializePokerState(pState);
    emit('poker:state', publicState);
    // Also send individual hole cards via separate events per player
    for (const p of pState.players) {
      emit(`poker:hole:${p.socketId}`, { holeCards: p.holeCardsFull });
    }
  };

  const finishPoker = () => {
    if (stopped) return;
    const balUpdates: Record<string, number> = {};
    for (const p of pState.players) {
      const original = playersRef.current.find(pl => pl.socketId === p.socketId)?.balance ?? 100000;
      balUpdates[p.socketId] = p.balance - original;
    }
    updateBalances(balUpdates);
  };

  on('poker:start', startHandler);
  on('poker:action', actionHandler);
  on('poker:next-hand', nextHandHandler);

  // Initialize players and send initial state
  initPokerPlayers();
  emit('poker:state', serializePokerState(pState));

  return () => {
    stopped = true;
    off('poker:start', startHandler);
    off('poker:action', actionHandler);
    off('poker:next-hand', nextHandHandler);
  };
}

// ── Horses ────────────────────────────────────────────────────────────────────

function startHorsesHost(
  emit: Emit, on: Sub, off: Sub,
  updateBalances: (u: Record<string, number>) => void
): () => void {
  let stopped = false;
  const hState = createHorsesState();

  const betHandler = (d: unknown) => {
    if (stopped || hState.phase !== 'betting') return;
    const bet = d as HorseBet;
    hState.bets.push(bet);
    emit('horses:state', { ...hState });
  };

  on('horses:bet', betHandler);

  let timer: ReturnType<typeof setInterval> | null = null;
  let t1: ReturnType<typeof setTimeout> | null = null;
  let t2: ReturnType<typeof setTimeout> | null = null;
  let frameInterval: ReturnType<typeof setInterval> | null = null;

  const runCycle = () => {
    if (stopped) return;
    resetHorsesState(hState);
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

      // Simulate race
      const { frames, winnerId } = simulateRace(hState.horses);
      let frameIdx = 0;

      frameInterval = setInterval(() => {
        if (stopped || frameIdx >= frames.length) {
          clearInterval(frameInterval!);
          if (!stopped) {
            // Race finished
            hState.winnerId = winnerId;
            hState.phase = 'result';

            const winnings = resolveHorsesBets(hState.bets, winnerId, hState.horses);
            const updates = netChanges(hState.bets, winnings);

            emit('horses:frame', { positions: frames[frames.length - 1], winnerId });
            emit('horses:result', {
              winnerId,
              winnerName: hState.horses.find(h => h.id === winnerId)?.name ?? '',
              winnings: Object.fromEntries(winnings),
            });
            updateBalances(updates);

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
    if (t1) clearTimeout(t1);
    if (t2) clearTimeout(t2);
    off('horses:bet', betHandler);
  };
}

// ── Football ──────────────────────────────────────────────────────────────────

function startFootballHost(
  emit: Emit, on: Sub, off: Sub,
  updateBalances: (u: Record<string, number>) => void
): () => void {
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

      // Simulate all matches sequentially with delays
      let delay = 0;
      for (const match of fState.matches) {
        const events = simulateMatch(match);
        for (const event of events) {
          const d = delay + event.minute * 30; // 30ms per minute = ~3s total
          setTimeout(() => {
            if (stopped) return;
            emit('football:event', {
              matchId: match.id, event,
              homeScore: match.homeScore, awayScore: match.awayScore,
            });
          }, d);
        }
        delay += 3200; // stagger matches
      }

      t1 = setTimeout(() => {
        if (stopped) return;
        // All matches finished
        const winnings = resolveFootballBets(fState.bets, fState.matches);
        const updates = netChanges(fState.bets, winnings);

        emit('football:results', {
          matches: fState.matches,
          winnings: Object.fromEntries(winnings),
        });
        updateBalances(updates);

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
