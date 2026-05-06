/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        sm:   'calc(var(--radius) - 8px)',   /* 8px  */
        md:   'calc(var(--radius) - 4px)',   /* 12px */
        lg:   'var(--radius)',               /* 16px */
        xl:   'calc(var(--radius) + 4px)',   /* 20px */
        '2xl':'calc(var(--radius) + 8px)',   /* 24px */
        '3xl':'calc(var(--radius) + 16px)',  /* 32px */
      },
      colors: {
        background:  'rgb(var(--background))',
        foreground:  'rgb(var(--foreground))',
        card: {
          DEFAULT:    'rgb(var(--card))',
          foreground: 'rgb(var(--card-foreground))',
          elevated:   'rgb(var(--card-elevated))',
        },
        popover: {
          DEFAULT:    'rgb(var(--popover))',
          foreground: 'rgb(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'rgb(var(--primary))',
          foreground: 'rgb(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'rgb(var(--secondary))',
          foreground: 'rgb(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'rgb(var(--muted))',
          foreground: 'rgb(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'rgb(var(--accent))',
          foreground: 'rgb(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'rgb(var(--destructive))',
          foreground: 'rgb(var(--destructive-foreground))',
        },
        border:  'rgba(255,255,255,0.06)',
        input:   'rgb(var(--input))',
        ring:    'rgb(var(--ring))',
        success: 'rgb(var(--success))',
        warning: 'rgb(var(--warning))',
        chart: {
          '1': 'rgb(var(--chart-1))',
          '2': 'rgb(var(--chart-2))',
          '3': 'rgb(var(--chart-3))',
          '4': 'rgb(var(--chart-4))',
          '5': 'rgb(var(--chart-5))',
        },
        sidebar: {
          DEFAULT:              'rgb(var(--sidebar-background))',
          foreground:           'rgb(var(--sidebar-foreground))',
          primary:              'rgb(var(--sidebar-primary))',
          'primary-foreground': 'rgb(var(--sidebar-primary-foreground))',
          accent:               'rgb(var(--sidebar-accent))',
          'accent-foreground':  'rgb(var(--sidebar-accent-foreground))',
          border:               'rgba(255,255,255,0.04)',
          ring:                 'rgb(var(--sidebar-ring))',
        },
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px -2px rgba(59,130,246,0.3)' },
          '50%':       { boxShadow: '0 0 28px -2px rgba(59,130,246,0.6)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'pulse-glow':     'pulse-glow 2.5s ease-in-out infinite',
        'shimmer':        'shimmer 2.5s linear infinite',
        'float':          'float 3s ease-in-out infinite',
      },
      boxShadow: {
        'card':       '0 1px 4px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)',
        'glow-sm':    '0 0 16px -4px rgba(59,130,246,0.3)',
        'glow-md':    '0 0 32px -6px rgba(59,130,246,0.4)',
        'luxury':     '0 8px 40px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    'glass-card', 'glow-primary', 'glow-accent', 'glow-sm', 'card-hover',
    'progress-animated', 'gradient-text', 'accent-text', 'stat-number',
    'fade-up', 'fade-up-delay-1', 'fade-up-delay-2', 'fade-up-delay-3', 'fade-up-delay-4',
    'badge-glow', 'sidebar-active-dot', 'section-bg', 'luxury-divider', 'skeleton-dark',
  ],
}
