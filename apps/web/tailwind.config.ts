import type { Config } from 'tailwindcss';

/**
 * japanese-ma-minimalism Tailwind 配置
 * 约束：无圆角、无阴影、无渐变、单色克制
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
        full: '0', // 强制 0
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        // 巨大显示字体
        'display': ['clamp(3.5rem, 9vw, 9rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.1' }],
      },
      spacing: {
        // 8px 网格 + 慷慨间距
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
