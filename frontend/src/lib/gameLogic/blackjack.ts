import type { BlackjackState, BJPlayer, Card } from '@/types';
import { createDeck, dealCard, handValue } from './deck';

type BJInternal = BlackjackState & { deck: Card[]; lastPayouts?: Map<string, number> };

export function createBJState(): BJInternal {
  return {
    phase: 'betting',
    deck: createDeck(6),
    dealerHand: [],
    players: [],
    currentPlayerSocketId: null,
    bettingTimeLeft: 15,
    lastPayouts: new Map(),
  };
}

export function addBJPlayer(
  state: BJInternal,
  socketId: string,
  alias: string,
  balance: number,
  seatIndex: number
): void {
  if (state.players.some(p => p.socketId === socketId)) return;
  state.players.push({ socketId, alias, balance, hand: [], bet: 0, status: 'betting', seatIndex });
}

export function placeBJBet(state: BJInternal, socketId: string, amount: number): boolean {
  const player = state.players.find(p => p.socketId === socketId);
  if (!player || player.status !== 'betting' || amount <= 0 || amount > player.balance) return false;
  player.bet = amount;
  player.status = 'waiting';
  return true;
}

export function startBJRound(state: BJInternal): void {
  if (state.deck.length < 20) state.deck = createDeck(6);

  state.dealerHand = [];
  let deck = state.deck;

  for (const player of state.players) {
    if (player.bet === 0) { player.status = 'done'; continue; }
    player.hand = [];
    player.balance -= player.bet;
    const [c1, d1] = dealCard(deck, true); deck = d1;
    const [c2, d2] = dealCard(deck, true); deck = d2;
    player.hand = [c1, c2];
    player.status = handValue([c1, c2]) === 21 ? 'blackjack' : 'playing';
  }

  const [dc1, dd1] = dealCard(deck, true); deck = dd1;
  const [dc2, dd2] = dealCard(deck, false); deck = dd2;
  state.dealerHand = [dc1, dc2];
  state.deck = deck;
  state.phase = 'playing';
  state.currentPlayerSocketId = findNextBJPlayer(state, null);
  if (!state.currentPlayerSocketId) dealerPlayBJ(state);
}

export function hitBJ(state: BJInternal, socketId: string): boolean {
  const player = state.players.find(p => p.socketId === socketId);
  if (!player || player.status !== 'playing') return false;
  const [card, deck] = dealCard(state.deck, true);
  state.deck = deck;
  player.hand.push(card);
  const val = handValue(player.hand);
  if (val > 21) { player.status = 'bust'; advanceBJ(state); }
  else if (val === 21) { player.status = 'standing'; advanceBJ(state); }
  return true;
}

export function standBJ(state: BJInternal, socketId: string): boolean {
  const player = state.players.find(p => p.socketId === socketId);
  if (!player || player.status !== 'playing') return false;
  player.status = 'standing';
  advanceBJ(state);
  return true;
}

export function doubleDownBJ(state: BJInternal, socketId: string): boolean {
  const player = state.players.find(p => p.socketId === socketId);
  if (!player || player.status !== 'playing' || player.hand.length !== 2 || player.balance < player.bet) return false;
  player.balance -= player.bet;
  player.bet *= 2;
  const [card, deck] = dealCard(state.deck, true);
  state.deck = deck;
  player.hand.push(card);
  player.status = handValue(player.hand) > 21 ? 'bust' : 'standing';
  advanceBJ(state);
  return true;
}

function advanceBJ(state: BJInternal): void {
  const next = findNextBJPlayer(state, state.currentPlayerSocketId);
  if (next) { state.currentPlayerSocketId = next; }
  else { state.currentPlayerSocketId = null; dealerPlayBJ(state); }
}

function findNextBJPlayer(state: BJInternal, afterId: string | null): string | null {
  const ordered = [...state.players].sort((a, b) => a.seatIndex - b.seatIndex);
  let found = afterId === null;
  for (const p of ordered) {
    if (found && p.status === 'playing') return p.socketId;
    if (p.socketId === afterId) found = true;
  }
  return null;
}

export function dealerPlayBJ(state: BJInternal): Map<string, number> {
  if (state.dealerHand[1]) state.dealerHand[1].faceUp = true;
  while (handValue(state.dealerHand) < 17) {
    const [card, deck] = dealCard(state.deck, true);
    state.deck = deck;
    state.dealerHand.push(card);
  }
  const dealerVal = handValue(state.dealerHand);
  const payouts = new Map<string, number>();

  for (const player of state.players) {
    if (player.status === 'bust' || player.status === 'done') { player.status = 'done'; continue; }
    if (player.status === 'blackjack') {
      const win = Math.floor(player.bet * 2.5);
      player.balance += win;
      payouts.set(player.socketId, win);
      player.status = 'done';
      continue;
    }
    const pv = handValue(player.hand);
    if (dealerVal > 21 || pv > dealerVal) {
      const win = player.bet * 2;
      player.balance += win;
      payouts.set(player.socketId, win);
    } else if (pv === dealerVal) {
      player.balance += player.bet;
      payouts.set(player.socketId, player.bet);
    }
    player.status = 'done';
  }
  state.lastPayouts = payouts;   // payouts BRUTOS por socketId (para settle_game_round)
  state.phase = 'results';
  return payouts;
}

export function resetBJRound(state: BJInternal): void {
  state.phase = 'betting';
  state.dealerHand = [];
  state.currentPlayerSocketId = null;
  state.bettingTimeLeft = 15;
  for (const p of state.players) { p.hand = []; p.bet = 0; p.status = 'betting'; }
}

export function serializeBJState(state: BJInternal): BlackjackState {
  const { deck: _deck, lastPayouts: _lp, ...rest } = state;
  return rest;
}
