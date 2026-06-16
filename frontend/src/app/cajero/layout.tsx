'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Protected } from '@/components/auth/Protected';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Button } from '@/components/ui';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/cajero', label: 'Inicio', icon: '🏠', exact: true },
  { href: '/cajero/cargar', label: 'Cargar', icon: '⬆️' },
  { href: '/cajero/retirar', label: 'Retirar', icon: '⬇️' },
  { href: '/cajero/historial', label: 'Historial', icon: '📜' },
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
    <div className="min-h-screen bg-felt-radial">
      {/* ─── TOP BAR ─── */}
      <header
        className="sticky top-0 z-40 border-b border-brand-100"
        style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/cajero" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-lg text-white shadow-brand">
              🃏
            </span>
            <span className="font-display text-lg font-extrabold leading-none">
              <span className="text-gradient-brand">CHANGOS</span>
              <span className="text-gradient-gold">BET</span>
            </span>
            <span className="ml-1 hidden rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 sm:inline">
              Cajero
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Avatar alias={profile?.alias ?? '?'} size={34} />
              <span className="hidden text-sm font-bold text-brand-900 sm:inline">{profile?.alias}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* ─── DESKTOP SIDEBAR + CONTENT ─── */}
      <div className="mx-auto flex max-w-5xl gap-6 px-4 sm:px-6">
        <aside className="sticky top-[68px] hidden h-fit w-52 shrink-0 py-6 md:block">
          <nav className="space-y-1.5">
            {NAV.map((item) => {
              const active = isActivePath(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                    active
                      ? 'bg-brand-gradient text-white shadow-brand'
                      : 'text-brand-700 hover:bg-brand-50',
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 py-5 pb-28 md:pb-10">{children}</main>
      </div>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 pb-safe md:hidden"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)' }}
      >
        <div className="mx-auto flex max-w-5xl items-stretch justify-around px-2">
          {NAV.map((item) => {
            const active = isActivePath(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition-colors',
                  active ? 'text-brand-700' : 'text-gray-400',
                )}
              >
                <span className={cn('text-xl leading-none transition-transform', active && '-translate-y-0.5 scale-110')}>
                  {item.icon}
                </span>
                {item.label}
                {active && <span className="mt-0.5 h-1 w-1 rounded-full bg-brand-600" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
