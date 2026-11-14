import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
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
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
} satisfies Config;
