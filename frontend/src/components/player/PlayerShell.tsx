'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Money, Avatar, Icon, ThemeToggle } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { NotificationBell } from '@/components/player/NotificationBell';
import { cn } from '@/lib/cn';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/lobby',  label: 'Inicio',       icon: 'home' },
  { href: '/wallet', label: 'Mi billetera', icon: 'wallet' },
];

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
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/80 shadow-card backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <button
            onClick={() => router.push('/lobby')}
            className="font-display text-lg font-extrabold tracking-tight text-fg"
          >
            <span className="text-gradient-brand">CHANGOS</span><span className="text-gradient-gold">BET</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Balance */}
            <button
              onClick={() => router.push('/wallet')}
              className="group flex max-w-[42vw] items-center gap-1.5 rounded-2xl border border-line bg-surface-2 px-3 py-1.5 text-fg shadow-inset-top transition-all hover:border-line-2 hover:bg-surface-3 active:scale-95 sm:max-w-none"
              aria-label="Ver mi billetera"
            >
              <Money value={profile?.balance ?? 0} className="truncate text-sm font-bold tabular-nums" />
            </button>

            <ThemeToggle />

            <NotificationBell />

            {/* Avatar + menú */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded-full ring-2 ring-transparent transition hover:ring-brand-500/40"
                aria-label="Abrir menú"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar alias={alias} size={38} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-40 w-52 origin-top-right animate-pop-in overflow-hidden rounded-2xl border border-line bg-surface shadow-card-hover"
                >
                  <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                    <Avatar alias={alias} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-fg">{alias}</p>
                      <p className="truncate text-xs text-fg-muted">Jugador</p>
                    </div>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); router.push('/wallet'); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
                  >
                    <Icon name="wallet" size={18} /> Mi billetera
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 border-t border-line px-4 py-3 text-left text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
                  >
                    <Icon name="logout" size={18} /> Salir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenido ─────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 sm:pb-10">
        {children}
      </main>

      {/* ── Bottom-nav (mobile) ───────────────────────────────────── */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors',
                  active ? 'text-brand-500' : 'text-fg-muted hover:text-fg',
                )}
              >
                {/* Indicador activo */}
                <span
                  className={cn(
                    'absolute top-0 h-0.5 w-9 rounded-full bg-brand-gradient transition-all duration-300',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-2xl transition-all duration-300',
                    active && 'bg-brand-500/10 shadow-inset-top',
                  )}
                >
                  <Icon name={item.icon} size={22} className={cn('transition-transform', active && 'scale-110')} />
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
