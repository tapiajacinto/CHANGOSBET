'use client';
import { useParams } from 'next/navigation';
import GameLayout from '@/components/layout/GameLayout';
import PokerGame from '@/components/games/PokerGame';

export default function PokerPage() {
  const { code } = useParams<{ code: string }>();
  return (
    <GameLayout code={code} gameName="Texas Hold'em" gameIcon="♠️">
      <PokerGame code={code} />
    </GameLayout>
  );
}
