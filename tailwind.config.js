/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'page-bg': 'var(--color-bg, #F7F7F7)',
        'text-main': 'var(--color-text-main, #111111)',
        'text-muted': 'var(--color-text-muted, #888888)',
        'accent': 'var(--color-accent, #0B6B4F)',
        'accent-dark': '#08523C',
        'accent-light': 'var(--color-accent-light, #E8F3EE)',
        'border-ui': 'var(--color-border, #E0E0E0)',
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Anton', 'Impact', 'Montserrat', 'sans-serif'],
      },
      letterSpacing: {
        'widest-editorial': '0.15em',
        'tight-editorial': '-0.03em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(24px, -28px) scale(1.08)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        ring: {
          '0%': { boxShadow: '0 0 0 0 var(--ring-color)' },
          '70%, 100%': { boxShadow: '0 0 0 14px transparent' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 14s ease-in-out infinite',
        shimmer: 'shimmer 5s linear infinite',
        marquee: 'marquee 45s linear infinite',
        ring: 'ring 2.4s ease-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
      },
    },
  },
  plugins: [],
};
