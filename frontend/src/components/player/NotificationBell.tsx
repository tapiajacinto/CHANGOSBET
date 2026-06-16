'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, EmptyState } from '@/components/ui';
import { useNotifications } from '@/lib/useNotifications';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Notification } from '@/types/database';

const ICONS: Record<string, string> = {
  chips_loaded: '💰',
  withdraw_ok: '✅',
  activated: '🎉',
};

function iconFor(type: string): string {
  return ICONS[type] ?? '🔔';
}

/** Campana de notificaciones del jugador. Sin props: usa useNotifications(). */
export function NotificationBell() {
  const { items, unread, markAllRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    void markAllRead();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notificaciones"
        className="relative grid h-11 w-11 place-items-center rounded-2xl border border-brand-100 bg-white text-xl text-brand-700 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover active:scale-95"
      >
        <span aria-hidden>🔔</span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 400 }}
              className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-gold-gradient px-1 text-[0.65rem] font-extrabold tabular-nums text-brand-950 shadow-gold ring-2 ring-white"
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Notificaciones">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No hay novedades"
            subtitle="Acá vas a ver tus cargas, retiros y avisos del cajero."
          />
        ) : (
          <ul className="space-y-2.5">
            {items.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-3.5 transition-colors',
        n.read ? 'border-brand-50 bg-white' : 'border-brand-100 bg-brand-50/60',
      )}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-lg text-white shadow-brand">
        {iconFor(n.type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display text-sm font-bold text-brand-900">{n.title}</p>
          <span className="shrink-0 text-xs text-gray-400">{timeAgo(n.created_at)}</span>
        </div>
        {n.body && <p className="mt-0.5 text-sm leading-snug text-gray-500">{n.body}</p>}
      </div>
      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-700" aria-label="No leída" />}
    </li>
  );
}
