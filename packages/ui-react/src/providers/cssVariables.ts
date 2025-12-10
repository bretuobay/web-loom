/**
 * CSS Variable Injection Utilities
 *
 * Converts theme tokens to CSS custom properties and injects them into the DOM
 */

import type { ThemeConfig } from './types';

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Convert theme token key to CSS variable name
 * Example: colorPrimary -> --ui-color-primary
 */
export function tokenToCSSVar(key: string, prefix = 'ui'): string {
  const kebabKey = camelToKebab(key);
  return `--${prefix}-${kebabKey}`;
}

/**
 * Convert theme tokens to CSS variable declarations
 */
export function themeToCSSVars(theme: ThemeConfig, prefix = 'ui'): Record<string, string> {
  const cssVars: Record<string, string> = {};

  // Process design tokens
  if (theme.token) {
    Object.entries(theme.token).forEach(([key, value]) => {
      const varName = tokenToCSSVar(key, prefix);
      cssVars[varName] = String(value);
    });
  }

  // Process component tokens
  if (theme.components) {
    Object.entries(theme.components).forEach(([componentName, componentTokens]) => {
      if (componentTokens) {
        Object.entries(componentTokens).forEach(([key, value]) => {
          const varName = `--${prefix}-${camelToKebab(componentName)}-${camelToKebab(key)}`;
          cssVars[varName] = String(value);
        });
      }
    });
  }

  return cssVars;
}

/**
 * Inject CSS variables into a container element
 */
export function injectCSSVars(
  container: HTMLElement,
  cssVars: Record<string, string>
): void {
  Object.entries(cssVars).forEach(([key, value]) => {
    container.style.setProperty(key, value);
  });
}

/**
 * Remove CSS variables from a container element
 */
export function removeCSSVars(
  container: HTMLElement,
  cssVars: Record<string, string>
): void {
  Object.keys(cssVars).forEach((key) => {
    container.style.removeProperty(key);
  });
}

/**
 * Get a CSS variable value from an element
 */
export function getCSSVar(element: HTMLElement, varName: string): string {
  return getComputedStyle(element).getPropertyValue(varName).trim();
}

/**
 * Check if dark mode is preferred by system
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  // Use addEventListener if available, otherwise use deprecated addListener
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
}

/**
 * Generate CSS variables stylesheet as a string
 * Useful for SSR or static generation
 */
export function generateCSSVarsStylesheet(
  theme: ThemeConfig,
  prefix = 'ui',
  selector = ':root'
): string {
  const cssVars = themeToCSSVars(theme, prefix);

  const declarations = Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `${selector} {\n${declarations}\n}`;
}

/**
 * Create a style element with CSS variables
 */
export function createStyleElement(
  theme: ThemeConfig,
  prefix = 'ui',
  id = 'ui-react-theme'
): HTMLStyleElement {
  const style = document.createElement('style');
  style.id = id;
  style.textContent = generateCSSVarsStylesheet(theme, prefix);
  return style;
}

/**
 * Update or create theme style element
 */
export function updateThemeStyle(
  theme: ThemeConfig,
  prefix = 'ui',
  id = 'ui-react-theme'
): void {
  if (typeof document === 'undefined') return;

  let styleElement = document.getElementById(id) as HTMLStyleElement | null;

  if (!styleElement) {
    styleElement = createStyleElement(theme, prefix, id);
    document.head.appendChild(styleElement);
  } else {
    styleElement.textContent = generateCSSVarsStylesheet(theme, prefix);
  }
}
