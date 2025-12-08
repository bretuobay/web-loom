/**
 * Provider components for @repo/ui-react
 *
 * Providers handle context and global state for UI components
 */

// Theme providers
export { ThemeProvider } from './ThemeProvider';
export { ConfigProvider } from './ConfigProvider';
export { ThemeContext } from './ThemeContext';

// Theme utilities
export { defaultLightTheme, defaultDarkTheme, mergeTheme, getThemeByMode } from './defaultTheme';
export {
  themeToCSSVars,
  injectCSSVars,
  removeCSSVars,
  getCSSVar,
  tokenToCSSVar,
  prefersDarkMode,
  watchSystemTheme,
  generateCSSVarsStylesheet,
  createStyleElement,
  updateThemeStyle,
} from './cssVariables';

// Types
export type {
  ThemeConfig,
  ThemeMode,
  ThemeContextValue,
  ThemeProviderProps,
  ConfigProviderProps,
  DesignTokens,
  ColorTokens,
  SpacingTokens,
  TypographyTokens,
  RadiusTokens,
  ShadowTokens,
  ZIndexTokens,
  TransitionTokens,
  ComponentTokens,
} from './types';
