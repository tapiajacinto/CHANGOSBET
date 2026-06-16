'use client';
import { Card } from '@/types';

const SUIT_SYMBOLS: Record<string, string> = {
  clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠',
};
const SUIT_COLORS: Record<string, string> = {
  clubs: '#1a1a2e', diamonds: '#e63946', hearts: '#e63946', spades: '#1a1a2e',
};
const RANK_LABELS: Record<number, string> = {
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

interface Props {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function CardComponent({ card, size = 'md', animated }: Props) {
  const sizes = {
    sm: { w: 40, h: 56, font: 14, sym: 18 },
    md: { w: 60, h: 84, font: 16, sym: 24 },
    lg: { w: 80, h: 112, font: 20, sym: 32 },
  };
  const s = sizes[size];

  if (!card.faceUp || card.suit === 'back') {
    return (
      <div className={`card-back flex-shrink-0 ${animated ? 'deal-animation' : ''}`}
        style={{ width: s.w, height: s.h }} />
    );
  }

  const label = RANK_LABELS[card.rank] ?? String(card.rank);
  const symbol = SUIT_SYMBOLS[card.suit] ?? '?';
  const color = SUIT_COLORS[card.suit] ?? '#1a1a2e';

  return (
    <div className={`card-face flex-shrink-0 ${animated ? 'deal-animation' : ''}`}
      style={{ width: s.w, height: s.h, color }}>
      <div className="absolute top-1 left-1 leading-none" style={{ fontSize: s.font, fontWeight: 'bold' }}>
        <div>{label}</div>
        <div style={{ fontSize: s.sym * 0.7 }}>{symbol}</div>
      </div>
      <div style={{ fontSize: s.sym }}>{symbol}</div>
      <div className="absolute bottom-1 right-1 leading-none rotate-180" style={{ fontSize: s.font }}>
        <div>{label}</div>
        <div style={{ fontSize: s.sym * 0.7 }}>{symbol}</div>
      </div>
    </div>
  );
}
