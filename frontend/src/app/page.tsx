'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { homeFor } from '@/lib/routes';
import { Button, FullScreenLoader } from '@/components/ui';

/* ─── Datos ──────────────────────────────────────────────────────── */
const GAMES = [
  { icon: '🎡', name: 'Ruleta',    desc: 'Apostá a números, colores y docenas. La bolita decide.' },
  { icon: '🃏', name: 'Blackjack', desc: 'Llegá a 21 antes que el crupier, en la misma mesa.' },
  { icon: '♠️', name: 'Poker',     desc: 'Texas Hold’em completo con tus changos.', soon: true },
  { icon: '🏇', name: 'Caballos',  desc: 'Elegí tu caballo y miralo correr en vivo.' },
  { icon: '⚽', name: 'Fútbol',    desc: 'Partidos simulados: 1X2, ambos marcan, over/under.' },
] as const;

const STEPS = [
  { n: 1, icon: '📝', title: 'Registrate', desc: 'Creá tu cuenta con tu teléfono en segundos.' },
  { n: 2, icon: '🤝', title: 'Hablá con tu cajero', desc: 'Tu cajero te activa la cuenta y te carga las fichas.' },
  { n: 3, icon: '🎰', title: 'Jugá con amigos', desc: 'Armá una mesa o sumate a la de un chango y a divertirse.' },
  { n: 4, icon: '💸', title: 'Retirá cuando quieras', desc: 'Cobrá tus fichas con tu cajero de confianza.' },
] as const;

/* ─── Variantes de animación ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function LandingPage() {
  const router = useRouter();
  const { loading, session, profile } = useAuth();

  // Si ya hay sesión, mandar a la home según rol.
  useEffect(() => {
    if (!loading && session && profile) router.replace(homeFor(profile.role));
  }, [loading, session, profile, router]);

  if (loading) return <FullScreenLoader />;
  if (session && profile) return <FullScreenLoader label="Entrando…" />;

  return (
    <main className="min-h-screen bg-brand-deep text-white">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <span className="font-display text-xl font-extrabold tracking-tight">
            CHANGOS<span className="text-gradient-gold">BET</span>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="!text-white hover:!bg-white/10" onClick={() => router.push('/login')}>
              Ingresar
            </Button>
            <Button variant="gold" size="sm" onClick={() => router.push('/register')}>
              Crear cuenta
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Fondo Messi */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/messi-bg.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/85 via-brand-900/80 to-brand-deep" />
        <div className="absolute inset-0 bg-dots opacity-40" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-5 pb-20 pt-36 text-center sm:pt-44">
          <motion.span
            initial="hidden" animate="show" variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-200 backdrop-blur"
          >
            🪙 Economía de fichas reales
          </motion.span>

          <motion.h1
            initial="hidden" animate="show" custom={1} variants={fadeUp}
            className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
          >
            El casino de los changos,<br />
            <span className="text-gradient-gold">con tus amigos.</span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="show" custom={2} variants={fadeUp}
            className="mt-5 max-w-xl text-base text-white/80 sm:text-lg"
          >
            Cargá fichas con tu cajero y jugá a la ruleta, blackjack, caballos y más
            en mesas en vivo. Sin vueltas, todo entre changos.
          </motion.p>

          <motion.div
            initial="hidden" animate="show" custom={3} variants={fadeUp}
            className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Button variant="gold" size="lg" fullWidth className="sm:w-auto" onClick={() => router.push('/register')}>
              Crear mi cuenta →
            </Button>
            <Button
              variant="outline" size="lg" fullWidth
              className="sm:w-auto !border-white/40 !bg-white/5 !text-white hover:!border-white hover:!bg-white/10"
              onClick={() => router.push('/login')}
            >
              Ya tengo cuenta
            </Button>
          </motion.div>

          <motion.p
            initial="hidden" animate="show" custom={4} variants={fadeUp}
            className="mt-6 text-xs text-white/50"
          >
            5 juegos en vivo · Mesas multijugador · Cajeros de confianza
          </motion.p>
        </div>
      </section>

      {/* ── Juegos ────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-5 py-20">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
          className="mb-10 text-center"
        >
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Cinco formas de <span className="text-gradient-gold">ganar</span>
          </h2>
          <p className="mt-3 text-white/70">Elegí tu juego y armá la mesa con los changos.</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g, i) => (
            <motion.div
              key={g.name}
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
              custom={i} variants={fadeUp}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-gold-500/40 hover:bg-white/[0.07]"
            >
              {'soon' in g && g.soon && (
                <span className="absolute right-4 top-4 rounded-full bg-gold-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-200">
                  Próximamente
                </span>
              )}
              <div className="text-4xl transition-transform duration-300 group-hover:scale-110">{g.icon}</div>
              <h3 className="mt-4 font-display text-xl font-bold">{g.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/65">{g.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Cómo funciona ─────────────────────────────────────────── */}
      <section className="relative border-y border-white/10 bg-brand-950/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
            className="mb-12 text-center"
          >
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              ¿Cómo <span className="text-gradient-gold">funciona</span>?
            </h2>
            <p className="mt-3 text-white/70">De cero a la mesa en cuatro pasos.</p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
                custom={i} variants={fadeUp}
                className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold-gradient font-display text-lg font-extrabold text-brand-950 shadow-gold">
                    {s.n}
                  </span>
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/65">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-3xl px-5 py-24 text-center">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="font-display text-3xl font-extrabold sm:text-5xl">
            ¿Listo para <span className="text-gradient-gold">jugar</span>?
          </h2>
          <p className="mt-4 text-white/75">
            Creá tu cuenta gratis. Después, tu cajero te activa y te carga las fichas para empezar.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button variant="gold" size="lg" fullWidth className="sm:w-auto" onClick={() => router.push('/register')}>
              Crear mi cuenta →
            </Button>
            <Button
              variant="outline" size="lg" fullWidth
              className="sm:w-auto !border-white/40 !bg-white/5 !text-white hover:!border-white hover:!bg-white/10"
              onClick={() => router.push('/login')}
            >
              Ingresar
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-white/55 sm:flex-row">
          <span className="font-display text-base font-extrabold text-white">
            CHANGOS<span className="text-gradient-gold">BET</span>
          </span>
          <p>Jugá con responsabilidad · +18 · Entre changos de confianza</p>
          <p>© {new Date().getFullYear()} CHANGOSBET</p>
        </div>
      </footer>
    </main>
  );
}
