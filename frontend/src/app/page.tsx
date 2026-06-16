'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Static data ───────────────────────────────────────────────── */
const GAMES_DATA = [
  { id: 'roulette',  name: 'Ruleta Europea',      cat: 'mesa',     icon: '🎡', players: 8,
    desc: 'Apostá a números, colores o docenas. La bolita decide tu destino en tiempo real.',
    bg: 'from-red-700 to-red-900' },
  { id: 'football',  name: 'Fútbol Virtual',       cat: 'deportes', icon: '⚽', players: 12,
    desc: 'Partidos simulados con equipos reales. Apostá al resultado: 1X2, BTTS, Over/Under.',
    bg: 'from-rose-700 to-red-800' },
  { id: 'horses',    name: 'Carreras de Caballos', cat: 'deportes', icon: '🏇', players: 6,
    desc: 'Elegí tu caballo y miralo correr en tiempo real junto a todos tus amigos.',
    bg: 'from-red-600 to-rose-900' },
  { id: 'poker',     name: 'Texas Hold\'em',       cat: 'cartas',   icon: '♠️', players: 6,
    desc: 'Poker completo: flop, turn, river y showdown. Estrategia pura con tus amigos.',
    bg: 'from-red-800 to-red-950' },
  { id: 'blackjack', name: 'Blackjack 21',         cat: 'cartas',   icon: '🃏', players: 5,
    desc: 'Llegá a 21 antes que el crupier. Jugá junto a tus amigos en la misma mesa.',
    bg: 'from-rose-800 to-red-900' },
];

const HISTORY_DATA = [
  { player: 'ElChango23',    game: '🎡 Ruleta',    bet: 5_000,  win: 175_000, time: 'hace 2 min',  won: true  },
  { player: 'LaBestia_88',   game: '🃏 Blackjack', bet: 10_000, win: 0,       time: 'hace 5 min',  won: false },
  { player: 'MaestroPoker',  game: '♠️ Poker',     bet: 25_000, win: 75_000,  time: 'hace 8 min',  won: true  },
  { player: 'VaqueroLoco',   game: '🏇 Caballos',  bet: 8_000,  win: 0,       time: 'hace 12 min', won: false },
  { player: 'ElCrack99',     game: '⚽ Fútbol',    bet: 15_000, win: 30_000,  time: 'hace 15 min', won: true  },
  { player: 'LaSorpresa',    game: '🎡 Ruleta',    bet: 1_000,  win: 35_000,  time: 'hace 18 min', won: true  },
  { player: 'Gamblerino',    game: '🃏 Blackjack', bet: 20_000, win: 0,       time: 'hace 22 min', won: false },
  { player: 'ElReyDeOros',   game: '♠️ Poker',     bet: 50_000, win: 200_000, time: 'hace 25 min', won: true  },
];

const LEADERBOARD = [
  { pos: 1, player: 'ElReyDeOros',  balance: '2.4M', badge: '👑' },
  { pos: 2, player: 'MaestroPoker', balance: '1.8M', badge: '🥈' },
  { pos: 3, player: 'ElChango23',   balance: '1.2M', badge: '🥉' },
  { pos: 4, player: 'ElCrack99',    balance: '800K', badge: '' },
  { pos: 5, player: 'LaSorpresa',   balance: '650K', badge: '' },
];

const NAV_LINKS = [
  { label: 'Juegos',         id: 'games'    },
  { label: 'Historial',      id: 'history'  },
  { label: 'Clasificación',  id: 'rank'     },
  { label: 'Torneos',        id: 'banner'   },
];

const FILTER_TABS = [
  { id: 'todos',    label: '🎲 Todos'    },
  { id: 'mesa',     label: '🎡 Mesa'     },
  { id: 'cartas',   label: '🃏 Cartas'   },
  { id: 'deportes', label: '⚽ Deportes' },
];

/* ─── Random particles for hero (stable between renders) ─────────── */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  symbol: ['♠', '♥', '♦', '♣', '🎲', '🃏'][i % 6],
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 100,
  size: 18 + (i % 5) * 8,
  delay: (i % 5) * 0.8,
  duration: 5 + (i % 4) * 2,
}));

/* ═══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [showModal, setShowModal]     = useState(false);
  const [alias, setAlias]             = useState('');
  const [aliasError, setAliasError]   = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [menuOpen, setMenuOpen]       = useState(false);
  const [scrolled, setScrolled]       = useState(false);

  useEffect(() => {
    if (user) router.push('/lobby');
  }, [user, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const openModal = () => {
    setShowModal(true);
    setAlias('');
    setAliasError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const t = alias.trim();
    if (t.length < 2) { setAliasError('Mínimo 2 caracteres'); return; }
    if (t.length > 20) { setAliasError('Máximo 20 caracteres'); return; }
    login(t);
  };

  const filtered = activeFilter === 'todos'
    ? GAMES_DATA
    : GAMES_DATA.filter(g => g.cat === activeFilter);

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>

      {/* ════════════════════ NAVBAR ════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'shadow-lg'
          : ''
      }`}
        style={{
          background: scrolled
            ? 'rgba(100,0,0,0.97)'
            : 'rgba(80,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-2.5 select-none">
            <span className="text-2xl">🃏</span>
            <span className="text-white font-black text-lg tracking-tight leading-none">
              Casino<span className="text-red-300"> de Amigos</span>
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className="text-white/75 hover:text-white text-sm font-semibold transition-colors
                           hover:text-red-200 relative group">
                {item.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-red-300 transition-all group-hover:w-full rounded-full" />
              </button>
            ))}
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={openModal}
              className="px-5 py-2 rounded-xl border-2 border-white/40 text-white text-sm font-bold
                         hover:bg-white/10 hover:border-white/60 transition-all">
              Iniciar Sesión
            </button>
            <button onClick={openModal}
              className="px-5 py-2 rounded-xl bg-white text-red-700 text-sm font-black
                         hover:bg-red-50 transition-all shadow-lg hover:shadow-white/20">
              Registrarse
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-white text-2xl p-1 transition-transform active:scale-90"
            onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="md:hidden overflow-hidden"
              style={{ background: 'rgba(60,0,0,0.98)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map(item => (
                  <button key={item.id} onClick={() => scrollTo(item.id)}
                    className="block w-full text-left py-3 px-3 rounded-xl text-white/80 hover:text-white
                               hover:bg-white/8 text-sm font-semibold transition-all">
                    {item.label}
                  </button>
                ))}
                <div className="flex gap-2 pt-3 border-t border-white/10 mt-2">
                  <button onClick={openModal}
                    className="flex-1 py-2.5 rounded-xl border border-white/40 text-white text-sm font-bold">
                    Iniciar Sesión
                  </button>
                  <button onClick={openModal}
                    className="flex-1 py-2.5 rounded-xl bg-white text-red-700 text-sm font-black">
                    Registrarse
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center
                          overflow-hidden pt-16">

        {/* Messi background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/messi-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 15%',
          }} />

        {/* Capa roja oscura — identidad del casino + legibilidad */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(145deg, rgba(40,0,0,0.86) 0%, rgba(90,0,0,0.78) 40%, rgba(130,0,0,0.72) 65%, rgba(60,0,0,0.88) 100%)',
          }} />

        {/* Viñeta lateral suave para centrar atención */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 85% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
          }} />

        {/* Dot pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }} />

        {/* Radial glow center */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,100,100,0.10) 0%, transparent 70%)',
          }} />

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {PARTICLES.map(p => (
            <motion.div key={p.id}
              className="absolute text-white/[0.07]"
              style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size }}
              animate={{ y: ['-1.5rem', '1.5rem'], rotate: [-8, 8], opacity: [0.04, 0.15, 0.04] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}>
              {p.symbol}
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="relative z-10 text-center px-4 max-w-5xl mx-auto">

          {/* Badge pill */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-sm font-semibold
                       text-white/90 backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            🎲 100% Gratuito &nbsp;·&nbsp; Solo Fichas Virtuales &nbsp;·&nbsp; Sin Riesgo Real
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white
                         leading-[1.05] tracking-tight mb-6"
            style={{ textShadow: '0 4px 50px rgba(0,0,0,0.4)' }}>
            Prueba tu{' '}
            <span style={{
              background: 'linear-gradient(135deg, #ffcdd2, #ff8a80)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(255,150,150,0.4))',
            }}>
              Suerte
            </span>
            <br />entre Amigos
          </h1>

          {/* Subtitle */}
          <p className="text-white/65 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            La plataforma de juegos definitiva. Dinero ficticio ilimitado, diversión infinita.{' '}
            <strong className="text-white/90">¿Podrás liderar el ranking de tu grupo?</strong>
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={openModal}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl text-base sm:text-lg font-black
                         bg-white text-red-700 shadow-2xl hover:bg-red-50 transition-all"
              style={{ boxShadow: '0 8px 40px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.3)' }}>
              🎰 Jugar Ahora — ¡ES GRATIS!
            </motion.button>
            <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => scrollTo('rank')}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl text-base sm:text-lg font-bold
                         border-2 border-white/35 text-white hover:bg-white/10
                         hover:border-white/60 transition-all backdrop-blur-sm">
              🏆 Ver Clasificación
            </motion.button>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {[
              { val: '∞',    label: 'Fichas Virtuales'  },
              { val: '5',    label: 'Juegos Únicos'     },
              { val: '100%', label: 'Gratuito'          },
              { val: '0',    label: 'Riesgo Real'       },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-white">{s.val}</div>
                <div className="text-white/45 text-xs sm:text-sm mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Wave transition */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="w-full h-16 sm:h-20">
            <path d="M0,45 C480,90 960,0 1440,45 L1440,90 L0,90 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ════════════════════ INFO CARDS ════════════════════ */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-red-700 mb-3">
              ¿Por qué Casino de Amigos?
            </h2>
            <p className="text-red-400 text-base sm:text-lg">El único casino donde TODOS ganan diversión</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: '♾️',
                title: 'CRÉDITOS ILIMITADOS',
                desc: 'Nunca te quedás sin fichas. Dinero ficticio infinito para jugar sin límites ni presiones. Recargá cuando quieras.',
                accent: '#c0000a',
              },
              {
                icon: '👥',
                title: 'MESAS PRIVADAS',
                desc: 'Creá tu propia sala de juegos con un código único y jugá exclusivamente con tus amigos. Sin extraños.',
                accent: '#9a0000',
              },
              {
                icon: '🆓',
                title: '100% GRATIS',
                desc: 'Absolutamente cero dinero real involucrado. Solo pura diversión social. Sin pagos, sin trucos, sin sorpresas.',
                accent: '#7f0000',
              },
            ].map((card, i) => (
              <motion.div key={card.title}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="rounded-3xl p-8 text-center cursor-default overflow-hidden relative"
                style={{
                  background: 'white',
                  border: `2px solid ${card.accent}22`,
                  boxShadow: `0 8px 32px ${card.accent}14`,
                }}>
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.06]"
                  style={{ background: card.accent }} />
                <div className="text-6xl mb-5 relative z-10">{card.icon}</div>
                <h3 className="text-xl font-black mb-3 relative z-10" style={{ color: card.accent }}>
                  {card.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm relative z-10">{card.desc}</p>
                <div className="mt-6 h-1 rounded-full opacity-20 relative z-10"
                  style={{ background: card.accent }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ PROMO BANNER ════════════════════ */}
      <section id="banner" className="py-6 px-4"
        style={{ background: 'linear-gradient(135deg, #6b0000 0%, #a50000 50%, #6b0000 100%)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="max-w-6xl mx-auto">
          <div className="rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center
                          justify-between gap-8"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
            }}>

            <div className="text-center md:text-left flex-1">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                <motion.span className="text-4xl" animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>🏆</motion.span>
                <span className="bg-white text-red-700 text-xs font-black px-3 py-1.5 rounded-full
                                 uppercase tracking-widest shadow-lg">
                  Cada Fin de Semana
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
                Torneos de Fin de Semana
              </h2>
              <p className="text-white/65 text-base max-w-lg leading-relaxed">
                Competí con tus amigos en torneos especiales con fichas bonus, clasificaciones
                exclusivas y la gloria eterna del ranking semanal. ¡Que gane el mejor!
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={openModal}
                className="px-8 py-4 rounded-2xl bg-white text-red-700 font-black text-base
                           sm:text-lg whitespace-nowrap hover:bg-red-50 transition-all"
                style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
                🎟️ Obtener Tickets Virtuales
              </motion.button>
              <p className="text-white/40 text-xs">100% gratis · Sin registro real</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════ GAMES ════════════════════ */}
      <section id="games" className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-red-700 mb-3">
              Nuestros Emocionantes Juegos Gratuitos
            </h2>
            <p className="text-red-400 text-base sm:text-lg">5 formas distintas de poner a prueba tu suerte</p>
          </motion.div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {FILTER_TABS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                  activeFilter === f.id
                    ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105 shadow-red-200'
                    : 'bg-white text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Games grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((game, i) => (
                <motion.div key={game.id}
                  layout
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -7 }}
                  className="rounded-3xl overflow-hidden shadow-md hover:shadow-xl
                             hover:shadow-red-100 transition-shadow border-2 border-red-50 group">

                  {/* Card header */}
                  <div className={`bg-gradient-to-br ${game.bg} p-9 text-center relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-[0.08]"
                      style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                      }} />
                    <motion.span className="text-7xl block relative z-10 drop-shadow-lg"
                      whileHover={{ scale: 1.2, rotate: [-3, 3, 0] }}
                      transition={{ duration: 0.4 }}>
                      {game.icon}
                    </motion.span>
                    <div className="mt-3 flex items-center justify-center gap-1.5 relative z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      <span className="text-white/55 text-xs font-semibold uppercase tracking-widest">
                        Hasta {game.players} jugadores
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="bg-white p-5">
                    <h3 className="text-lg font-black text-red-700 mb-2">{game.name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 min-h-[3rem]">{game.desc}</p>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={openModal}
                      className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all
                                 shadow-md hover:shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #9a0000, #c0000a)',
                        boxShadow: '0 4px 14px rgba(192,0,10,0.3)',
                      }}>
                      🎮 Jugar por Fun
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ════════════════════ LEADERBOARD + HISTORY ════════════════════ */}
      <section className="py-20 px-4"
        style={{ background: 'linear-gradient(145deg, #3a0000 0%, #700000 50%, #4a0000 100%)' }}>
        <div className="max-w-6xl mx-auto">

          {/* Section title */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Estadísticas en Vivo</h2>
            <p className="text-white/40">Lo que está pasando ahora mismo en Casino de Amigos</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">

            {/* Leaderboard */}
            <motion.div id="rank" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} className="lg:col-span-2">
              <div className="rounded-3xl p-6 h-full"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(8px)',
                }}>
                <h3 className="text-lg font-black text-white mb-1">🏆 Clasificación de Amigos</h3>
                <p className="text-white/35 text-xs mb-6 uppercase tracking-wider">
                  Compite por la fama virtual semanal
                </p>

                <div className="space-y-2">
                  {LEADERBOARD.map((item, i) => (
                    <motion.div key={item.player}
                      initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                        i === 0
                          ? 'border border-yellow-400/30'
                          : 'hover:bg-white/8'
                      }`}
                      style={{
                        background: i === 0
                          ? 'rgba(255,215,0,0.1)'
                          : 'rgba(255,255,255,0.04)',
                      }}>
                      <span className="text-2xl w-8 text-center flex-shrink-0">
                        {item.badge || <span className="text-white/30 text-sm font-bold">#{item.pos}</span>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-sm truncate">{item.player}</div>
                        <div className="text-white/30 text-xs">fichas virtuales</div>
                      </div>
                      <span className={`font-black text-sm flex-shrink-0 ${
                        i === 0 ? 'text-yellow-300' : 'text-white/75'
                      }`}>
                        ${item.balance}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <button onClick={openModal}
                  className="mt-5 w-full py-3 rounded-xl text-white/60 hover:text-white
                             hover:bg-white/10 text-sm font-semibold transition-all border border-white/15">
                  Ver Tabla Completa →
                </button>
              </div>
            </motion.div>

            {/* History table */}
            <motion.div id="history" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} className="lg:col-span-3">
              <div className="rounded-3xl p-6"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(8px)',
                }}>
                <h3 className="text-lg font-black text-white mb-1">📋 Partidas Recientes</h3>
                <p className="text-white/35 text-xs mb-5 uppercase tracking-wider">Actividad en tiempo real</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Jugador', 'Juego', 'Apuesta (Ficticia)', 'Ganancia', 'Tiempo'].map(h => (
                          <th key={h} className="text-white/35 text-xs uppercase tracking-wider
                                                  pb-3 text-left font-semibold pr-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HISTORY_DATA.map((row, i) => (
                        <motion.tr key={i}
                          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                          viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                          className="border-b border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                          <td className="py-3 pr-3 text-white font-semibold whitespace-nowrap">
                            {row.player}
                          </td>
                          <td className="py-3 pr-3 text-white/65 whitespace-nowrap">{row.game}</td>
                          <td className="py-3 pr-3 text-white/50 whitespace-nowrap">
                            ${row.bet.toLocaleString()}
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                              row.won
                                ? 'text-green-300'
                                : 'text-red-400'
                            }`}
                              style={{
                                background: row.won
                                  ? 'rgba(74,222,128,0.12)'
                                  : 'rgba(248,113,113,0.12)',
                              }}>
                              {row.won ? `+$${row.win.toLocaleString()}` : '— perdida —'}
                            </span>
                          </td>
                          <td className="py-3 text-white/25 text-xs whitespace-nowrap">{row.time}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="py-10 px-4 text-center border-t border-white/8"
        style={{ background: '#280000' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🃏</span>
          <span className="text-white font-black text-lg">Casino de Amigos</span>
        </div>
        <p className="text-white/25 text-sm mb-1">
          Solo dinero ficticio · 0% riesgo real · Hecho para jugar con amigos
        </p>
        <p className="text-white/15 text-xs">
          Sin pagos reales · Sin criptomonedas · Solo diversión social
        </p>
      </footer>

      {/* ════════════════════ LOGIN MODAL ════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>

            <motion.div initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">

              {/* Modal header — Messi background */}
              <div className="relative overflow-hidden" style={{ minHeight: 180 }}>
                {/* Messi foto de fondo */}
                <div className="absolute inset-0"
                  style={{
                    backgroundImage: 'url(/messi-bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 18%',
                  }} />
                {/* Overlay rojo oscuro */}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(160deg, rgba(70,0,0,0.87) 0%, rgba(130,0,0,0.80) 60%, rgba(60,0,0,0.92) 100%)' }} />
                {/* Viñeta inferior para transición suave al blanco */}
                <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(30,0,0,0.6))' }} />

                {/* Close button */}
                <button onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center
                             text-white/70 hover:text-white transition-all text-lg font-bold
                             bg-black/20 hover:bg-black/40 backdrop-blur-sm">
                  ✕
                </button>

                {/* Content */}
                <div className="relative z-10 p-8 pb-6 text-center">
                  <motion.div className="text-6xl mb-3"
                    animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity }}>
                    🎰
                  </motion.div>
                  <h2 className="text-2xl font-black text-white mb-1">¡Entrá al Casino!</h2>
                  <p className="text-white/60 text-sm">Elegí tu alias · 100% gratuito · Sin límites</p>
                </div>
              </div>

              {/* Modal body */}
              <div className="bg-white p-8">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-red-700 mb-2 uppercase tracking-widest">
                      Tu Alias de Jugador
                    </label>
                    <input value={alias}
                      onChange={e => { setAlias(e.target.value); setAliasError(''); }}
                      placeholder="Ej: ElCrack99, LaReina, Gamblerino..."
                      maxLength={20} autoFocus
                      className="w-full px-4 py-3.5 rounded-xl text-gray-800 text-base
                                 focus:outline-none transition-all"
                      style={{
                        border: aliasError ? '2px solid #ef4444' : '2px solid #fecaca',
                        background: '#fff',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#c0000a')}
                      onBlur={e => (e.target.style.borderColor = aliasError ? '#ef4444' : '#fecaca')}
                    />
                    {aliasError && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-1.5 font-semibold">
                        ⚠ {aliasError}
                      </motion.p>
                    )}
                  </div>

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-full py-4 rounded-xl text-white font-black text-base transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #9a0000, #c0000a)',
                      boxShadow: '0 6px 24px rgba(192,0,10,0.4)',
                    }}>
                    🎲 ¡Empezar a Jugar Gratis!
                  </motion.button>
                </form>

                <div className="mt-5 p-4 rounded-2xl"
                  style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
                  <p className="text-red-600 text-sm text-center font-medium">
                    💰 Recibís{' '}
                    <strong className="text-red-700">$100,000 fichas virtuales</strong> al entrar.
                    <br />
                    <span className="text-red-400 text-xs">Si te quedás sin plata, ¡recargás gratis y al instante!</span>
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-2">
                  {[['🎡','Ruleta'],['🃏','Blackjack'],['♠️','Poker'],['🏇','Caballos'],['⚽','Fútbol']].map(([icon, name]) => (
                    <div key={name} className="text-center p-2 rounded-xl" style={{ background: '#fff5f5' }}>
                      <div className="text-xl">{icon}</div>
                      <div className="text-red-400 text-xs mt-0.5 font-semibold">{name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
