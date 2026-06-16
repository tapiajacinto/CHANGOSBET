'use client';
import { useParams } from 'next/navigation';
import GameLayout from '@/components/layout/GameLayout';
import HorsesGame from '@/components/games/HorsesGame';

export default function HorsesPage() {
  const { code } = useParams<{ code: string }>();
  return (
    <GameLayout code={code} gameName="Carreras de Caballos" gameIcon="🏇">
      <HorsesGame code={code} />
    </GameLayout>
  );
}
