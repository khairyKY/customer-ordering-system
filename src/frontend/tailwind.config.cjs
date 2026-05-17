/** @type {import('tailwindcss').Config} */

// ============================================================
// Dev-Cosmic Design System — Tailwind Token Registry
// Extracted from stitch_terminal_hardware_store Stitch export
// Standardized: 2026-05-17
// ============================================================

module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── Color Tokens ────────────────────────────────────────
      colors: {
        // Backgrounds
        'background':                  '#0D0D0D',
        'surface':                     '#131313',
        'surface-dim':                 '#0D0D0D',
        'surface-bright':              '#1A1A1A',
        'surface-container-lowest':    '#0D0D0D',
        'surface-container-low':       '#131313',
        'surface-container':           '#131313',
        'surface-container-high':      '#242424',
        'surface-container-highest':   '#1A1A1A',
        'surface-variant':             '#1A1A1A',
        'surface-tint':                '#7ad0ff',

        // Text / On-surfaces
        'on-background':               '#e5e2e1',
        'on-surface':                  '#e5e2e1',
        'on-surface-variant':          '#bcc8d1',
        'inverse-surface':             '#e5e2e1',
        'inverse-on-surface':          '#313030',

        // Primary — Neon Cyan
        'primary':                     '#8fd6ff',
        'primary-container':           '#00bfff',   // accent neon cyan
        'primary-fixed':               '#c3e8ff',
        'primary-fixed-dim':           '#7ad0ff',
        'on-primary':                  '#003549',
        'on-primary-container':        '#004a65',
        'on-primary-fixed':            '#001e2c',
        'on-primary-fixed-variant':    '#004c69',
        'inverse-primary':             '#00668a',

        // Secondary — Neon Purple
        'secondary':                   '#d2bbff',
        'secondary-container':         '#6001d1',
        'secondary-fixed':             '#eaddff',
        'secondary-fixed-dim':         '#d2bbff',
        'on-secondary':                '#3f008e',
        'on-secondary-container':      '#c9aeff',
        'on-secondary-fixed':          '#25005a',
        'on-secondary-fixed-variant':  '#5a00c6',

        // Tertiary — Neon Green
        'tertiary':                    '#53e97d',
        'tertiary-container':          '#2ecc64',
        'tertiary-fixed':              '#6bff8f',
        'tertiary-fixed-dim':          '#4ae176',
        'on-tertiary':                 '#003915',
        'on-tertiary-container':       '#005020',
        'on-tertiary-fixed':           '#002109',
        'on-tertiary-fixed-variant':   '#005321',

        // Error
        'error':                       '#ffb4ab',
        'error-container':             '#93000a',
        'on-error':                    '#690005',
        'on-error-container':          '#ffdad6',

        // Borders / Outlines
        'outline':                     '#87929b',
        'outline-variant':             '#242424',

        // Semantic Accent Aliases (direct hex — for raw className usage)
        'accent-blue':                 '#00BFFF',
        'accent-green':                '#22C55E',
        'accent-amber':                '#F59E0B',
        'accent-red':                  '#EF4444',

        // Legacy aliases used in Stitch HTML
        'border-dark':                 '#242424',
        'surface-dark':                '#131313',
        'text-muted':                  '#999999',
      },

      // ── Border Radius ────────────────────────────────────────
      // Dev-Cosmic uses ZERO border-radius everywhere (terminal/CLI aesthetic)
      borderRadius: {
        DEFAULT: '0px',
        sm:      '0px',
        md:      '0px',
        lg:      '0px',
        xl:      '0px',
        '2xl':   '0px',
        full:    '9999px', // pills only when explicitly used
      },

      // ── Spacing Scale ────────────────────────────────────────
      spacing: {
        'base':              '4px',
        'unit-1':            '4px',
        'unit-2':            '8px',
        'unit-4':            '16px',
        'unit-6':            '24px',
        'unit-8':            '32px',
        'unit-12':           '48px',
        'margin':            '24px',
        'gutter':            '16px',
        'section_padding_v': '48px',
      },

      // ── Typography ────────────────────────────────────────────
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
        sans:  ['Inter', 'sans-serif'],
      },

      fontSize: {
        'headline-lg': ['32px', { lineHeight: '1.2',  letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.2',  fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg':     ['16px', { lineHeight: '1.6',  fontWeight: '400' }],
        'body-md':     ['14px', { lineHeight: '1.6',  fontWeight: '400' }],
        'label-md':    ['12px', { lineHeight: '1.0',  fontWeight: '500' }],
        'label-xs':    ['11px', { lineHeight: '1.0',  fontWeight: '500' }],
        'code-snippet':['13px', { lineHeight: '1.5',  fontWeight: '400' }],
      },

      // ── Keyframes ─────────────────────────────────────────────
      keyframes: {
        drift: {
          from: { transform: 'translateY(0)' },
          to:   { transform: 'translateY(-100vh)' },
        },
      },
      animation: {
        drift: 'drift linear infinite',
      },
    },
  },
  plugins: [],
};
