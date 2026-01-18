/**
 * Design Token Mapping Utilities
 *
 * Maps design tokens from @web-loom/design-core to CSS custom properties
 */

import type { DesignTokens } from '../providers/types';

/**
 * Map design tokens to CSS custom properties
 *
 * @param tokens - Design tokens object
 * @param prefix - CSS variable prefix (default: 'ui')
 * @returns Object with CSS variable names as keys and token values as values
 *
 * @example
 * ```ts
 * const cssVars = mapDesignTokensToCSS({
 *   colorPrimary: '#1677ff',
 *   fontSize: '14px'
 * });
 * // Returns: { '--ui-color-primary': '#1677ff', '--ui-font-size': '14px' }
 * ```
 */
export function mapDesignTokensToCSS(tokens: Partial<DesignTokens>, prefix = 'ui'): Record<string, string> {
  const cssVars: Record<string, string> = {};

  Object.entries(tokens).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      const varName = `--${prefix}-${kebabKey}`;
      cssVars[varName] = String(value);
    }
  });

  return cssVars;
}

/**
 * Get CSS variable name for a token key
 *
 * @example
 * ```ts
 * getCSSVarName('colorPrimary') // Returns: '--ui-color-primary'
 * getCSSVarName('buttonHeight', 'wl') // Returns: '--wl-button-height'
 * ```
 */
export function getCSSVarName(key: string, prefix = 'ui'): string {
  const kebabKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return `--${prefix}-${kebabKey}`;
}

/**
 * Get CSS variable reference for use in stylesheets
 *
 * @example
 * ```ts
 * getCSSVarRef('colorPrimary') // Returns: 'var(--ui-color-primary)'
 * getCSSVarRef('colorPrimary', '#1677ff') // Returns: 'var(--ui-color-primary, #1677ff)'
 * ```
 */
export function getCSSVarRef(key: string, fallback?: string, prefix = 'ui'): string {
  const varName = getCSSVarName(key, prefix);
  return fallback ? `var(${varName}, ${fallback})` : `var(${varName})`;
}

/**
 * Merge multiple token objects with proper override behavior
 *
 * @param defaultTokens - Base/default tokens
 * @param customTokens - Custom tokens to merge
 * @returns Merged tokens object
 *
 * @example
 * ```ts
 * const merged = mergeTokens(
 *   { colorPrimary: '#1677ff', fontSize: '14px' },
 *   { colorPrimary: '#ff0000' }
 * );
 * // Returns: { colorPrimary: '#ff0000', fontSize: '14px' }
 * ```
 */
export function mergeTokens<T extends Record<string, any>>(defaultTokens: T, customTokens?: Partial<T>): T {
  if (!customTokens) {
    return defaultTokens;
  }

  return {
    ...defaultTokens,
    ...customTokens,
  };
}

/**
 * Extract tokens for a specific component
 *
 * @param allTokens - All design tokens
 * @param componentName - Component name (e.g., 'Button', 'Input')
 * @returns Component-specific tokens or empty object
 */
export function getComponentTokens(allTokens: any, componentName: string): Record<string, any> {
  if (!allTokens?.components?.[componentName]) {
    return {};
  }
  return allTokens.components[componentName];
}

/**
 * Create scoped CSS variables for a component
 *
 * @param componentName - Component name
 * @param tokens - Component tokens
 * @param prefix - CSS variable prefix
 * @returns CSS variables scoped to component
 *
 * @example
 * ```ts
 * const vars = createComponentVars('Button', {
 *   height: '32px',
 *   paddingX: '16px'
 * });
 * // Returns: { '--ui-button-height': '32px', '--ui-button-padding-x': '16px' }
 * ```
 */
export function createComponentVars(
  componentName: string,
  tokens: Record<string, any>,
  prefix = 'ui',
): Record<string, string> {
  const cssVars: Record<string, string> = {};
  const componentPrefix = componentName.toLowerCase();

  Object.entries(tokens).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const kebabKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      const varName = `--${prefix}-${componentPrefix}-${kebabKey}`;
      cssVars[varName] = String(value);
    }
  });

  return cssVars;
}
