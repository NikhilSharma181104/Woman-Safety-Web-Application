/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Soft Guardian Design System ──
        // Light, approachable, trustworthy aesthetic
        // All colors tested for WCAG AA compliance
        
        // Brand colors
        brand: {
          primary: '#FFC0CB',      // Light baby pink
          secondary: '#FFB6C1',    // Slightly darker pink
          light: '#FFE4E9',        // Very light pink tint
          dark: '#FF69B4',         // Hot pink for hover
        },
        
        // Semantic colors
        emergency: {
          DEFAULT: '#EF4444',      // Red - danger (active emergency)
          light: '#FEE2E2',        // Light red background
          dark: '#DC2626',         // Darker red for emphasis
        },
        success: {
          DEFAULT: '#10B981',      // Green - completed/safe
          light: '#D1FAE5',        // Light green background
          dark: '#059669',         // Darker green
        },
        warning: {
          DEFAULT: '#F59E0B',      // Amber - caution
          light: '#FEF3C7',        // Light amber background
          dark: '#D97706',         // Darker amber
        },
        info: {
          DEFAULT: '#3B82F6',      // Blue - informational
          light: '#DBEAFE',        // Light blue background
          dark: '#2563EB',         // Darker blue
        },
        
        // Neutral palette
        slate: {
          50: '#F8F9FE',           // Primary background (soft lavender-white)
          100: '#F1F3F9',          // Secondary background
          200: '#E2E8F0',          // Borders
          300: '#CBD5E1',          // Disabled states
          400: '#94A3B8',          // Tertiary text
          500: '#64748B',          // Secondary text
          600: '#475569',          // Primary text (lighter)
          700: '#334155',          // Primary text
          800: '#1E293B',          // Headings
          900: '#0F172A',          // Darkest text
        },
        
        // Legacy colors (for gradual migration)
        coral: '#EC4899',          // Mapped to brand secondary
        navy: {
          DEFAULT: '#1E293B',      // Mapped to slate-800
          dark: '#0F172A',         // Mapped to slate-900
        },
      },
      
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      
      fontSize: {
        // Simplified type scale
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      
      fontWeight: {
        // Simplified weight scale: 400, 600, 700
        normal: '400',
        semibold: '600',
        bold: '700',
      },
      
      spacing: {
        // 4px base grid
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
      },
      
      borderRadius: {
        'xl': '1rem',     // 16px
        '2xl': '1.5rem',  // 24px
      },
      
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'soft-md': '0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.1)',
        'glow-pink': '0 0 24px rgba(255, 192, 203, 0.4)',
        'glow-red': '0 0 32px rgba(239, 68, 68, 0.4)',
      },
      
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
