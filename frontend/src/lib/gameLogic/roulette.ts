import type { RouletteBet, RouletteBetType } from '@/types';

export const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
export const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

export function spin(): number {
  return Math.floor(Math.random() * 37);
}

export function resolveRouletteBets(bets: RouletteBet[], winning: number): Map<string, number> {
  const winnings = new Map<string, number>();
  for (const bet of bets) {
    const payout = calculatePayout(bet, winning);
    if (payout > 0) {
      winnings.set(bet.playerId, (winnings.get(bet.playerId) ?? 0) + payout);
    }
  }
  return winnings;
}

function calculatePayout(bet: RouletteBet, winning: number): number {
  if (!bet.numbers.includes(winning)) return 0;
  const multipliers: Record<RouletteBetType, number> = {
    straight: 35, split: 17, street: 11, corner: 8, sixline: 5,
    dozen1: 2, dozen2: 2, dozen3: 2,
    col1: 2, col2: 2, col3: 2,
    red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1,
  };
  return bet.amount * ((multipliers[bet.type] ?? 0) + 1);
}

export function buildBetNumbers(type: RouletteBetType, data?: number[]): number[] {
  switch (type) {
    case 'straight': return data ?? [];
    case 'red': return [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    case 'black': return [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
    case 'odd': return Array.from({length:18},(_,i)=>i*2+1);
    case 'even': return Array.from({length:18},(_,i)=>(i+1)*2);
    case 'low': return Array.from({length:18},(_,i)=>i+1);
    case 'high': return Array.from({length:18},(_,i)=>i+19);
    case 'dozen1': return Array.from({length:12},(_,i)=>i+1);
    case 'dozen2': return Array.from({length:12},(_,i)=>i+13);
    case 'dozen3': return Array.from({length:12},(_,i)=>i+25);
    case 'col1': return [1,4,7,10,13,16,19,22,25,28,31,34];
    case 'col2': return [2,5,8,11,14,17,20,23,26,29,32,35];
    case 'col3': return [3,6,9,12,15,18,21,24,27,30,33,36];
    default: return data ?? [];
  }
}
