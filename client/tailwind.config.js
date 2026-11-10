/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sakanly: {
          primary: '#0F766E',      // Brand Primary Deep Teal
          'primary-hover': '#115E59',
          'primary-light': '#F0FDFA',
          dark: '#0B3D3A',         // Brand Dark
          bg: '#F8FAFC',           // Neutral Background
          accent: '#F59E0B',       // Warm Amber Accent
          'accent-hover': '#D97706',
          text: '#1E293B',         // Deep Slate Main Text
          muted: '#64748B',        // Muted Slate
          verified: '#10B981',     // Verified Emerald Green
          surface: '#FFFFFF',      // Pure White Card Surface
          border: '#E2E8F0',       // Subtle Border
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px -2px rgba(15, 118, 110, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 12px 28px -4px rgba(15, 118, 110, 0.16), 0 8px 12px -3px rgba(0, 0, 0, 0.06)',
        'modal': '0 25px 50px -12px rgba(11, 61, 58, 0.25)',
      }
    },
  },
  plugins: [],
}
