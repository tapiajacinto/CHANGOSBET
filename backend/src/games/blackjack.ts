import { BlackjackState, BlackjackPlayer } from '../types';
import { createDeck, dealCard, handValue } from './deck';

export function createBlackjackState(): BlackjackState {
  return {
    phase: 'betting',
    deck: createDeck(6),
    dealerHand: [],
    players: new Map(),
    currentPlayerSocketId: null,
    bettingTimeLeft: 15,
  };
}

export function addBlackjackPlayer(
  state: BlackjackState,
  socketId: string,
  alias: string,
  balance: number,
  seatIndex: number
): void {
  state.players.set(socketId, {
    socketId,
    alias,
    balance,
    hand: [],
    bet: 0,
    status: 'betting',
    seatIndex,
  });
}

export function placeBet(state: BlackjackState, socketId: string, amount: number): boolean {
  const player = state.players.get(socketId);
  if (!player || player.status !== 'betting' || amount <= 0 || amount > player.balance) return false;
  player.bet = amount;
  player.status = 'waiting';
  return true;
}

export function startRound(state: BlackjackState): void {
  if (state.deck.length < 20) state.deck = createDeck(6);

  state.dealerHand = [];
  let deck = state.deck;

  for (const player of state.players.values()) {
    if (player.bet === 0) {
      player.status = 'done';
      continue;
    }
    player.hand = [];
    player.balance -= player.bet;

    const [c1, d1] = dealCard(deck, true);
    deck = d1;
    const [c2, d2] = dealCard(deck, true);
    deck = d2;
    player.hand = [c1, c2];

    if (handValue([c1, c2]) === 21) {
      player.status = 'blackjack';
    } else {
      player.status = 'playing';
    }
  }

  const [dc1, dd1] = dealCard(deck, true);
  deck = dd1;
  const [dc2, dd2] = dealCard(deck, false);
  deck = dd2;
  state.dealerHand = [dc1, dc2];
  state.deck = deck;
  state.phase = 'playing';

  state.currentPlayerSocketId = findNextActivePlayer(state, null);
}

export function hit(state: BlackjackState, socketId: string): boolean {
  const player = state.players.get(socketId);
  if (!player || player.status !== 'playing') return false;

  const [card, deck] = dealCard(state.deck, true);
  state.deck = deck;
  player.hand.push(card);

  const value = handValue(player.hand);
  if (value > 21) {
    player.status = 'bust';
    advance(state);
  } else if (value === 21) {
    player.status = 'standing';
    advance(state);
  }
  return true;
}

export function stand(state: BlackjackState, socketId: string): boolean {
  const player = state.players.get(socketId);
  if (!player || player.status !== 'playing') return false;
  player.status = 'standing';
  advance(state);
  return true;
}

export function doubleDown(state: BlackjackState, socketId: string): boolean {
  const player = state.players.get(socketId);
  if (!player || player.status !== 'playing' || player.hand.length !== 2) return false;
  if (player.balance < player.bet) return false;

  player.balance -= player.bet;
  player.bet *= 2;

  const [card, deck] = dealCard(state.deck, true);
  state.deck = deck;
  player.hand.push(card);

  if (handValue(player.hand) > 21) {
    player.status = 'bust';
  } else {
    player.status = 'standing';
  }
  advance(state);
  return true;
}

function advance(state: BlackjackState): void {
  const next = findNextActivePlayer(state, state.currentPlayerSocketId);
  if (next) {
    state.currentPlayerSocketId = next;
  } else {
    state.currentPlayerSocketId = null;
    dealerPlay(state);
  }
}

function findNextActivePlayer(state: BlackjackState, afterId: string | null): string | null {
  const ordered = [...state.players.values()].sort((a, b) => a.seatIndex - b.seatIndex);
  let found = afterId === null;
  for (const p of ordered) {
    if (found && p.status === 'playing') return p.socketId;
    if (p.socketId === afterId) found = true;
  }
  return null;
}

export function dealerPlay(state: BlackjackState): Map<string, number> {
  // Reveal hole card
  if (state.dealerHand[1]) state.dealerHand[1].faceUp = true;

  while (handValue(state.dealerHand) < 17) {
    const [card, deck] = dealCard(state.deck, true);
    state.deck = deck;
    state.dealerHand.push(card);
  }

  const dealerVal = handValue(state.dealerHand);
  const payouts = new Map<string, number>();

  for (const player of state.players.values()) {
    if (player.status === 'bust' || player.status === 'done') {
      player.status = 'done';
      continue;
    }
    if (player.status === 'blackjack') {
      const win = Math.floor(player.bet * 2.5);
      player.balance += win;
      payouts.set(player.socketId, win);
      player.status = 'done';
      continue;
    }

    const playerVal = handValue(player.hand);
    if (dealerVal > 21 || playerVal > dealerVal) {
      const win = player.bet * 2;
      player.balance += win;
      payouts.set(player.socketId, win);
    } else if (playerVal === dealerVal) {
      player.balance += player.bet;
      payouts.set(player.socketId, player.bet);
    }
    player.status = 'done';
  }

  state.phase = 'results';
  return payouts;
}

export function resetBlackjackRound(state: BlackjackState): void {
  state.phase = 'betting';
  state.dealerHand = [];
  state.currentPlayerSocketId = null;
  state.bettingTimeLeft = 15;
  for (const player of state.players.values()) {
    player.hand = [];
    player.bet = 0;
    player.status = 'betting';
  }
}
