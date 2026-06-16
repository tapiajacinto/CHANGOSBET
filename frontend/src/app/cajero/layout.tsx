'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Protected } from '@/components/auth/Protected';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Button, Icon, ThemeToggle } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { cn } from '@/lib/cn';

const NAV: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: '/cajero', label: 'Inicio', icon: 'home', exact: true },
  { href: '/cajero/cargar', label: 'Cargar', icon: 'plus' },
  { href: '/cajero/retirar', label: 'Retirar', icon: 'minus' },
  { href: '/cajero/historial', label: 'Historial', icon: 'refresh' },
];

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export default function CajeroLayout({ children }: { children: ReactNode }) {
  return (
    <Protected role="cashier">
      <CajeroShell>{children}</CajeroShell>
    </Protected>
  );
}

function CajeroShell({ children }: { children: ReactNode }) {
  const { profile, logout } = useAuth();
  const pathname = usePathname() || '/cajero';

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* ─── TOP BAR ─── */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-xl">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" aria-hidden />
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/cajero" className="group flex min-w-0 items-center gap-2.5">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand transition-transform group-hover:scale-105">
              <span className="absolute inset-0 rounded-2xl sheen-top" aria-hidden />
              <Icon name="cards" size={18} />
            </span>
            <span className="font-display text-lg font-extrabold leading-none tracking-tight">
              <span className="text-gradient-brand">CHANGOS</span>
              <span className="text-gradient-gold">BET</span>
            </span>
            <span className="ml-1 hidden items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-[11px] font-bold text-gold-600 dark:text-gold-400 sm:inline-flex">
              <Icon name="wallet" size={11} /> Cajero
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2/60 py-1 pl-1 pr-2.5">
              <Avatar alias={profile?.alias ?? '?'} size={30} />
              <span className="hidden text-sm font-bold text-fg sm:inline">{profile?.alias}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()} leftIcon={<Icon name="logout" size={16} />}>
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── DESKTOP SIDEBAR + CONTENT ─── */}
      <div className="mx-auto flex max-w-5xl gap-6 px-4 sm:px-6">
        <aside className="sticky top-[60px] hidden h-fit w-56 shrink-0 py-6 md:block">
          <nav className="space-y-1.5">
            {NAV.map((item) => {
              const active = isActivePath(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                    active
                      ? 'bg-brand-500/12 text-brand-500'
                      : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-brand-gradient" aria-hidden />}
                  <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors',
                    active ? 'bg-brand-500/15 text-brand-500' : 'bg-surface-2 text-fg-muted group-hover:bg-surface-3')}>
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span className="relative">{item.label}</span>
                  {active && <Icon name="chevronRight" size={16} className="relative ml-auto text-brand-500/70" />}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 rounded-2xl border border-line bg-surface-2/50 p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-fg-muted">
              <Icon name="chip" size={14} className="text-fg-subtle" /> Caja de plata real
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-subtle">
              Recibí el efectivo antes de cargar fichas y entregalo al pagar un retiro.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 py-5 pb-28 md:pb-10">{children}</main>
      </div>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-safe backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around px-2">
          {NAV.map((item) => {
            const active = isActivePath(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors',
                  active ? 'text-brand-500' : 'text-fg-muted',
                )}
              >
                {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-brand-gradient" aria-hidden />}
                <span className={cn('grid h-9 w-9 place-items-center rounded-2xl leading-none transition-all',
                  active ? 'bg-brand-500/12 text-brand-500 -translate-y-0.5' : 'text-fg-muted')}>
                  <Icon name={item.icon} size={22} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
