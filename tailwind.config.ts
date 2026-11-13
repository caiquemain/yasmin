import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fundos em rosa muito clarinho
        bg:       '#FDF6F8', 
        surface:  '#FCEFF2',
        // Textos em rosa escuro / vinho
        ink:      { DEFAULT: '#4A2330', soft: '#7D5A66', faint: '#A88C95' },
        line:     { DEFAULT: '#F2DDE2', strong: '#D4AEB8' },
        // O Rosa Principal (Botões, Sidebar, Destaques)
        petrol:   { DEFAULT: '#C85A7E', deep: '#A83C5E', soft: '#E08EA8' },
        // Outros destaques
        terra:    '#D97757',
        amber:    '#D9A05B',
        olive:    '#7A8B5A',
      },
      fontFamily: {
        sans:  ['var(--font-plex-sans)',  'system-ui', 'sans-serif'],
        serif: ['var(--font-plex-serif)', 'Georgia',   'serif'],
        mono:  ['var(--font-plex-mono)',  'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.08em' }],
      },
    },
  },
} satisfies Config;
