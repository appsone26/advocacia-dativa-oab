import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Dark mode via classe 'dark' no elemento <html>
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === CORES OFICIAIS ADVOCACIA DATIVA ===
        dativa: {
          // Azul principal
          900: '#0f1f33',
          800: '#1e3a5f',  // Principal
          700: '#2d5986',  // Médio
          600: '#3a6fa3',
          500: '#4d87c0',
          400: '#7aadd4',
          300: '#a8cae4',
          200: '#d0e5f4',
          100: '#e8f2fa',
          50:  '#f4f8fd',
        },
        ouro: {
          // Dourado OAB
          900: '#5c460f',
          800: '#8a6a17',
          700: '#a8811c',
          600: '#c9a227',  // Principal
          500: '#d4b540',
          400: '#dfc85a',
          300: '#e8d887',
          200: '#f1e8b3',
          100: '#f8f3d8',
          50:  '#fcfaee',
        },
      },
      // Cores semânticas reusando o design system
      backgroundColor: {
        page: '#f0f4f8',          // Fundo geral das telas
        'page-dark': '#0f1824',   // Fundo dark mode
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(30, 58, 95, 0.08)',
        'card-hover': '0 4px 16px rgba(30, 58, 95, 0.14)',
        modal: '0 8px 40px rgba(30, 58, 95, 0.20)',
      },
      borderRadius: {
        card: '12px',
        modal: '16px',
        btn: '8px',
      },
    },
  },
  plugins: [],
}

export default config
