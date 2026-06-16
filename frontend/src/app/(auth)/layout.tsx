'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { homeFor } from '@/lib/routes';
import { FullScreenLoader, Icon, ThemeToggle } from '@/components/ui';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { loading, session, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session && profile) router.replace(homeFor(profile.role));
  }, [loading, session, profile, router]);

  if (loading || (session && !profile)) return <FullScreenLoader />;
  if (session) return <FullScreenLoader label="Entrando…" />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-fg">
      {/* Glow oxblood + viñeta dorada (sutil en ambos temas) */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% -10%, rgba(192,0,10,0.30), transparent 55%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(90% 60% at 50% 120%, rgba(232,185,35,0.10), transparent 60%)' }} />
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.04]" />
      <div className="pointer-events-none absolute -left-10 top-16 text-fg/[0.03]"><Icon name="spade" size={260} /></div>
      <div className="pointer-events-none absolute -right-12 bottom-10 text-fg/[0.03]"><Icon name="diamond" size={240} /></div>
      <div className="pointer-events-none absolute inset-3 rounded-[28px] border border-gold-500/10" />

      <div className="absolute right-4 top-4 z-20"><ThemeToggle /></div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-gold-500/30 bg-gradient-to-b from-gold-500/10 to-transparent text-gold-400 shadow-gold">
            <Icon name="chip" size={30} />
          </div>
          <h1 className="font-display text-[28px] font-extrabold leading-none tracking-tight">
            CHANGOS<span className="text-gradient-gold">BET</span>
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-fg-subtle">Casa de apuestas · fichas reales</p>
        </div>
        {children}
        <p className="mt-8 text-center text-[11px] text-fg-subtle">+18 · Jugá con responsabilidad</p>
      </div>
    </div>
  );
}
