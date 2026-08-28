import { createContext, useContext, useEffect, useState } from 'react';

// Key used to persist the user's chosen theme in localStorage.
const STORAGE_KEY = 'portfolio-theme';

// Create the context that will hold theme state and the toggle function.
const ThemeContext = createContext(undefined);

/**
 * Reads the initial theme in this priority order:
 * 1. A previously saved value in localStorage (user's explicit choice).
 * 2. The operating system / browser color scheme preference.
 * 3. Falls back to "light" if neither is available (e.g. server-side).
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  const prefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * ThemeProvider wraps the whole app and exposes the current theme
 * plus a function to toggle it. It also keeps the <html> element's
 * "dark" class and localStorage in sync with the current state.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Whenever the theme changes, update the <html> class (Tailwind's
  // dark mode selector strategy) and persist the choice.
  useEffect(() => {
    const root = window.document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Custom hook for consuming the theme context.
 * Throws a clear error if used outside of ThemeProvider, which makes
 * misuse easy to catch during development.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
