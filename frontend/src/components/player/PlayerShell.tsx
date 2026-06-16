'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Money, Avatar } from '@/components/ui';
import { NotificationBell } from '@/components/player/NotificationBell';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/lobby',  label: 'Inicio',       icon: '🏠' },
  { href: '/wallet', label: 'Mi billetera', icon: '👛' },
] as const;

/** Shell del jugador: top bar + contenido + bottom-nav mobile. */
export function PlayerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al click afuera.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const alias = profile?.alias ?? 'Chango';

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-soft)]">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <button
            onClick={() => router.push('/lobby')}
            className="font-display text-lg font-extrabold tracking-tight text-brand-900"
          >
            CHANGOS<span className="text-gradient-brand">BET</span>
          </button>

          <div className="flex items-center gap-2.5">
            {/* Balance */}
            <button
              onClick={() => router.push('/wallet')}
              className="flex items-center gap-1.5 rounded-2xl border border-gold-200 bg-gold-50 px-3 py-1.5 text-brand-900 transition-colors hover:bg-gold-100"
              aria-label="Ver mi billetera"
            >
              <Money value={profile?.balance ?? 0} className="text-sm" />
            </button>

            <NotificationBell />

            {/* Avatar + menú */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded-full ring-2 ring-transparent transition hover:ring-brand-200"
                aria-label="Abrir menú"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar alias={alias} size={38} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-40 w-52 origin-top-right animate-pop-in overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card-hover"
                >
                  <div className="flex items-center gap-3 border-b border-brand-50 px-4 py-3">
                    <Avatar alias={alias} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-brand-900">{alias}</p>
                      <p className="truncate text-xs text-gray-400">Jugador</p>
                    </div>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push('/wallet'); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
                  >
                    <span>👛</span> Mi billetera
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 border-t border-brand-50 px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <span>🚪</span> Salir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenido ─────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 sm:pb-10">
        {children}
      </main>

      {/* ── Bottom-nav (mobile) ───────────────────────────────────── */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-brand-100/80 bg-white/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition-colors',
                  active ? 'text-brand-700' : 'text-gray-400 hover:text-brand-500',
                )}
              >
                <span className={cn('text-xl transition-transform', active && 'scale-110')}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
