/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          dark: '#07080a',
          card: 'rgba(30, 26, 22, 0.75)',
          velvet: '#6b1d2f',
          gold: '#d4af37',
        }
      }
    },
  },
  plugins: [],
}
