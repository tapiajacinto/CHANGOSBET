'use client';
import { useParams } from 'next/navigation';
import GameLayout from '@/components/layout/GameLayout';
import FootballGame from '@/components/games/FootballGame';

export default function FootballPage() {
  const { code } = useParams<{ code: string }>();
  return (
    <GameLayout code={code} gameName="Apuestas de Fútbol" gameIcon="⚽">
      <FootballGame code={code} />
    </GameLayout>
  );
}
