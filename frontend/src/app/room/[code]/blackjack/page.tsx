'use client';
import { useParams } from 'next/navigation';
import GameLayout from '@/components/layout/GameLayout';
import BlackjackGame from '@/components/games/BlackjackGame';

export default function BlackjackPage() {
  const { code } = useParams<{ code: string }>();
  return (
    <GameLayout code={code} gameName="Blackjack" gameIcon="🃏">
      <BlackjackGame code={code} />
    </GameLayout>
  );
}
