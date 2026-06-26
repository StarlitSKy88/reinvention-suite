import type { Config } from 'tailwindcss';

/**
 * 设计规范：黑底白字红字点缀
 * 调色板：纯黑 / 纯白 / 鲜红
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: 'clamp(1.5rem, 5vw, 6rem)',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        subtle: 'hsl(var(--subtle))',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        full: '0',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        display: ['Source Han Serif SC', 'Songti SC', 'STSong', 'Georgia', 'serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': ['clamp(3.5rem, 9vw, 9rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.1' }],
      },
      spacing: {
        'section': 'clamp(6rem, 10vw, 16rem)',
        'gutter': 'clamp(1.5rem, 5vw, 6rem)',
      },
      letterSpacing: {
        'meta': '0.15em',
        'editorial': '0.08em',
      },
      maxWidth: {
        'reading': '58ch',
        'prose': '65ch',
      },
      transitionTimingFunction: {
        'ma': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        '600': '600ms',
        '800': '800ms',
      },
    },
  },
  plugins: [],
};

export default config;
