'use client';
import { useParams } from 'next/navigation';
import GameLayout from '@/components/layout/GameLayout';
import RouletteGame from '@/components/games/RouletteGame';

export default function RoulettePage() {
  const { code } = useParams<{ code: string }>();
  return (
    <GameLayout code={code} gameName="Ruleta Europea" gameIcon="🎡">
      <RouletteGame code={code} />
    </GameLayout>
  );
}
