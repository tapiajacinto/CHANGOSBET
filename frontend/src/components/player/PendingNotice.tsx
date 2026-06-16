'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Button, Icon } from '@/components/ui';
import { displayPhone } from '@/lib/format';

/** Aviso premium: la cuenta del jugador está pendiente de activación por un cajero. */
export function PendingNotice() {
  const { profile } = useAuth();
  const phone = displayPhone(profile?.phone);
  const [copied, setCopied] = useState(false);

  const copyPhone = async () => {
    if (!profile?.phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      toast.success('Teléfono copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="overflow-hidden !p-0">
        {/* Encabezado */}
        <div className="relative bg-brand-gradient px-6 py-8 text-center text-white">
          <div className="absolute inset-0 bg-grain opacity-50" aria-hidden />
          <div className="absolute inset-0 bg-dots opacity-30" aria-hidden />
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 220 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/15 backdrop-blur"
            >
              <Icon name="alert" size={32} />
            </motion.div>
            <h2 className="mt-4 font-display text-2xl font-extrabold">Tu cuenta está pendiente</h2>
            <p className="mt-2 text-sm text-white/85">
              Falta que un cajero la active y te cargue las fichas para empezar a jugar.
            </p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-6">
          <p className="text-center text-sm leading-relaxed text-fg-muted">
            Pasale este teléfono a tu cajero de confianza. Con él te encuentra y
            <span className="font-bold text-fg"> activa tu cuenta</span>.
          </p>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-line bg-surface-2 px-5 py-4 transition-colors hover:bg-surface-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">Tu teléfono</p>
              <p className="truncate font-display text-xl font-extrabold tabular-nums text-fg">{phone}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyPhone} disabled={!profile?.phone}>
              {copied ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="check" size={16} /> Copiado
                </span>
              ) : (
                'Copiar'
              )}
            </Button>
          </div>

          {/* Pasos */}
          <div className="mt-6 space-y-3">
            {[
              { n: 1, t: 'Contactá a tu cajero', d: 'Pasale tu teléfono por mensaje o en persona.' },
              { n: 2, t: 'Te activa la cuenta', d: 'Tu cajero te reclama y habilita para jugar.' },
              { n: 3, t: 'Te carga las fichas', d: 'Una vez activa, recibís tus fichas y a la mesa.' },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-brand">
                  {s.n}
                </span>
                <div>
                  <p className="text-sm font-bold text-fg">{s.t}</p>
                  <p className="text-xs text-fg-muted">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-fg-muted">
            Esta pantalla se actualiza sola apenas tu cajero te active.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
