'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Protected } from '@/components/auth/Protected';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Icon, ThemeToggle } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { cn } from '@/lib/cn';

const NAV: { href: string; label: string; shortLabel?: string; icon: IconName }[] = [
  { href: '/admin',                label: 'Dashboard',      icon: 'home' },
  { href: '/admin/cajeros',        label: 'Cajeros',        icon: 'wallet' },
  { href: '/admin/jugadores',      label: 'Jugadores',      icon: 'users' },
  { href: '/admin/reconciliacion', label: 'Reconciliación', shortLabel: 'Auditoría', icon: 'shield' },
];

function isActiveHref(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  return (
    <Protected role="admin">
      <div className="min-h-screen bg-bg text-fg">
        <div className="flex min-h-screen w-full">

          {/* ─── SIDEBAR (desktop) ─── */}
          <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
            {/* Brand */}
            <div className="flex items-center gap-3 px-5 py-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-gold-500 shadow-inset-top hairline-gold">
                <Icon name="shield" size={22} />
              </span>
              <div className="leading-tight">
                <p className="font-display text-lg font-extrabold tracking-tight text-fg">CHANGOSBET</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-500/90">Panel de socios</p>
              </div>
            </div>

            <div className="mx-5 mb-2 h-px bg-line" />

            {/* Nav */}
            <nav className="mt-1 flex-1 space-y-1 px-3">
              {NAV.map((item) => {
                const active = isActiveHref(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all',
                      active
                        ? 'bg-brand-500/12 text-brand-500'
                        : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient" aria-hidden />
                    )}
                    <span className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors',
                      active ? 'bg-brand-500/15 text-brand-500' : 'text-fg-subtle group-hover:text-fg',
                    )}>
                      <Icon name={item.icon} size={18} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-line p-3">
              <div className="flex items-center gap-3 rounded-2xl bg-surface-2 px-3 py-2.5">
                <Avatar alias={profile?.alias ?? 'Socio'} size={38} />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-bold text-fg">{profile?.alias ?? 'Socio'}</p>
                  <p className="text-[11px] font-semibold text-gold-500">Socio</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-1.5 flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left text-sm font-bold text-fg-muted transition-colors hover:bg-surface-2 hover:text-brand-500"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-fg-subtle">
                  <Icon name="logout" size={18} />
                </span>
                Salir
              </button>
            </div>
          </aside>

          {/* ─── CONTENT ─── */}
          <div className="flex min-w-0 flex-1 flex-col">

            {/* TOP BAR */}
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface/80 px-4 py-3 backdrop-blur-xl sm:px-6">
              <div className="flex items-center gap-2.5 lg:hidden">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-gold-500 hairline-gold">
                  <Icon name="shield" size={18} />
                </span>
                <span className="font-display text-base font-extrabold tracking-tight text-fg">Panel de socios</span>
              </div>
              <div className="hidden lg:block">
                <h1 className="font-display text-lg font-extrabold tracking-tight text-fg">
                  {NAV.find((n) => isActiveHref(pathname, n.href))?.label ?? 'Panel'}
                </h1>
              </div>

              <div className="flex items-center gap-2.5">
                <ThemeToggle />
                <div className="hidden items-center gap-2 rounded-full border border-line bg-surface-2 py-1.5 pl-1.5 pr-3.5 sm:flex">
                  <Avatar alias={profile?.alias ?? 'Socio'} size={26} />
                  <span className="text-sm font-bold text-fg">{profile?.alias ?? 'Socio'}</span>
                </div>
                <button
                  onClick={logout}
                  aria-label="Salir"
                  className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-fg-muted transition-colors hover:bg-surface-2 hover:text-brand-500 sm:text-sm lg:hidden"
                >
                  <Icon name="logout" size={16} /> Salir
                </button>
              </div>
            </header>

            {/* PAGE */}
            <main className="flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-7 lg:pb-10">
              <div className="mx-auto w-full max-w-[1480px]">{children}</div>
            </main>
          </div>
        </div>

        {/* ─── BOTTOM NAV (mobile) ─── */}
        <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-line bg-surface/90 pb-safe backdrop-blur-xl lg:hidden">
          {NAV.map((item) => {
            const active = isActiveHref(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[3.25rem] flex-col items-center justify-end gap-1 py-2.5 text-[11px] font-bold transition-colors',
                  active ? 'text-brand-500' : 'text-fg-muted',
                )}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-9 rounded-full bg-brand-gradient" aria-hidden />
                )}
                <span className={cn('transition-transform duration-200', active && 'scale-110')}>
                  <Icon name={item.icon} size={20} />
                </span>
                <span className="truncate leading-tight text-center">{item.shortLabel ?? item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </Protected>
  );
}
