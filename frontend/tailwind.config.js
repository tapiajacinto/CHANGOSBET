/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Rojo Argentino Pro: identidad roja, pulida a premium ──
        brand: {
          50:  '#fff1f1',
          100: '#ffdfdf',
          200: '#ffc5c5',
          300: '#ff9b9b',
          400: '#f96060',
          500: '#ed2f2f',
          600: '#d11414',
          700: '#c0000a', // primary
          800: '#9a0000',
          900: '#7f0000', // deep
          950: '#450000',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fff3c4',
          200: '#ffe788',
          300: '#ffd84d',
          400: '#facc15',
          500: '#e8b923', // accent premium
          600: '#c8930a',
          700: '#a06c0a',
          800: '#845410',
          900: '#714411',
        },
        // Superficies oscuras "mesa" para pantallas de juego
        ink: {
          50:  '#f6f6f8',
          800: '#1a1018',
          900: '#140a10',
          950: '#0c0608',
        },
        felt: {
          DEFAULT: '#0d3b2e',
          light: '#15543f',
          dark: '#082a20',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#fff8f6',
        },
        // ── Legacy (compatibilidad con los juegos hasta su rediseño) ──
        casino: {
          bg: '#0a0a14',
          surface: '#12122a',
          card: '#1a1a3a',
          border: '#2a2a5a',
          green: '#1b4332',
          'green-light': '#2d6a4f',
          felt: '#0d3b2e',
          gold: '#ffd700',
          'gold-light': '#ffec6e',
          'gold-dark': '#b8860b',
          red: '#e63946',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        casino: ['Georgia', 'serif'],
      },
      boxShadow: {
        'brand':    '0 10px 30px -8px rgba(192,0,10,0.35)',
        'brand-lg': '0 20px 50px -12px rgba(192,0,10,0.45)',
        'gold':     '0 10px 30px -8px rgba(232,185,35,0.45)',
        'card':     '0 4px 24px rgba(127,0,0,0.08)',
        'card-hover': '0 12px 40px rgba(127,0,0,0.16)',
        'inset-top':  'inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      backgroundImage: {
        'brand-gradient':  'linear-gradient(135deg, #9a0000 0%, #c0000a 50%, #ed2f2f 100%)',
        'brand-deep':      'linear-gradient(160deg, #450000 0%, #7f0000 45%, #9a0000 100%)',
        'gold-gradient':   'linear-gradient(135deg, #c8930a 0%, #e8b923 45%, #ffe788 100%)',
        'felt-radial':     'radial-gradient(ellipse at center, #15543f 0%, #0d3b2e 55%, #082a20 100%)',
        'dots':            'radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up':   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pop-in':    { '0%': { opacity: '0', transform: 'scale(0.92)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'shimmer':   { '100%': { transform: 'translateX(100%)' } },
        'pulse-gold':{ '0%,100%': { boxShadow: '0 0 0 0 rgba(232,185,35,0.5)' }, '50%': { boxShadow: '0 0 24px 4px rgba(232,185,35,0.35)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'float':     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        'fade-up':   'fade-up 0.5s ease-out forwards',
        'pop-in':    'pop-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'shimmer':   'shimmer 1.6s infinite',
        'pulse-gold':'pulse-gold 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
        'float':     'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
