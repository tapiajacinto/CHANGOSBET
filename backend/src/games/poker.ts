import { PokerState, PokerPlayer, PokerPhase, SidePot, Card } from '../types';
import { createDeck, dealCard } from './deck';

// ─── Hand Evaluator ───────────────────────────────────────────────────────────

interface HandResult {
  rank: number;
  name: string;
  tiebreakers: number[];
}

function combos(indices: number[], k: number): number[][] {
  if (k === 0) return [[]];
  if (indices.length < k) return [];
  const [first, ...rest] = indices;
  return [
    ...combos(rest, k - 1).map(c => [first, ...c]),
    ...combos(rest, k),
  ];
}

function evaluate5(cards: Card[]): HandResult {
  const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = new Set(ranks).size === 5 && ranks[0] - ranks[4] === 4;
  const isWheel = ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2;

  const freq: Record<number, number> = {};
  for (const r of ranks) freq[r] = (freq[r] ?? 0) + 1;
  const groups = Object.entries(freq)
    .map(([r, c]) => ({ r: Number(r), c }))
    .sort((a, b) => b.c - a.c || b.r - a.r);
  const sorted = groups.map(g => g.r);
  const counts = groups.map(g => g.c);

  if (isFlush && (isStraight || isWheel)) {
    const high = isWheel ? 5 : ranks[0];
    return { rank: high === 14 ? 9 : 8, name: high === 14 ? 'Royal Flush' : 'Straight Flush', tiebreakers: [high] };
  }
  if (counts[0] === 4) return { rank: 7, name: 'Four of a Kind', tiebreakers: sorted };
  if (counts[0] === 3 && counts[1] === 2) return { rank: 6, name: 'Full House', tiebreakers: sorted };
  if (isFlush) return { rank: 5, name: 'Flush', tiebreakers: ranks };
  if (isStraight || isWheel) {
    const high = isWheel ? 5 : ranks[0];
    return { rank: 4, name: 'Straight', tiebreakers: [high] };
  }
  if (counts[0] === 3) return { rank: 3, name: 'Three of a Kind', tiebreakers: sorted };
  if (counts[0] === 2 && counts[1] === 2) return { rank: 2, name: 'Two Pair', tiebreakers: sorted };
  if (counts[0] === 2) return { rank: 1, name: 'One Pair', tiebreakers: sorted };
  return { rank: 0, name: 'High Card', tiebreakers: ranks };
}

function compareHands(a: HandResult, b: HandResult): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.min(a.tiebreakers.length, b.tiebreakers.length); i++) {
    if (a.tiebreakers[i] !== b.tiebreakers[i]) return a.tiebreakers[i] - b.tiebreakers[i];
  }
  return 0;
}

export function bestHand(cards: Card[]): HandResult {
  const indices = cards.map((_, i) => i);
  const fiveCombos = combos(indices, 5);
  let best: HandResult | null = null;
  for (const combo of fiveCombos) {
    const h = evaluate5(combo.map(i => cards[i]));
    if (!best || compareHands(h, best) > 0) best = h;
  }
  return best!;
}

// ─── Game Logic ───────────────────────────────────────────────────────────────

export function createPokerState(smallBlind = 100): PokerState {
  return {
    phase: 'waiting',
    deck: createDeck(),
    communityCards: [],
    pot: 0,
    sidePots: [],
    currentBet: 0,
    minRaise: smallBlind * 2,
    currentPlayerSocketId: null,
    dealerIndex: 0,
    smallBlindAmount: smallBlind,
    bigBlindAmount: smallBlind * 2,
    players: new Map(),
    actionsThisRound: 0,
    lastRaiserSocketId: null,
    winners: [],
  };
}

export function addPokerPlayer(state: PokerState, socketId: string, alias: string, balance: number): void {
  const seatIndex = state.players.size;
  state.players.set(socketId, {
    socketId, alias, balance,
    holeCards: [], bet: 0, totalBetThisHand: 0,
    folded: false, allIn: false, seatIndex,
    isActive: true, lastAction: null,
  });
}

export function removePokerPlayer(state: PokerState, socketId: string): void {
  state.players.delete(socketId);
}

export function startPokerHand(state: PokerState): void {
  const players = activePlayers(state);
  if (players.length < 2) return;

  state.deck = createDeck();
  state.communityCards = [];
  state.pot = 0;
  state.sidePots = [];
  state.currentBet = state.bigBlindAmount;
  state.minRaise = state.bigBlindAmount;
  state.actionsThisRound = 0;
  state.lastRaiserSocketId = null;
  state.winners = [];

  for (const p of state.players.values()) {
    p.holeCards = [];
    p.bet = 0;
    p.totalBetThisHand = 0;
    p.folded = false;
    p.allIn = false;
    p.lastAction = null;
  }

  // Deal 2 hole cards each
  let deck = state.deck;
  for (const p of players) {
    const [c1, d1] = dealCard(deck);
    deck = d1;
    const [c2, d2] = dealCard(deck);
    deck = d2;
    p.holeCards = [c1, c2];
  }
  state.deck = deck;

  // Post blinds
  const sbIndex = (state.dealerIndex + 1) % players.length;
  const bbIndex = (state.dealerIndex + 2) % players.length;
  postBlind(state, players[sbIndex], state.smallBlindAmount);
  postBlind(state, players[bbIndex], state.bigBlindAmount);

  // Pre-flop: action starts left of big blind
  const utg = players[(bbIndex + 1) % players.length];
  state.currentPlayerSocketId = utg.socketId;
  state.phase = 'pre-flop';
}

function postBlind(state: PokerState, player: PokerPlayer, amount: number): void {
  const actual = Math.min(amount, player.balance);
  player.balance -= actual;
  player.bet = actual;
  player.totalBetThisHand = actual;
  state.pot += actual;
  if (player.balance === 0) player.allIn = true;
}

export function pokerAction(
  state: PokerState,
  socketId: string,
  action: 'fold' | 'check' | 'call' | 'raise' | 'allin',
  raiseAmount?: number
): boolean {
  const player = state.players.get(socketId);
  if (!player || state.currentPlayerSocketId !== socketId) return false;
  if (player.folded || player.allIn) return false;

  player.lastAction = action;

  switch (action) {
    case 'fold':
      player.folded = true;
      break;

    case 'check':
      if (state.currentBet > player.bet) return false;
      break;

    case 'call': {
      const toCall = Math.min(state.currentBet - player.bet, player.balance);
      player.balance -= toCall;
      player.bet += toCall;
      player.totalBetThisHand += toCall;
      state.pot += toCall;
      if (player.balance === 0) player.allIn = true;
      break;
    }

    case 'raise': {
      if (!raiseAmount || raiseAmount < state.minRaise) return false;
      const toRaise = Math.min(raiseAmount, player.balance);
      const extra = toRaise - (state.currentBet - player.bet);
      player.balance -= toRaise;
      player.bet += toRaise;
      player.totalBetThisHand += toRaise;
      state.pot += toRaise;
      state.currentBet = player.bet;
      state.minRaise = Math.max(state.minRaise, extra);
      state.lastRaiserSocketId = socketId;
      state.actionsThisRound = 0;
      if (player.balance === 0) player.allIn = true;
      break;
    }

    case 'allin': {
      const allInAmount = player.balance;
      player.balance = 0;
      player.bet += allInAmount;
      player.totalBetThisHand += allInAmount;
      state.pot += allInAmount;
      if (player.bet > state.currentBet) {
        state.currentBet = player.bet;
        state.lastRaiserSocketId = socketId;
        state.actionsThisRound = 0;
      }
      player.allIn = true;
      break;
    }
  }

  state.actionsThisRound++;
  advancePoker(state);
  return true;
}

function activePlayers(state: PokerState): PokerPlayer[] {
  return [...state.players.values()]
    .filter(p => p.isActive)
    .sort((a, b) => a.seatIndex - b.seatIndex);
}

function playersInHand(state: PokerState): PokerPlayer[] {
  return activePlayers(state).filter(p => !p.folded);
}

function advancePoker(state: PokerState): void {
  const inHand = playersInHand(state);

  if (inHand.length === 1) {
    endHand(state);
    return;
  }

  const canAct = inHand.filter(p => !p.allIn);
  const allCalled = canAct.every(p => p.bet === state.currentBet);
  const enoughActions = state.actionsThisRound >= canAct.length;

  if (allCalled && enoughActions) {
    nextPhase(state);
    return;
  }

  // Find next player
  const ordered = activePlayers(state);
  const currentIdx = ordered.findIndex(p => p.socketId === state.currentPlayerSocketId);
  let nextIdx = (currentIdx + 1) % ordered.length;
  let iterations = 0;

  while (iterations < ordered.length) {
    const next = ordered[nextIdx];
    if (!next.folded && !next.allIn) {
      state.currentPlayerSocketId = next.socketId;
      return;
    }
    nextIdx = (nextIdx + 1) % ordered.length;
    iterations++;
  }

  nextPhase(state);
}

function nextPhase(state: PokerState): void {
  // Reset bets for next round
  for (const p of state.players.values()) {
    p.bet = 0;
  }
  state.currentBet = 0;
  state.actionsThisRound = 0;
  state.lastRaiserSocketId = null;

  const phaseOrder: PokerPhase[] = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
  const idx = phaseOrder.indexOf(state.phase);
  state.phase = phaseOrder[Math.min(idx + 1, phaseOrder.length - 1)];

  if (state.phase === 'flop') {
    let deck = state.deck;
    for (let i = 0; i < 3; i++) {
      const [c, d] = dealCard(deck);
      deck = d;
      state.communityCards.push(c);
    }
    state.deck = deck;
  } else if (state.phase === 'turn' || state.phase === 'river') {
    const [c, d] = dealCard(state.deck);
    state.deck = d;
    state.communityCards.push(c);
  } else if (state.phase === 'showdown') {
    endHand(state);
    return;
  }

  // Set first active player left of dealer
  const ordered = activePlayers(state).filter(p => !p.folded && !p.allIn);
  state.currentPlayerSocketId = ordered.length > 0 ? ordered[0].socketId : null;
  if (ordered.length === 0) endHand(state);
}

export function endHand(state: PokerState): void {
  state.phase = 'showdown';
  state.currentPlayerSocketId = null;

  const inHand = playersInHand(state);

  if (inHand.length === 1) {
    const winner = inHand[0];
    winner.balance += state.pot;
    state.winners = [{ socketId: winner.socketId, alias: winner.alias, amount: state.pot, handName: 'Last standing' }];
    return;
  }

  // Evaluate hands
  const ranked = inHand.map(p => ({
    player: p,
    hand: bestHand([...p.holeCards, ...state.communityCards]),
  })).sort((a, b) => compareHands(b.hand, a.hand));

  // Distribute pot (simplified: winner takes all for now)
  const best = ranked[0].hand;
  const winners = ranked.filter(r => compareHands(r.hand, best) === 0);
  const share = Math.floor(state.pot / winners.length);

  state.winners = winners.map(w => {
    w.player.balance += share;
    return { socketId: w.player.socketId, alias: w.player.alias, amount: share, handName: w.hand.name };
  });
}

export function getPokerPublicState(state: PokerState, viewerSocketId?: string) {
  const players = [...state.players.values()].map(p => ({
    socketId: p.socketId,
    alias: p.alias,
    balance: p.balance,
    bet: p.bet,
    folded: p.folded,
    allIn: p.allIn,
    seatIndex: p.seatIndex,
    lastAction: p.lastAction,
    holeCards: viewerSocketId === p.socketId || state.phase === 'showdown'
      ? p.holeCards
      : p.holeCards.map(() => ({ rank: 0, suit: 'back', faceUp: false })),
    handSize: p.holeCards.length,
  }));

  return {
    phase: state.phase,
    communityCards: state.communityCards,
    pot: state.pot,
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    bigBlindAmount: state.bigBlindAmount,
    currentPlayerSocketId: state.currentPlayerSocketId,
    winners: state.winners,
    players,
  };
}
