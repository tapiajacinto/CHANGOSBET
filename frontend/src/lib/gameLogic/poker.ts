import type { PokerState, PokerPlayer, PokerPhase, Card } from '@/types';
import { createDeck, dealCard } from './deck';

// ─── Hand Evaluator ───────────────────────────────────────────────────────────

interface HandResult { rank: number; name: string; tiebreakers: number[]; }

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
  const groups = Object.entries(freq).map(([r, c]) => ({ r: Number(r), c })).sort((a, b) => b.c - a.c || b.r - a.r);
  const sorted = groups.map(g => g.r);
  const counts = groups.map(g => g.c);
  if (isFlush && (isStraight || isWheel)) {
    const high = isWheel ? 5 : ranks[0];
    return { rank: high === 14 ? 9 : 8, name: high === 14 ? 'Royal Flush' : 'Straight Flush', tiebreakers: [high] };
  }
  if (counts[0] === 4) return { rank: 7, name: 'Four of a Kind', tiebreakers: sorted };
  if (counts[0] === 3 && counts[1] === 2) return { rank: 6, name: 'Full House', tiebreakers: sorted };
  if (isFlush) return { rank: 5, name: 'Flush', tiebreakers: ranks };
  if (isStraight || isWheel) return { rank: 4, name: 'Straight', tiebreakers: [isWheel ? 5 : ranks[0]] };
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

// ─── Internal state (with hole cards) ────────────────────────────────────────

export interface PokerInternalPlayer extends PokerPlayer {
  isActive: boolean;
  totalBetThisHand: number;
  lastAction: string | null;
  holeCardsFull: Card[]; // actual cards, not hidden
}

export interface PokerInternalState {
  phase: PokerPhase;
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  minRaise: number;
  currentPlayerSocketId: string | null;
  dealerIndex: number;
  smallBlindAmount: number;
  bigBlindAmount: number;
  actionsThisRound: number;
  lastRaiserSocketId: string | null;
  winners: { socketId: string; alias: string; amount: number; handName: string }[];
  players: PokerInternalPlayer[];
}

export function createPokerState(smallBlind = 100): PokerInternalState {
  return {
    phase: 'waiting',
    deck: createDeck(),
    communityCards: [],
    pot: 0,
    currentBet: 0,
    minRaise: smallBlind * 2,
    currentPlayerSocketId: null,
    dealerIndex: 0,
    smallBlindAmount: smallBlind,
    bigBlindAmount: smallBlind * 2,
    actionsThisRound: 0,
    lastRaiserSocketId: null,
    winners: [],
    players: [],
  };
}

export function addPokerPlayer(state: PokerInternalState, socketId: string, alias: string, balance: number): void {
  if (state.players.some(p => p.socketId === socketId)) return;
  const seatIndex = state.players.length;
  state.players.push({
    socketId, alias, balance,
    holeCards: [], holeCardsFull: [],
    bet: 0, totalBetThisHand: 0,
    folded: false, allIn: false, seatIndex,
    isActive: true, lastAction: null, handSize: 0,
  });
}

export function startPokerHand(state: PokerInternalState): void {
  const players = activePlayers(state);
  if (players.length < 2) return;

  state.deck = createDeck();
  state.communityCards = [];
  state.pot = 0;
  state.currentBet = state.bigBlindAmount;
  state.minRaise = state.bigBlindAmount;
  state.actionsThisRound = 0;
  state.lastRaiserSocketId = null;
  state.winners = [];

  for (const p of state.players) {
    p.holeCards = []; p.holeCardsFull = [];
    p.bet = 0; p.totalBetThisHand = 0;
    p.folded = false; p.allIn = false; p.lastAction = null; p.handSize = 0;
  }

  let deck = state.deck;
  for (const p of players) {
    const [c1, d1] = dealCard(deck); deck = d1;
    const [c2, d2] = dealCard(deck); deck = d2;
    p.holeCardsFull = [c1, c2];
    p.holeCards = [c1, c2]; // visible to the player
    p.handSize = 2;
  }
  state.deck = deck;

  const sbIdx = (state.dealerIndex + 1) % players.length;
  const bbIdx = (state.dealerIndex + 2) % players.length;
  postBlind(state, players[sbIdx], state.smallBlindAmount);
  postBlind(state, players[bbIdx], state.bigBlindAmount);

  const utg = players[(bbIdx + 1) % players.length];
  state.currentPlayerSocketId = utg.socketId;
  state.phase = 'pre-flop';
}

function postBlind(state: PokerInternalState, player: PokerInternalPlayer, amount: number): void {
  const actual = Math.min(amount, player.balance);
  player.balance -= actual; player.bet = actual; player.totalBetThisHand = actual;
  state.pot += actual;
  if (player.balance === 0) player.allIn = true;
}

export function pokerAction(
  state: PokerInternalState,
  socketId: string,
  action: 'fold' | 'check' | 'call' | 'raise' | 'allin',
  raiseAmount?: number
): boolean {
  const player = state.players.find(p => p.socketId === socketId);
  if (!player || state.currentPlayerSocketId !== socketId || player.folded || player.allIn) return false;

  player.lastAction = action;

  switch (action) {
    case 'fold': player.folded = true; break;
    case 'check': if (state.currentBet > player.bet) return false; break;
    case 'call': {
      const toCall = Math.min(state.currentBet - player.bet, player.balance);
      player.balance -= toCall; player.bet += toCall; player.totalBetThisHand += toCall; state.pot += toCall;
      if (player.balance === 0) player.allIn = true;
      break;
    }
    case 'raise': {
      if (!raiseAmount || raiseAmount < state.minRaise) return false;
      const toRaise = Math.min(raiseAmount, player.balance);
      const extra = toRaise - (state.currentBet - player.bet);
      player.balance -= toRaise; player.bet += toRaise; player.totalBetThisHand += toRaise; state.pot += toRaise;
      state.currentBet = player.bet; state.minRaise = Math.max(state.minRaise, extra);
      state.lastRaiserSocketId = socketId; state.actionsThisRound = 0;
      if (player.balance === 0) player.allIn = true;
      break;
    }
    case 'allin': {
      const all = player.balance;
      player.balance = 0; player.bet += all; player.totalBetThisHand += all; state.pot += all;
      if (player.bet > state.currentBet) {
        state.currentBet = player.bet; state.lastRaiserSocketId = socketId; state.actionsThisRound = 0;
      }
      player.allIn = true;
      break;
    }
  }
  state.actionsThisRound++;
  advancePoker(state);
  return true;
}

function activePlayers(state: PokerInternalState): PokerInternalPlayer[] {
  return state.players.filter(p => p.isActive).sort((a, b) => a.seatIndex - b.seatIndex);
}

function playersInHand(state: PokerInternalState): PokerInternalPlayer[] {
  return activePlayers(state).filter(p => !p.folded);
}

function advancePoker(state: PokerInternalState): void {
  const inHand = playersInHand(state);
  if (inHand.length === 1) { endPokerHand(state); return; }
  const canAct = inHand.filter(p => !p.allIn);
  if (canAct.every(p => p.bet === state.currentBet) && state.actionsThisRound >= canAct.length) {
    nextPokerPhase(state); return;
  }
  const ordered = activePlayers(state);
  const ci = ordered.findIndex(p => p.socketId === state.currentPlayerSocketId);
  let ni = (ci + 1) % ordered.length;
  for (let i = 0; i < ordered.length; i++) {
    const next = ordered[ni];
    if (!next.folded && !next.allIn) { state.currentPlayerSocketId = next.socketId; return; }
    ni = (ni + 1) % ordered.length;
  }
  nextPokerPhase(state);
}

function nextPokerPhase(state: PokerInternalState): void {
  for (const p of state.players) p.bet = 0;
  state.currentBet = 0; state.actionsThisRound = 0; state.lastRaiserSocketId = null;

  const order: PokerPhase[] = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
  const idx = order.indexOf(state.phase);
  state.phase = order[Math.min(idx + 1, order.length - 1)];

  let deck = state.deck;
  if (state.phase === 'flop') {
    for (let i = 0; i < 3; i++) { const [c, d] = dealCard(deck); deck = d; state.communityCards.push(c); }
    state.deck = deck;
  } else if (state.phase === 'turn' || state.phase === 'river') {
    const [c, d] = dealCard(state.deck); state.deck = d; state.communityCards.push(c);
  } else if (state.phase === 'showdown') {
    endPokerHand(state); return;
  }

  const first = activePlayers(state).filter(p => !p.folded && !p.allIn)[0];
  state.currentPlayerSocketId = first?.socketId ?? null;
  if (!first) endPokerHand(state);
}

export function endPokerHand(state: PokerInternalState): void {
  state.phase = 'showdown';
  state.currentPlayerSocketId = null;
  const inHand = playersInHand(state);
  if (inHand.length === 1) {
    const w = inHand[0];
    w.balance += state.pot;
    state.winners = [{ socketId: w.socketId, alias: w.alias, amount: state.pot, handName: 'Último en pie' }];
    return;
  }
  const ranked = inHand.map(p => ({
    player: p,
    hand: bestHand([...p.holeCardsFull, ...state.communityCards]),
  })).sort((a, b) => compareHands(b.hand, a.hand));

  const best = ranked[0].hand;
  const winners = ranked.filter(r => compareHands(r.hand, best) === 0);
  const share = Math.floor(state.pot / winners.length);
  state.winners = winners.map(w => {
    w.player.balance += share;
    return { socketId: w.player.socketId, alias: w.player.alias, amount: share, handName: w.hand.name };
  });
}

export function serializePokerState(state: PokerInternalState, viewerSocketId?: string): PokerState {
  const players: PokerPlayer[] = state.players.map(p => ({
    socketId: p.socketId,
    alias: p.alias,
    balance: p.balance,
    bet: p.bet,
    folded: p.folded,
    allIn: p.allIn,
    seatIndex: p.seatIndex,
    lastAction: p.lastAction,
    handSize: p.holeCardsFull.length,
    holeCards: viewerSocketId === p.socketId || state.phase === 'showdown'
      ? p.holeCardsFull
      : p.holeCardsFull.map(() => ({ rank: 0 as const, suit: 'back' as const, faceUp: false })),
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
