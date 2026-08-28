/** @type {import('tailwindcss').Config} */
export default {
  // 'class' strategy: dark mode is toggled by adding/removing the
  // "dark" class on the <html> element, controlled by our ThemeContext.
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom palette used across both light and dark themes.
        // Usage example: bg-surface dark:bg-surface-dark
        background: {
          DEFAULT: '#f8fafc',   // light mode page background
          dark: '#0b0f19',      // dark mode page background
        },
        surface: {
          DEFAULT: '#ffffff',   // light mode card/section background
          dark: '#111827',      // dark mode card/section background
        },
        surfaceAlt: {
          DEFAULT: '#f1f5f9',   // light mode alternate section background
          dark: '#0f172a',      // dark mode alternate section background
        },
        textPrimary: {
          DEFAULT: '#0f172a',   // light mode primary text
          dark: '#f1f5f9',      // dark mode primary text
        },
        textSecondary: {
          DEFAULT: '#475569',   // light mode secondary text
          dark: '#94a3b8',      // dark mode secondary text
        },
        border: {
          DEFAULT: '#e2e8f0',   // light mode border
          dark: '#1f2937',      // dark mode border
        },
        accent: {
          DEFAULT: '#6366f1',   // primary accent (indigo)
          hover: '#4f46e5',     // accent hover state
          light: '#818cf8',     // lighter accent for dark mode contrast
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
