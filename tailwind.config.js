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
    },
  },
  plugins: [],
};
