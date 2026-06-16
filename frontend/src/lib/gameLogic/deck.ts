import type { Card, Rank, Suit } from '@/types';

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function createDeck(decks = 1): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit, faceUp: true });
      }
    }
  }
  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealCard(deck: Card[], faceUp = true): [Card, Card[]] {
  const card = { ...deck[deck.length - 1], faceUp };
  return [card, deck.slice(0, -1)];
}

export function cardValue(card: Card): number {
  if (card.rank >= 11) return 10;
  return card.rank;
}

export function handValue(hand: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.rank === 14) { aces++; total += 11; }
    else total += cardValue(c);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

export function rankName(rank: Rank): string {
  const map: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  return map[rank] ?? String(rank);
}
