import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class', // Ativa o dark mode manualmente via classe
  theme: {
    extend: {
      colors: {
        bg:       '#FDF6F8',
        surface:  '#FCEFF2',
        ink:      { DEFAULT: '#4A2330', soft: '#7D5A66', faint: '#A88C95' },
        line:     { DEFAULT: '#F2DDE2', strong: '#D4AEB8' },
        petrol:   { DEFAULT: '#C85A7E', deep: '#A83C5E', soft: '#E08EA8' },
        terra:    '#D97757',
        amber:    '#D9A05B',
        olive:    '#7A8B5A',
        
        // Cores do Dark Mode
        dark: {
          bg:      '#1A1214', // Fundo escuro ameixa
          surface: '#261A1D', // Cards escuros
          line:    '#3D2B30',
          ink:     '#FDF6F8', // Texto claro
          inkSoft: '#C2AAB1',
        }
      },
      fontFamily: {
        sans:  ['var(--font-plex-sans)',  'system-ui', 'sans-serif'],
        serif: ['var(--font-plex-serif)', 'Georgia',   'serif'],
        logo:  ['var(--font-plex-serif-logo)', 'Georgia', 'serif'],
        mono:  ['var(--font-plex-mono)',  'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.08em' }],
      },
    },
  },
} satisfies Config;
