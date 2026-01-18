/**
 * ThemeProvider Component
 *
 * Provides theme configuration and CSS variable injection
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ThemeMode, ThemeConfig } from './types';
import type { ThemeProviderProps } from './types';
import { ThemeContext } from './ThemeContext';
import { defaultLightTheme, defaultDarkTheme, mergeTheme, getThemeByMode } from './defaultTheme';
import { injectCSSVars, themeToCSSVars, watchSystemTheme } from './cssVariables';

/**
 * ThemeProvider component
 *
 * Provides theme configuration to all child components and injects CSS variables
 *
 * @example
 * ```tsx
 * <ThemeProvider theme={customTheme} mode="light">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  theme: initialTheme,
  mode: initialMode = 'light',
  cssVarPrefix = 'ui',
  container,
}: ThemeProviderProps) {
  // State
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [customTheme, setCustomTheme] = useState<Partial<ThemeConfig> | undefined>(initialTheme);

  // Compute final theme based on mode and custom theme
  const theme = useMemo(() => {
    const baseTheme = getThemeByMode(mode);
    return customTheme ? mergeTheme(baseTheme, customTheme) : baseTheme;
  }, [mode, customTheme]);

  // Set theme callback
  const setTheme = useCallback((newTheme: Partial<ThemeConfig>) => {
    setCustomTheme((prev) => ({
      token: {
        ...prev?.token,
        ...newTheme.token,
      },
      components: {
        ...prev?.components,
        ...newTheme.components,
      },
    }));
  }, []);

  // Set mode callback
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  // Inject CSS variables when theme changes
  useEffect(() => {
    const targetContainer = container || document.documentElement;
    const cssVars = themeToCSSVars(theme, cssVarPrefix);

    // Inject CSS variables
    injectCSSVars(targetContainer, cssVars);

    // Add data attribute for theme mode
    targetContainer.setAttribute('data-theme', mode === 'auto' ? 'auto' : mode);

    // Cleanup function
    return () => {
      // Note: We don't remove CSS vars on unmount as they might be used by other components
      // Only remove the data attribute
      targetContainer.removeAttribute('data-theme');
    };
  }, [theme, cssVarPrefix, container, mode]);

  // Watch for system theme changes when mode is 'auto'
  useEffect(() => {
    if (mode !== 'auto') return;

    const cleanup = watchSystemTheme((isDark) => {
      // Update data attribute to reflect actual theme
      const targetContainer = container || document.documentElement;
      targetContainer.setAttribute('data-theme', isDark ? 'dark' : 'light');

      // Re-inject CSS variables with the new theme
      const newTheme = isDark ? defaultDarkTheme : defaultLightTheme;
      const mergedTheme = customTheme ? mergeTheme(newTheme, customTheme) : newTheme;
      const cssVars = themeToCSSVars(mergedTheme, cssVarPrefix);
      injectCSSVars(targetContainer, cssVars);
    });

    return cleanup;
  }, [mode, customTheme, cssVarPrefix, container]);

  // Context value
  const contextValue = useMemo(
    () => ({
      theme,
      mode,
      setTheme,
      setMode,
      cssVarPrefix,
    }),
    [theme, mode, setTheme, setMode, cssVarPrefix],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

ThemeProvider.displayName = 'ThemeProvider';
