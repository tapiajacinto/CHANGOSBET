'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, EmptyState, Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { useNotifications } from '@/lib/useNotifications';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Notification } from '@/types/database';

const ICONS: Record<string, IconName> = {
  chips_loaded: 'coins',
  withdraw_ok: 'check',
  activated: 'sparkles',
};

function iconFor(type: string): IconName {
  return ICONS[type] ?? 'bell';
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
        className="relative grid h-11 w-11 place-items-center rounded-2xl border border-line bg-surface text-fg shadow-card transition-all hover:-translate-y-0.5 hover:border-line-2 hover:shadow-card-hover active:scale-95"
      >
        <motion.span
          animate={unread > 0 ? { rotate: [0, -12, 10, -8, 6, 0] } : { rotate: 0 }}
          transition={unread > 0 ? { duration: 0.9, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' } : { duration: 0.2 }}
          style={{ transformOrigin: 'top center' }}
        >
          <Icon name="bell" size={22} />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 400 }}
              className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-gold-gradient px-1 text-[0.65rem] font-extrabold tabular-nums text-brand-950 shadow-gold ring-2 ring-surface"
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
            icon={<Icon name="bell" size={36} />}
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
        'flex items-start gap-3 rounded-2xl border p-3.5 transition-colors hover:bg-surface-3',
        n.read
          ? 'border-line bg-surface'
          : 'border-brand-500/30 bg-surface-2 shadow-inset-top',
      )}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
        <Icon name={iconFor(n.type)} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display text-sm font-bold text-fg">{n.title}</p>
          <span className="shrink-0 text-xs text-fg-muted">{timeAgo(n.created_at)}</span>
        </div>
        {n.body && <p className="mt-0.5 text-sm leading-snug text-fg-muted">{n.body}</p>}
      </div>
      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="No leída" />}
    </li>
  );
}
