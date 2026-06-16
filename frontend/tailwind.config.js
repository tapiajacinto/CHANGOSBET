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
          chip: {
            white: '#f8f9fa',
            red: '#e63946',
            blue: '#4361ee',
            green: '#2dc653',
            black: '#1a1a2e',
            purple: '#7b2d8b',
          },
        },
      },
      fontFamily: {
        casino: ['Georgia', 'serif'],
        mono: ['Consolas', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'deal-card': 'dealCard 0.3s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'flip-card': 'flipCard 0.5s ease-in-out forwards',
        'horse-run': 'horseRun linear forwards',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { textShadow: '0 0 10px #ffd700' },
          '50%': { textShadow: '0 0 25px #ffd700, 0 0 50px #ffec6e' },
        },
        dealCard: {
          from: { transform: 'translateY(-100px) rotate(-10deg)', opacity: '0' },
          to: { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(-20px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        flipCard: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        horseRun: {
          from: { left: '0%' },
          to: { left: 'calc(100% - 60px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px #ffd700' },
          '50%': { boxShadow: '0 0 30px #ffd700, 0 0 60px #ffec6e' },
        },
      },
      backgroundImage: {
        'felt-pattern': "radial-gradient(circle at center, #1b4332 0%, #0d3b2e 70%, #091f18 100%)",
        'gold-gradient': 'linear-gradient(135deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)',
        'casino-gradient': 'linear-gradient(180deg, #0a0a14 0%, #12122a 100%)',
      },
    },
  },
  plugins: [],
};
