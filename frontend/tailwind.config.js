/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        sessionWarnGlow: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(127, 29, 29, 0.45)',
            borderColor: 'rgba(185, 28, 28, 0.55)',
            backgroundColor: 'rgba(69, 10, 10, 0.55)',
          },
          '50%': {
            boxShadow: '0 0 14px 3px rgba(234, 88, 12, 0.4)',
            borderColor: 'rgba(251, 146, 60, 0.65)',
            backgroundColor: 'rgba(124, 45, 18, 0.65)',
          },
        },
        sessionOkGlow: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(2, 44, 34, 0.55)',
            borderColor: 'rgba(6, 78, 59, 0.85)',
            backgroundColor: 'rgba(2, 26, 24, 0.75)',
          },
          '50%': {
            boxShadow: '0 0 16px 4px rgba(13, 148, 136, 0.35)',
            borderColor: 'rgba(15, 118, 110, 0.9)',
            backgroundColor: 'rgba(4, 47, 46, 0.85)',
          },
        },
      },
      animation: {
        'session-warn': 'sessionWarnGlow 2s ease-in-out infinite',
        'session-ok': 'sessionOkGlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
