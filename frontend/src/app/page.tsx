'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { homeFor } from '@/lib/routes';
import { Button, FullScreenLoader, Icon, IconName, ThemeToggle } from '@/components/ui';

const GAMES: { icon: IconName; name: string; desc: string; img: string; soon?: boolean }[] = [
  { icon: 'roulette', name: 'Ruleta',    desc: 'Apostá a números, colores y docenas. La bolita decide.', img: '/games/roulette.png' },
  { icon: 'cards',    name: 'Blackjack', desc: 'Llegá a 21 antes que el crupier, en la misma mesa.', img: '/games/blackjack.png' },
  { icon: 'spade',    name: 'Poker',     desc: 'Texas Hold’em completo con tus changos.', soon: true, img: '/games/poker.png' },
  { icon: 'horse',    name: 'Caballos',  desc: 'Elegí tu caballo y miralo correr en vivo.', img: '/games/caballos.png' },
  { icon: 'ball',     name: 'Fútbol',    desc: 'Partidos simulados: 1X2, ambos marcan, over/under.', img: '/games/futbol.png' },
];

const STEPS: { n: number; icon: IconName; title: string; desc: string }[] = [
  { n: 1, icon: 'idCard', title: 'Registrate',            desc: 'Creá tu cuenta con tus datos en segundos.' },
  { n: 2, icon: 'users',  title: 'Hablá con tu cajero',   desc: 'Tu cajero te activa la cuenta y te carga las fichas.' },
  { n: 3, icon: 'dice',   title: 'Jugá con amigos',       desc: 'Armá una mesa o sumate a la de un chango.' },
  { n: 4, icon: 'wallet', title: 'Retirá cuando quieras', desc: 'Cobrá tus fichas con tu cajero de confianza.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const } }),
};

export default function LandingPage() {
  const router = useRouter();
  const { loading, session, profile } = useAuth();

  useEffect(() => {
    if (!loading && session && profile) router.replace(homeFor(profile.role));
  }, [loading, session, profile, router]);

  if (loading) return <FullScreenLoader />;
  if (session && profile) return <FullScreenLoader label="Entrando…" />;

  return (
    <main className="min-h-screen bg-bg text-fg">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <span className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold-500/40 text-gold-400"><Icon name="chip" size={18} /></span>
            CHANGOS<span className="text-gradient-gold">BET</span>
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle className="!border-white/25 !text-white/80 hover:!text-gold-300" />
            <Button variant="ghost" size="sm" className="!text-white hover:!bg-white/10" onClick={() => router.push('/login')}>Ingresar</Button>
            <Button variant="gold" size="sm" onClick={() => router.push('/register')}>Crear cuenta</Button>
          </div>
        </div>
      </header>

      {/* ── Hero (dramático en ambos temas) ───────────────────────── */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/messi-bg.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/90 via-brand-900/70 to-bg" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 50% at 50% 35%, rgba(232,185,35,0.12), transparent 60%)' }} />
        <div className="absolute inset-0 bg-dots opacity-30" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-5 pb-24 pt-36 text-center sm:pt-44">
          <motion.span initial="hidden" animate="show" variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold-200 backdrop-blur">
            <Icon name="chip" size={14} /> Economía de fichas reales
          </motion.span>

          <motion.h1 initial="hidden" animate="show" custom={1} variants={fadeUp}
            className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            El casino de los changos,<br />
            <span className="text-gradient-gold">con tus amigos.</span>
          </motion.h1>

          <motion.p initial="hidden" animate="show" custom={2} variants={fadeUp}
            className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Cargá fichas con tu cajero y jugá a la ruleta, blackjack, caballos y más
            en mesas en vivo. Sin vueltas, todo entre changos.
          </motion.p>

          <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp}
            className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button variant="gold" size="lg" fullWidth className="sm:w-auto" rightIcon={<Icon name="arrowRight" size={18} />} onClick={() => router.push('/register')}>
              Crear mi cuenta
            </Button>
            <Button variant="outline" size="lg" fullWidth
              className="sm:w-auto !border-white/40 !bg-white/5 !text-white hover:!border-white hover:!bg-white/10"
              onClick={() => router.push('/login')}>
              Ya tengo cuenta
            </Button>
          </motion.div>

          <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/55">
            <span className="flex items-center gap-1.5"><Icon name="dice" size={14} className="text-gold-400" /> 5 juegos en vivo</span>
            <span className="flex items-center gap-1.5"><Icon name="users" size={14} className="text-gold-400" /> Mesas multijugador</span>
            <span className="flex items-center gap-1.5"><Icon name="shield" size={14} className="text-gold-400" /> Cajeros de confianza</span>
          </motion.div>
        </div>
      </section>

      {/* ── Juegos ────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-5 py-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mb-10 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Cinco formas de <span className="text-gradient-gold">ganar</span>
          </h2>
          <p className="mt-3 text-fg-muted">Elegí tu juego y armá la mesa con los changos.</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g, i) => (
            <motion.div key={g.name} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} custom={i} variants={fadeUp}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-card-hover">
              <div className="relative h-48 w-full overflow-hidden bg-brand-950/30">
                <img
                  src={g.img}
                  alt={g.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/30" />
                {g.soon && (
                  <span className="absolute right-4 top-4 rounded-full bg-gold-500/20 border border-gold-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-300 backdrop-blur-sm">Próximamente</span>
                )}
                {/* Floating Icon Badge */}
                <div className="absolute -bottom-6 left-6 grid h-12 w-12 place-items-center rounded-2xl border border-gold-500/35 bg-surface-2 text-gold-500 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Icon name={g.icon} size={22} />
                </div>
              </div>
              <div className="p-6 pt-8 flex-1 flex flex-col">
                <h3 className="font-display text-xl font-bold text-fg group-hover:text-gold-400 transition-colors duration-300">{g.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted flex-1">{g.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Cómo funciona ─────────────────────────────────────────── */}
      <section className="relative border-y border-line bg-surface-2/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mb-12 text-center">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">¿Cómo <span className="text-gradient-gold">funciona</span>?</h2>
            <p className="mt-3 text-fg-muted">De cero a la mesa en cuatro pasos.</p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} custom={i} variants={fadeUp}
                className="relative rounded-3xl border border-line bg-surface p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold-gradient font-display text-lg font-extrabold text-brand-950 shadow-gold">{s.n}</span>
                  <span className="text-fg-subtle"><Icon name={s.icon} size={22} /></span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-fg">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-3xl px-5 py-24 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 60% at 50% 50%, rgba(192,0,10,0.16), transparent 70%)' }} />
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="relative">
          <h2 className="font-display text-3xl font-extrabold sm:text-5xl">¿Listo para <span className="text-gradient-gold">jugar</span>?</h2>
          <p className="mt-4 text-fg-muted">Creá tu cuenta gratis. Después, tu cajero te activa y te carga las fichas para empezar.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button variant="gold" size="lg" fullWidth className="sm:w-auto" rightIcon={<Icon name="arrowRight" size={18} />} onClick={() => router.push('/register')}>Crear mi cuenta</Button>
            <Button variant="outline" size="lg" fullWidth className="sm:w-auto" onClick={() => router.push('/login')}>Ingresar</Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-fg-muted sm:flex-row">
          <span className="flex items-center gap-2 font-display text-base font-extrabold text-fg">
            <span className="text-gold-500"><Icon name="chip" size={18} /></span>
            CHANGOS<span className="text-gradient-gold">BET</span>
          </span>
          <p>Jugá con responsabilidad · +18 · Entre changos de confianza</p>
          <p>© 2026 CHANGOSBET</p>
        </div>
      </footer>
    </main>
  );
}
