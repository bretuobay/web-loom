/**
 * ConfigProvider Component
 *
 * Top-level provider that wraps ThemeProvider and other configuration providers
 */

import type { ConfigProviderProps } from './types';
import { ThemeProvider } from './ThemeProvider';

/**
 * ConfigProvider component
 *
 * Provides global configuration including theme, locale, and direction
 *
 * @example
 * ```tsx
 * <ConfigProvider
 *   theme={customTheme}
 *   mode="dark"
 *   locale="en-US"
 *   direction="ltr"
 * >
 *   <App />
 * </ConfigProvider>
 * ```
 */
export function ConfigProvider({
  children,
  theme,
  mode = 'light',
  cssVarPrefix = 'ui',
  locale = 'en-US',
  direction = 'ltr',
}: ConfigProviderProps) {
  // Set direction on document element
  if (typeof document !== 'undefined') {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }

  return (
    <ThemeProvider theme={theme} mode={mode} cssVarPrefix={cssVarPrefix}>
      {children}
    </ThemeProvider>
  );
}

ConfigProvider.displayName = 'ConfigProvider';
