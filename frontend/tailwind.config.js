/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Rojo Argentino Pro: identidad roja, pulida a premium ──
        brand: {
          50:  '#fff1f1', 100: '#ffdfdf', 200: '#ffc5c5', 300: '#ff9b9b',
          400: '#f96060', 500: '#ed2f2f', 600: '#d11414', 700: '#c0000a',
          800: '#9a0000', 900: '#7f0000', 950: '#450000',
        },
        gold: {
          50:  '#fffbeb', 100: '#fff3c4', 200: '#ffe788', 300: '#ffd84d',
          400: '#ffd24a', 500: '#e8b923', 600: '#c8930a', 700: '#a06c0a',
          800: '#845410', 900: '#714411',
        },
        // ── Win-green vivo (positivos / ganancias / "en vivo") ──
        win: {
          50:  '#e7fcef', 100: '#c5f7d8', 200: '#8fefb4', 300: '#52e489',
          400: '#34e673', 500: '#1fd65f', 600: '#16a34a', 700: '#0f7a37',
          800: '#0c5f2c', 900: '#0a4d25',
        },
        // Superficies oscuras "mesa" para pantallas de juego
        ink: {
          50:  '#f6f6f8', 800: '#1b1820', 900: '#161219', 950: '#121016',
        },
        felt: { DEFAULT: '#0d3b2e', light: '#15543f', dark: '#082a20' },

        // ── Tokens semánticos (light/dark vía CSS vars) ──
        bg:          'rgb(var(--bg) / <alpha-value>)',
        surface:     'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        line:        'rgb(var(--line) / <alpha-value>)',
        'line-2':    'rgb(var(--line-2) / <alpha-value>)',
        fg: {
          DEFAULT: 'rgb(var(--fg) / <alpha-value>)',
          muted:   'rgb(var(--fg-muted) / <alpha-value>)',
          subtle:  'rgb(var(--fg-subtle) / <alpha-value>)',
        },

        // ── Legacy (juegos hasta su rediseño) ──
        casino: {
          bg: '#0a0a14', surface: '#12122a', card: '#1a1a3a', border: '#2a2a5a',
          green: '#1b4332', 'green-light': '#2d6a4f', felt: '#0d3b2e',
          gold: '#ffd700', 'gold-light': '#ffec6e', 'gold-dark': '#b8860b', red: '#e63946',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        casino: ['Georgia', 'serif'],
      },
      boxShadow: {
        // Glows de acción (suaves)
        'brand':    '0 12px 36px -12px rgba(237,47,47,0.5)',
        'brand-lg': '0 24px 60px -16px rgba(237,47,47,0.55)',
        'gold':     '0 10px 30px -14px rgba(232,185,35,0.45)',
        'win':      '0 12px 36px -12px rgba(31,214,95,0.5)',
        // Cards: profundidad neutra que funciona en light y dark
        'card':       '0 1px 2px rgba(0,0,0,0.06), 0 8px 28px -16px rgba(0,0,0,0.45)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.08), 0 22px 48px -20px rgba(0,0,0,0.55)',
        'inset-top':  'inset 0 1px 0 rgba(255,255,255,0.06)',
        // Anillos premium
        'ring-gold':  '0 0 0 1px rgba(232,185,35,0.28)',
        'ring-brand': '0 0 0 1px rgba(237,47,47,0.35)',
        'ring-win':   '0 0 0 1px rgba(31,214,95,0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #9a0000 0%, #c0000a 48%, #ed2f2f 100%)',
        'brand-deep':     'linear-gradient(160deg, #2a0006 0%, #6e0008 48%, #9a0000 100%)',
        'brand-sheen':    'linear-gradient(135deg, #d11414 0%, #ed2f2f 45%, #ff6b5a 100%)',
        'gold-gradient':  'linear-gradient(135deg, #c8930a 0%, #e8b923 45%, #ffe9a8 100%)',
        'win-gradient':   'linear-gradient(135deg, #0f7a37 0%, #16a34a 45%, #1fd65f 100%)',
        'felt-radial':    'radial-gradient(ellipse at center, #15543f 0%, #0d3b2e 55%, #082a20 100%)',
        'dots':           'radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)',
        'card-shine':     'linear-gradient(180deg, rgba(255,255,255,0.07), transparent 42%)',
        'tile-fade':      'linear-gradient(to top, rgba(10,7,12,0.92) 6%, rgba(10,7,12,0.45) 46%, rgba(10,7,12,0.08) 100%)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem', '5xl': '2.5rem' },
      keyframes: {
        'fade-up':    { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in':    { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in':     { '0%': { opacity: '0', transform: 'scale(0.92)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'shimmer':    { '100%': { transform: 'translateX(100%)' } },
        'pulse-gold': { '0%,100%': { boxShadow: '0 0 0 0 rgba(232,185,35,0.35)' }, '50%': { boxShadow: '0 0 22px 3px rgba(232,185,35,0.22)' } },
        'pulse-win':  { '0%,100%': { boxShadow: '0 0 0 0 rgba(31,214,95,0.5)' }, '50%': { boxShadow: '0 0 0 6px rgba(31,214,95,0)' } },
        'spin-slow':  { to: { transform: 'rotate(360deg)' } },
        'float':      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'sheen':      { '0%': { transform: 'translateX(-120%) skewX(-12deg)' }, '60%,100%': { transform: 'translateX(220%) skewX(-12deg)' } },
        'draw':       { from: { strokeDashoffset: '1000' }, to: { strokeDashoffset: '0' } },
      },
      animation: {
        'fade-up':    'fade-up 0.5s ease-out forwards',
        'fade-in':    'fade-in 0.4s ease-out forwards',
        'pop-in':     'pop-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'shimmer':    'shimmer 1.6s infinite',
        'pulse-gold': 'pulse-gold 2.4s ease-in-out infinite',
        'pulse-win':  'pulse-win 1.8s ease-in-out infinite',
        'spin-slow':  'spin-slow 8s linear infinite',
        'float':      'float 4s ease-in-out infinite',
        'sheen':      'sheen 2.6s ease-in-out infinite',
        'draw':       'draw 1s ease-out forwards',
      },
    },
  },
  plugins: [],
};
