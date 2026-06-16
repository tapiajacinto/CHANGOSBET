'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { homeFor } from '@/lib/routes';
import { FullScreenLoader } from '@/components/ui';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { loading, session, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session && profile) router.replace(homeFor(profile.role));
  }, [loading, session, profile, router]);

  if (loading || (session && !profile)) return <FullScreenLoader />;
  if (session) return <FullScreenLoader label="Entrando…" />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-deep px-4 py-10">
      {/* Fondo Messi + capa roja + puntos */}
      <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: 'url(/messi-bg.jpg)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(69,0,0,0.92), rgba(127,0,0,0.78) 55%, rgba(69,0,0,0.95))' }} />
      <div className="absolute inset-0 bg-dots opacity-[0.06]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-5xl">🃏</div>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white">
            CHANGOS<span className="text-gradient-gold">BET</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">Casino entre changos · fichas reales</p>
        </div>
        {children}
      </div>
    </div>
  );
}
