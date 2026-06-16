import { Server, Socket } from 'socket.io';
import {
  createRoom, getRoom, addPlayerToRoom, removePlayerFromRoom,
  updatePlayerBalance, reloadPlayerBalance, addChatMessage, getRoomPublicState,
} from '../store/roomStore';
import { GameType, RouletteBetType } from '../types';
import { createRouletteState, spin, resolveRouletteBets, buildBetNumbers } from '../games/roulette';
import {
  createBlackjackState, addBlackjackPlayer, placeBet as bjPlaceBet,
  startRound, hit, stand, doubleDown, resetBlackjackRound,
} from '../games/blackjack';
import {
  createPokerState, addPokerPlayer, removePokerPlayer,
  startPokerHand, pokerAction, getPokerPublicState,
} from '../games/poker';
import { createHorsesState, simulateRace, resolveHorsesBets, resetHorsesState } from '../games/horses';
import { createFootballState, simulateMatch, resolveFootballBets, resetFootballState } from '../games/football';

const socketToRoom = new Map<string, string>();

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Connected: ${socket.id}`);

    // ─── Room Management ────────────────────────────────────────────────────
    socket.on('room:create', ({ name, game, alias }: { name: string; game: GameType; alias: string }) => {
      const room = createRoom(name, game, socket.id);
      const player = addPlayerToRoom(room.code, socket.id, alias);
      if (!player) return;

      socketToRoom.set(socket.id, room.code);
      socket.join(room.code);

      initGameState(room.code, game, io, socket);

      socket.emit('room:joined', { room: getRoomPublicState(room) });
      socket.emit('balance:update', { balance: player.balance });
    });

    socket.on('room:join', ({ code, alias }: { code: string; alias: string }) => {
      const room = getRoom(code);
      if (!room) {
        socket.emit('error', { message: 'Sala no encontrada' });
        return;
      }

      const player = addPlayerToRoom(code, socket.id, alias);
      if (!player) return;

      socketToRoom.set(socket.id, code);
      socket.join(code);

      // Add player to game state if applicable
      if (room.game === 'blackjack' && room.gameState) {
        const state = room.gameState as any;
        if (state.phase === 'betting') {
          addBlackjackPlayer(state, socket.id, alias, player.balance, state.players.size);
        }
      } else if (room.game === 'poker' && room.gameState) {
        const state = room.gameState as any;
        addPokerPlayer(state, socket.id, alias, player.balance);
      }

      socket.emit('room:joined', { room: getRoomPublicState(room) });
      socket.emit('balance:update', { balance: player.balance });
      io.to(code).emit('room:update', { room: getRoomPublicState(room) });
      io.to(code).emit('chat:message', { alias: 'Sistema', message: `${alias} entró a la sala`, timestamp: Date.now() });

      broadcastGameState(code, room.game, io, socket.id);
    });

    socket.on('balance:reload', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const balance = reloadPlayerBalance(code, socket.id);
      socket.emit('balance:update', { balance });
    });

    // ─── Chat ───────────────────────────────────────────────────────────────
    socket.on('chat:send', ({ message }: { message: string }) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (!player) return;
      const clean = message.slice(0, 200);
      addChatMessage(code, player.alias, clean);
      io.to(code).emit('chat:message', { alias: player.alias, message: clean, timestamp: Date.now() });
    });

    // ─── Roulette ────────────────────────────────────────────────────────────
    socket.on('roulette:bet', ({ type, numbers, amount }: { type: RouletteBetType; numbers?: number[]; amount: number }) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'roulette') return;
      const state = room.gameState as any;
      if (!state || state.phase !== 'betting') return;

      const player = room.players.get(socket.id);
      if (!player || player.balance < amount || amount <= 0) return;

      const betNumbers = numbers ?? buildBetNumbers(type);
      state.bets.push({ playerId: socket.id, type, numbers: betNumbers, amount });
      updatePlayerBalance(code, socket.id, -amount);
      socket.emit('balance:update', { balance: player.balance });
      io.to(code).emit('roulette:state', sanitizeRouletteState(state));
    });

    // ─── Blackjack ───────────────────────────────────────────────────────────
    socket.on('blackjack:bet', ({ amount }: { amount: number }) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'blackjack') return;
      const state = room.gameState as any;
      if (!state) return;

      const player = room.players.get(socket.id);
      if (!player || player.balance < amount) return;

      const bjPlayer = state.players.get(socket.id);
      if (!bjPlayer) {
        addBlackjackPlayer(state, socket.id, player.alias, player.balance, state.players.size);
      }
      bjPlaceBet(state, socket.id, amount);
      updatePlayerBalance(code, socket.id, 0); // balance tracked inside state
      io.to(code).emit('blackjack:state', sanitizeBjState(state));
    });

    socket.on('blackjack:hit', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'blackjack') return;
      const state = room.gameState as any;
      if (!state || state.currentPlayerSocketId !== socket.id) return;
      hit(state, socket.id);
      checkBlackjackEnd(code, room, state, io);
      io.to(code).emit('blackjack:state', sanitizeBjState(state));
    });

    socket.on('blackjack:stand', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'blackjack') return;
      const state = room.gameState as any;
      if (!state || state.currentPlayerSocketId !== socket.id) return;
      stand(state, socket.id);
      checkBlackjackEnd(code, room, state, io);
      io.to(code).emit('blackjack:state', sanitizeBjState(state));
    });

    socket.on('blackjack:double', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'blackjack') return;
      const state = room.gameState as any;
      if (!state || state.currentPlayerSocketId !== socket.id) return;
      doubleDown(state, socket.id);
      checkBlackjackEnd(code, room, state, io);
      io.to(code).emit('blackjack:state', sanitizeBjState(state));
    });

    // ─── Poker ───────────────────────────────────────────────────────────────
    socket.on('poker:start', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'poker' || room.hostId !== socket.id) return;
      const state = room.gameState as any;
      if (!state || state.players.size < 2) return;
      startPokerHand(state);
      broadcastPokerState(code, state, io);
    });

    socket.on('poker:action', ({ action, amount }: { action: 'fold' | 'check' | 'call' | 'raise' | 'allin'; amount?: number }) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'poker') return;
      const state = room.gameState as any;
      if (!state) return;

      pokerAction(state, socket.id, action, amount);

      // Sync balances back to room store
      for (const [sid, p] of state.players.entries()) {
        const roomPlayer = room.players.get(sid);
        if (roomPlayer) roomPlayer.balance = p.balance;
      }

      broadcastPokerState(code, state, io);
    });

    socket.on('poker:next-hand', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'poker' || room.hostId !== socket.id) return;
      const state = room.gameState as any;
      if (state?.phase !== 'showdown') return;

      const playerCount = state.players.size;
      state.dealerIndex = (state.dealerIndex + 1) % playerCount;

      // Sync balances from room store to poker state
      for (const [sid, p] of state.players.entries()) {
        const roomPlayer = room.players.get(sid);
        if (roomPlayer) p.balance = roomPlayer.balance;
      }

      startPokerHand(state);
      broadcastPokerState(code, state, io);
    });

    // ─── Horses ──────────────────────────────────────────────────────────────
    socket.on('horses:bet', ({ horseId, amount }: { horseId: number; amount: number }) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'horses') return;
      const state = room.gameState as any;
      if (!state || state.phase !== 'betting') return;

      const player = room.players.get(socket.id);
      if (!player || player.balance < amount || amount <= 0) return;

      state.bets.push({ playerId: socket.id, horseId, amount });
      updatePlayerBalance(code, socket.id, -amount);
      socket.emit('balance:update', { balance: player.balance });
      io.to(code).emit('horses:state', state);
    });

    // ─── Football ─────────────────────────────────────────────────────────────
    socket.on('football:bet', ({ matchId, betType, amount }: { matchId: string; betType: any; amount: number }) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = getRoom(code);
      if (!room || room.game !== 'football') return;
      const state = room.gameState as any;
      if (!state || state.phase !== 'betting') return;

      const player = room.players.get(socket.id);
      if (!player || player.balance < amount || amount <= 0) return;

      const match = state.matches.find((m: any) => m.id === matchId);
      if (!match) return;

      const oddsMap: Record<string, number> = {
        '1': match.homeOdds, 'X': match.drawOdds, '2': match.awayOdds,
        'over': match.overOdds, 'under': match.underOdds,
        'bttsYes': match.bttsYesOdds, 'bttsNo': match.bttsNoOdds,
      };

      state.bets.push({ playerId: socket.id, matchId, betType, amount, odds: oddsMap[betType] });
      updatePlayerBalance(code, socket.id, -amount);
      socket.emit('balance:update', { balance: player.balance });
      io.to(code).emit('football:state', state);
    });

    // ─── Request current room state (fixes page-load race condition) ──────────
    socket.on('room:request-state', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) { socket.emit('error', { message: 'No estás en ninguna sala' }); return; }
      const room = getRoom(code);
      if (!room) { socket.emit('error', { message: 'Sala no encontrada' }); return; }
      const player = room.players.get(socket.id);
      socket.emit('room:joined', { room: getRoomPublicState(room) });
      if (player) socket.emit('balance:update', { balance: player.balance });
      broadcastGameState(code, room.game, io, socket.id);
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const code = socketToRoom.get(socket.id);
      if (code) {
        const room = getRoom(code);
        if (room) {
          const player = room.players.get(socket.id);
          if (player) {
            io.to(code).emit('chat:message', {
              alias: 'Sistema', message: `${player.alias} salió de la sala`, timestamp: Date.now(),
            });
          }
          if (room.game === 'poker' && room.gameState) {
            removePokerPlayer(room.gameState as any, socket.id);
          }
        }
        removePlayerFromRoom(code, socket.id);
        const updatedRoom = getRoom(code);
        if (updatedRoom) io.to(code).emit('room:update', { room: getRoomPublicState(updatedRoom) });
        socketToRoom.delete(socket.id);
      }
    });
  });
}

// ─── Game Init ────────────────────────────────────────────────────────────────

function initGameState(code: string, game: GameType, io: Server, socket: Socket): void {
  const room = getRoom(code)!;
  const player = room.players.get(socket.id)!;

  switch (game) {
    case 'roulette':
      room.gameState = createRouletteState();
      startRouletteCycle(code, io);
      break;
    case 'blackjack':
      room.gameState = createBlackjackState();
      addBlackjackPlayer(room.gameState as any, socket.id, player.alias, player.balance, 0);
      startBlackjackCycle(code, io);
      break;
    case 'poker':
      room.gameState = createPokerState();
      addPokerPlayer(room.gameState as any, socket.id, player.alias, player.balance);
      break;
    case 'horses':
      room.gameState = createHorsesState();
      startHorsesCycle(code, io);
      break;
    case 'football':
      room.gameState = createFootballState();
      startFootballCycle(code, io);
      break;
  }
}

function broadcastGameState(code: string, game: GameType, io: Server, socketId: string): void {
  const room = getRoom(code);
  if (!room?.gameState) return;
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return;

  switch (game) {
    case 'roulette': socket.emit('roulette:state', sanitizeRouletteState(room.gameState)); break;
    case 'blackjack': socket.emit('blackjack:state', sanitizeBjState(room.gameState)); break;
    case 'poker': socket.emit('poker:state', getPokerPublicState(room.gameState as any, socketId)); break;
    case 'horses': socket.emit('horses:state', room.gameState); break;
    case 'football': socket.emit('football:state', room.gameState); break;
  }
}

// ─── Roulette Cycle ───────────────────────────────────────────────────────────

function startRouletteCycle(code: string, io: Server): void {
  const room = getRoom(code);
  if (!room || room.game !== 'roulette') return;
  const state = room.gameState as any;

  state.phase = 'betting';
  state.bets = [];
  state.winningNumber = null;
  state.bettingTimeLeft = 20;

  io.to(code).emit('roulette:state', sanitizeRouletteState(state));

  const countdown = setInterval(() => {
    if (!getRoom(code)) { clearInterval(countdown); return; }
    state.bettingTimeLeft--;
    io.to(code).emit('roulette:timer', { timeLeft: state.bettingTimeLeft });
    if (state.bettingTimeLeft <= 0) {
      clearInterval(countdown);
      spinRoulette(code, io);
    }
  }, 1000);
}

function spinRoulette(code: string, io: Server): void {
  const room = getRoom(code);
  if (!room) return;
  const state = room.gameState as any;

  state.phase = 'spinning';
  const winning = spin();
  state.winningNumber = winning;
  io.to(code).emit('roulette:spin', { winningNumber: winning });

  setTimeout(() => {
    if (!getRoom(code)) return;
    const winnings = resolveRouletteBets(state.bets, winning);
    for (const [playerId, amount] of winnings.entries()) {
      updatePlayerBalance(code, playerId, amount);
      const player = room.players.get(playerId);
      if (player) {
        io.to(playerId).emit('balance:update', { balance: player.balance });
        io.to(code).emit('chat:message', {
          alias: 'Casino', message: `${player.alias} ganó $${amount.toLocaleString()} en ruleta!`, timestamp: Date.now(),
        });
      }
    }
    state.phase = 'result';
    io.to(code).emit('roulette:result', { winningNumber: winning, winnings: Object.fromEntries(winnings) });

    setTimeout(() => { if (getRoom(code)) startRouletteCycle(code, io); }, 5000);
  }, 7000);
}

// ─── Blackjack Cycle ──────────────────────────────────────────────────────────

function startBlackjackCycle(code: string, io: Server): void {
  const room = getRoom(code);
  if (!room || room.game !== 'blackjack') return;
  const state = room.gameState as any;

  state.bettingTimeLeft = 15;
  io.to(code).emit('blackjack:state', sanitizeBjState(state));

  const countdown = setInterval(() => {
    if (!getRoom(code)) { clearInterval(countdown); return; }
    state.bettingTimeLeft--;
    io.to(code).emit('blackjack:timer', { timeLeft: state.bettingTimeLeft });

    if (state.bettingTimeLeft <= 0) {
      clearInterval(countdown);
      const hasBets = [...state.players.values()].some((p: any) => p.bet > 0);
      if (hasBets) {
        startRound(state);
        io.to(code).emit('blackjack:state', sanitizeBjState(state));
        checkBlackjackEnd(code, room, state, io);
      } else {
        startBlackjackCycle(code, io);
      }
    }
  }, 1000);
}

function checkBlackjackEnd(code: string, room: any, state: any, io: Server): void {
  if (state.phase === 'results') {
    for (const [sid, p] of state.players.entries()) {
      room.players.get(sid) && (room.players.get(sid).balance = p.balance);
      io.to(sid).emit('balance:update', { balance: p.balance });
    }
    io.to(code).emit('blackjack:state', sanitizeBjState(state));
    setTimeout(() => {
      if (!getRoom(code)) return;
      resetBlackjackRound(state);
      io.to(code).emit('blackjack:state', sanitizeBjState(state));
      startBlackjackCycle(code, io);
    }, 5000);
  }
}

// ─── Horses Cycle ─────────────────────────────────────────────────────────────

function startHorsesCycle(code: string, io: Server): void {
  const room = getRoom(code);
  if (!room || room.game !== 'horses') return;
  const state = room.gameState as any;

  resetHorsesState(state);
  io.to(code).emit('horses:state', state);

  const countdown = setInterval(() => {
    if (!getRoom(code)) { clearInterval(countdown); return; }
    state.bettingTimeLeft--;
    io.to(code).emit('horses:timer', { timeLeft: state.bettingTimeLeft });
    if (state.bettingTimeLeft <= 0) {
      clearInterval(countdown);
      runHorseRace(code, io);
    }
  }, 1000);
}

function runHorseRace(code: string, io: Server): void {
  const room = getRoom(code);
  if (!room) return;
  const state = room.gameState as any;

  state.phase = 'racing';
  const { frames, winnerId } = simulateRace(state);
  state.winnerId = winnerId;

  let frame = 0;
  const raceInterval = setInterval(() => {
    if (!getRoom(code) || frame >= frames.length) {
      clearInterval(raceInterval);
      finishHorseRace(code, io, state, winnerId);
      return;
    }
    io.to(code).emit('horses:frame', { positions: frames[frame], winnerId: frame === frames.length - 1 ? winnerId : null });
    frame++;
  }, 100);
}

function finishHorseRace(code: string, io: Server, state: any, winnerId: number): void {
  const room = getRoom(code);
  if (!room) return;

  state.phase = 'result';
  const winnings = resolveHorsesBets(state.bets, winnerId, state.horses);
  const winner = state.horses.find((h: any) => h.id === winnerId);

  for (const [playerId, amount] of winnings.entries()) {
    updatePlayerBalance(code, playerId, amount);
    const player = room.players.get(playerId);
    if (player) {
      io.to(playerId).emit('balance:update', { balance: player.balance });
    }
  }

  io.to(code).emit('horses:result', { winnerId, winnerName: winner?.name, winnings: Object.fromEntries(winnings) });
  setTimeout(() => { if (getRoom(code)) startHorsesCycle(code, io); }, 7000);
}

// ─── Football Cycle ───────────────────────────────────────────────────────────

function startFootballCycle(code: string, io: Server): void {
  const room = getRoom(code);
  if (!room || room.game !== 'football') return;
  const state = room.gameState as any;

  state.bettingTimeLeft = 25;
  io.to(code).emit('football:state', state);

  const countdown = setInterval(() => {
    if (!getRoom(code)) { clearInterval(countdown); return; }
    state.bettingTimeLeft--;
    io.to(code).emit('football:timer', { timeLeft: state.bettingTimeLeft });
    if (state.bettingTimeLeft <= 0) {
      clearInterval(countdown);
      playFootballMatches(code, io);
    }
  }, 1000);
}

function playFootballMatches(code: string, io: Server): void {
  const room = getRoom(code);
  if (!room) return;
  const state = room.gameState as any;

  state.phase = 'live';
  io.to(code).emit('football:state', state);

  let matchIndex = 0;
  const simulateNext = () => {
    if (!getRoom(code) || matchIndex >= state.matches.length) {
      finishFootball(code, io, state);
      return;
    }
    const match = state.matches[matchIndex];
    const events = simulateMatch(match);

    let eventIndex = 0;
    const eventInterval = setInterval(() => {
      if (eventIndex < events.length) {
        const ev = events[eventIndex];
        io.to(code).emit('football:event', { matchId: match.id, event: ev, homeScore: match.homeScore, awayScore: match.awayScore });
        eventIndex++;
      } else {
        clearInterval(eventInterval);
        io.to(code).emit('football:match-finished', { match });
        matchIndex++;
        setTimeout(simulateNext, 1500);
      }
    }, 800);
  };

  simulateNext();
}

function finishFootball(code: string, io: Server, state: any): void {
  const room = getRoom(code);
  if (!room) return;

  state.phase = 'result';
  const winnings = resolveFootballBets(state.bets, state.matches);

  for (const [playerId, amount] of winnings.entries()) {
    updatePlayerBalance(code, playerId, amount);
    const player = room.players.get(playerId);
    if (player) {
      io.to(playerId).emit('balance:update', { balance: player.balance });
    }
  }

  io.to(code).emit('football:results', { matches: state.matches, winnings: Object.fromEntries(winnings) });
  setTimeout(() => {
    if (!getRoom(code)) return;
    resetFootballState(state);
    startFootballCycle(code, io);
  }, 10000);
}

// ─── Poker broadcast ─────────────────────────────────────────────────────────

function broadcastPokerState(code: string, state: any, io: Server): void {
  const room = getRoom(code);
  if (!room) return;
  for (const socketId of room.players.keys()) {
    const s = io.sockets.sockets.get(socketId);
    if (s) s.emit('poker:state', getPokerPublicState(state, socketId));
  }
}

// ─── Sanitizers ──────────────────────────────────────────────────────────────

function sanitizeRouletteState(state: any) {
  return { phase: state.phase, winningNumber: state.winningNumber, bets: state.bets, bettingTimeLeft: state.bettingTimeLeft };
}

function sanitizeBjState(state: any) {
  return {
    phase: state.phase,
    bettingTimeLeft: state.bettingTimeLeft,
    dealerHand: state.dealerHand,
    currentPlayerSocketId: state.currentPlayerSocketId,
    players: [...state.players.values()].map((p: any) => ({
      socketId: p.socketId, alias: p.alias, balance: p.balance,
      hand: p.hand, bet: p.bet, status: p.status, seatIndex: p.seatIndex,
    })),
  };
}
