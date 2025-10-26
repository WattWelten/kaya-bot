/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Landkreis Oldenburg CI-Farben
        'lc-primary': {
          25: '#F0FDFB',
          50: '#EBF8F7',
          100: '#D1F2EB',
          200: '#BFE3DF',
          300: '#7DD3C4',
          400: '#4ECDC4',
          500: '#26A69A',
          600: '#0F766E',
          700: '#0A5A55',
          800: '#064E4B',
          900: '#043C39',
          950: '#022B27',
        },
        'lc-accent': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        'lc-neutral': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1F2937',
          900: '#0F172A',
        },
        // Landkreis Oldenburg Wappen-Farben (Gold & Rot)
        'lc-gold': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        'lc-red': {
          50: '#FEF2F2',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 6px 24px rgba(0,0,0,0.06)',
        'medium': '0 8px 32px rgba(0,0,0,0.08)',
        'strong': '0 12px 48px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
