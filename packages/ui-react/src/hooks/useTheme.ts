/**
 * useTheme Hook
 *
 * Provides access to theme context and utilities
 */

import { useContext, useMemo } from 'react';
import { ThemeContext } from '../providers/ThemeContext';
import type { ThemeContextValue } from '../providers/types';
import { tokenToCSSVar } from '../providers/cssVariables';

/**
 * Hook to access theme context
 *
 * @returns Theme context value with theme, mode, and setters
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, mode, setMode } = useTheme();
 *
 *   return (
 *     <div>
 *       <p>Current mode: {mode}</p>
 *       <button onClick={() => setMode('dark')}>
 *         Switch to Dark
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Hook to get a specific theme token
 *
 * @param tokenKey - The token key to retrieve
 * @returns The token value or undefined
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const primaryColor = useThemeToken('colorPrimary');
 *
 *   return <div style={{ color: primaryColor }}>Styled text</div>;
 * }
 * ```
 */
export function useThemeToken(tokenKey: string): string | number | undefined {
  const { theme } = useTheme();
  return theme.token[tokenKey as keyof typeof theme.token];
}

/**
 * Hook to get CSS variable name for a token
 *
 * @param tokenKey - The token key
 * @returns The CSS variable name (e.g., --ui-color-primary)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const primaryColorVar = useThemeCSSVar('colorPrimary');
 *
 *   return (
 *     <div style={{ color: `var(${primaryColorVar})` }}>
 *       Styled with CSS variable
 *     </div>
 *   );
 * }
 * ```
 */
export function useThemeCSSVar(tokenKey: string): string {
  const { cssVarPrefix } = useTheme();
  return useMemo(() => tokenToCSSVar(tokenKey, cssVarPrefix), [tokenKey, cssVarPrefix]);
}

/**
 * Hook to check if dark mode is active
 *
 * @returns true if dark mode is active
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDark = useIsDarkMode();
 *
 *   return (
 *     <div>
 *       {isDark ? <MoonIcon /> : <SunIcon />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsDarkMode(): boolean {
  const { mode } = useTheme();

  return useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;

    // Auto mode - check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  }, [mode]);
}

/**
 * Hook to toggle between light and dark mode
 *
 * @returns Toggle function
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const toggleTheme = useToggleTheme();
 *   const isDark = useIsDarkMode();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       {isDark ? 'Light Mode' : 'Dark Mode'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useToggleTheme(): () => void {
  const { mode, setMode } = useTheme();

  return useMemo(
    () => () => {
      if (mode === 'light') {
        setMode('dark');
      } else if (mode === 'dark') {
        setMode('light');
      } else {
        // Auto mode - toggle based on current system preference
        if (typeof window !== 'undefined' && window.matchMedia) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setMode(prefersDark ? 'light' : 'dark');
        } else {
          setMode('light');
        }
      }
    },
    [mode, setMode],
  );
}
