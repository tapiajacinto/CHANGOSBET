import type { HorsesState, Horse, HorseBet } from '@/types';

const HORSE_DATA = [
  { id: 1, name: 'Thunder Bolt', odds: 2.5, color: '#e63946' },
  { id: 2, name: 'Golden Arrow', odds: 3.2, color: '#ffd700' },
  { id: 3, name: 'Silver Streak', odds: 4.0, color: '#adb5bd' },
  { id: 4, name: 'Dark Shadow', odds: 5.5, color: '#6c757d' },
  { id: 5, name: 'Lucky Star', odds: 6.0, color: '#4cc9f0' },
  { id: 6, name: 'Storm Rider', odds: 7.5, color: '#7209b7' },
  { id: 7, name: 'Iron Will', odds: 9.0, color: '#f77f00' },
  { id: 8, name: 'Wild Spirit', odds: 12.0, color: '#2dc653' },
];

export function createHorsesState(): HorsesState {
  return {
    phase: 'betting',
    horses: HORSE_DATA.map(h => ({ ...h, position: 0 })),
    bets: [],
    winnerId: null,
    bettingTimeLeft: 20,
  };
}

export function resetHorsesState(state: HorsesState): void {
  state.phase = 'betting';
  state.bets = [];
  state.winnerId = null;
  state.bettingTimeLeft = 20;
  for (const h of state.horses) {
    h.position = 0;
    const base = HORSE_DATA[h.id - 1].odds;
    h.odds = Math.round((base + (Math.random() - 0.5) * 1.5) * 10) / 10;
    if (h.odds < 1.5) h.odds = 1.5;
  }
}

export function simulateRace(horses: Horse[]): { frames: number[][]; winnerId: number } {
  const positions = new Array(8).fill(0);
  const frames: number[][] = [];
  const baseSpeeds = horses.map(h => 10 / h.odds);
  let winner = -1;
  const TRACK = 100;

  while (winner === -1) {
    for (let i = 0; i < 8; i++) {
      positions[i] = Math.min(TRACK, positions[i] + baseSpeeds[i] + (Math.random() - 0.3) * 2.5);
      if (positions[i] >= TRACK && winner === -1) winner = horses[i].id;
    }
    frames.push([...positions]);
  }
  return { frames, winnerId: winner };
}

export function resolveHorsesBets(bets: HorseBet[], winnerId: number, horses: Horse[]): Map<string, number> {
  const winnings = new Map<string, number>();
  const winner = horses.find(h => h.id === winnerId);
  if (!winner) return winnings;
  for (const bet of bets) {
    if (bet.horseId === winnerId) {
      const payout = Math.round(bet.amount * winner.odds);
      winnings.set(bet.playerId, (winnings.get(bet.playerId) ?? 0) + payout);
    }
  }
  return winnings;
}
