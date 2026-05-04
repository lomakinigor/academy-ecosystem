import type { Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';

const preset: Omit<Config, 'content'> = {
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '4rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
    extend: {
      colors: {
        brand: {
          primary: '#1A1A2E',
          accent: '#C9A84C',
          warm: '#F5F0E8',
          earth: '#8B6914',
        },
        success: '#2D6A4F',
        warning: '#E9C46A',
        destructive: '#9B2335',
        muted: '#E8E3DA',

        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',

        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['"Space Grotesk"', '"Inter"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        lg: '20px',
        md: '16px',
        sm: '12px',
        xs: '8px',
      },
      boxShadow: {
        'soft-sm': '0 1px 2px rgba(26, 26, 46, 0.05), 0 1px 3px rgba(26, 26, 46, 0.06)',
        'soft-md': '0 4px 12px rgba(26, 26, 46, 0.06), 0 2px 4px rgba(26, 26, 46, 0.04)',
        'soft-lg': '0 10px 30px rgba(26, 26, 46, 0.08), 0 4px 8px rgba(26, 26, 46, 0.04)',
        'gold': '0 0 0 1px rgba(201, 168, 76, 0.25), 0 8px 24px rgba(201, 168, 76, 0.18)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 250ms ease-out',
        'accordion-up': 'accordion-up 250ms ease-out',
        'fade-in': 'fade-in 300ms ease-out',
      },
      transitionTimingFunction: {
        'academy': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
    },
  },
  plugins: [animatePlugin],
};

export default preset;
