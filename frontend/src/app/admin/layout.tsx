'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Protected } from '@/components/auth/Protected';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/admin',                label: 'Dashboard',      icon: '📊' },
  { href: '/admin/cajeros',        label: 'Cajeros',        icon: '💵' },
  { href: '/admin/jugadores',      label: 'Jugadores',      icon: '🎮' },
  { href: '/admin/reconciliacion', label: 'Reconciliación', icon: '⚖️' },
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
      <div className="min-h-screen bg-felt-radial">
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">

          {/* ─── SIDEBAR (desktop) ─── */}
          <aside className="hidden w-64 shrink-0 flex-col border-r border-brand-900/40 bg-brand-deep lg:flex">
            <div className="flex items-center gap-2.5 px-6 py-6">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-gradient text-xl shadow-gold">
                👑
              </span>
              <div className="leading-tight">
                <p className="font-display text-lg font-extrabold text-white">CHANGOSBET</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">Panel de socios</p>
              </div>
            </div>

            <nav className="mt-2 flex-1 space-y-1 px-3">
              {NAV.map((item) => {
                const active = isActiveHref(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                      active
                        ? 'bg-gold-gradient text-brand-950 shadow-gold'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
                <Avatar alias={profile?.alias ?? 'Socio'} size={36} />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-bold text-white">{profile?.alias ?? 'Socio'}</p>
                  <p className="text-[11px] text-gold-400">Socio</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-1 w-full rounded-2xl px-4 py-2.5 text-left text-sm font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                ⤴ Salir
              </button>
            </div>
          </aside>

          {/* ─── CONTENT ─── */}
          <div className="flex min-w-0 flex-1 flex-col">

            {/* TOP BAR */}
            <header
              className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-100 px-4 py-3.5 sm:px-6"
              style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)' }}
            >
              <div className="flex items-center gap-2.5 lg:hidden">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-gradient text-lg shadow-gold">👑</span>
                <span className="font-display text-base font-extrabold text-brand-900">Panel de socios</span>
              </div>
              <div className="hidden lg:block">
                <h1 className="font-display text-lg font-extrabold text-brand-900">
                  {NAV.find((n) => isActiveHref(pathname, n.href))?.label ?? 'Panel'}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 sm:flex">
                  <Avatar alias={profile?.alias ?? 'Socio'} size={24} />
                  <span className="text-sm font-bold text-brand-700">{profile?.alias ?? 'Socio'}</span>
                </div>
                <button
                  onClick={logout}
                  className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-700 sm:text-sm lg:hidden"
                >
                  Salir
                </button>
              </div>
            </header>

            {/* PAGE */}
            <main className="flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-7 lg:pb-10">
              {children}
            </main>
          </div>
        </div>

        {/* ─── BOTTOM NAV (mobile) ─── */}
        <nav
          className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-brand-100 pb-safe lg:hidden"
          style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(14px)' }}
        >
          {NAV.map((item) => {
            const active = isActiveHref(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition-colors',
                  active ? 'text-brand-700' : 'text-gray-400',
                )}
              >
                <span className={cn('text-lg transition-transform', active && 'scale-110')}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </Protected>
  );
}
