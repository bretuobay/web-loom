/**
 * Theme Context
 *
 * Provides theme context for the application
 */

import { createContext } from 'react';
import type { ThemeContextValue } from './types';
import { defaultLightTheme } from './defaultTheme';

/**
 * Theme context
 */
export const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultLightTheme,
  mode: 'light',
  setTheme: () => {
    console.warn('ThemeContext: setTheme called outside of ThemeProvider');
  },
  setMode: () => {
    console.warn('ThemeContext: setMode called outside of ThemeProvider');
  },
  cssVarPrefix: 'ui',
});

ThemeContext.displayName = 'ThemeContext';
