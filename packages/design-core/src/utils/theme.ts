// packages/design-core/src/utils/theme.ts

import type { DesignTokens, TokenValue } from './tokens.d';
// No need to import getAllTokens if setTheme is simplified
// import { getAllTokens } from './tokens';
import { pathToCssVar } from './cssVariables'; // For converting paths to CSS var names

/**
 * Defines the structure of a Theme object, which includes a name
 * and a set of token overrides.
 */
export interface Theme {
  name: string;
  /**
   * Token overrides for this theme. The structure should mirror `DesignTokens`.
   * For example: `{ colors: { background: { default: '#000000' } } }`
   * would override the token at `colors.background.default`.
   */
  tokens: Partial<DesignTokens>;
}

// Used to store the name of the theme set by `setTheme` or `applyTheme`,
// primarily as a fallback for `getCurrentTheme` in non-DOM environments.
let S_currentThemeName: string | null = null;

// Prefix for dynamically created style elements to manage theme-specific styles.
const THEME_STYLE_ELEMENT_ID_PREFIX = 'dynamic-theme-styles-';

/**
 * Creates a new theme object. This object can then be used with `applyTheme`.
 *
 * @param name The name of the theme (e.g., "dark", "highContrast"). This name will be
 *             used for the `data-theme` attribute if applied via `applyTheme` not to root.
 * @param overrides A `Partial<DesignTokens>` object containing the specific token values
 *                  that this theme should use, overriding base token values.
 * @returns The theme object.
 * @example
 * const darkTheme = createTheme("dark", {
 *   colors: {
 *     background: { page: "#121212" },
 *     text: { primary: "#E0E0E0" }
 *   }
 * });
 */
export function createTheme(name: string, overrides: Partial<DesignTokens>): Theme {
  return {
    name,
    tokens: overrides,
  };
}

/**
 * Internal helper: Recursively flattens theme token overrides into a map of CSS variables.
 * @param tokenOverrides A partial DesignTokens object.
 * @param currentPath Current path during recursion.
 * @param cssVarsMap Accumulator for CSS variables.
 * @returns A flat map where keys are CSS variable names and values are token values.
 */
function flattenThemeOverridesToCssVars(
  tokenOverrides: Partial<DesignTokens> | any, // Can be any part of the DesignTokens structure
  currentPath: string = '',
  cssVarsMap: Record<string, TokenValue> = {},
): Record<string, TokenValue> {
  for (const key in tokenOverrides) {
    if (Object.prototype.hasOwnProperty.call(tokenOverrides, key)) {
      const value = tokenOverrides[key];
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !('value' in value && Object.keys(value).length === 1)
      ) {
        // It's a nested group, recurse, unless it's a token object like { value: "..." } which should be treated as a leaf.
        // A simple heuristic: if it has a 'value' key and only that key, it's likely a token object not fully processed.
        // However, design tokens should be simple values after processing by `tokens.ts`.
        flattenThemeOverridesToCssVars(value, newPath, cssVarsMap);
      } else if (value !== undefined && value !== null) {
        // It's a leaf node (a token value)
        const finalValue = typeof value === 'object' && value !== null && 'value' in value ? value.value : value;
        cssVarsMap[pathToCssVar(newPath)] = finalValue as TokenValue;
      }
    }
  }
  return cssVarsMap;
}

/**
 * Dynamically applies a theme by generating CSS variables from its token overrides
 * and injecting them into a `<style>` tag in the document's head.
 * This method is suitable for themes managed entirely by JavaScript.
 *
 * @param theme The `Theme` object (created by `createTheme`) to apply.
 * @param applyToRoot If `true`, variables are applied to the `:root` selector, effectively
 *                    changing the base theme for all elements. If `false` (default),
 *                    variables are applied to a `[data-theme="theme-name"]` selector,
 *                    allowing this theme to be activated by setting the `data-theme` attribute
 *                    (e.g., using the `setTheme` function).
 * @example
 * // Assuming `darkTheme` is a Theme object.
 * await applyTheme(darkTheme); // Injects styles for [data-theme="dark"]
 * setTheme("dark"); // Activates the dark theme.
 *
 * // To change base values for all themes:
 * // await applyTheme(coreOverrideTheme, true);
 */
export async function applyTheme(theme: Theme, applyToRoot: boolean = false): Promise<void> {
  if (typeof document === 'undefined') {
    console.warn(
      "[applyTheme] Cannot apply theme: 'document' is not available in this environment. Theme styles not injected.",
    );
    return;
  }

  const selector = applyToRoot ? ':root' : `[data-theme="${theme.name}"]`;
  const styleElementId = `${THEME_STYLE_ELEMENT_ID_PREFIX}${theme.name}`;

  const cssVarsMap = flattenThemeOverridesToCssVars(theme.tokens);

  if (Object.keys(cssVarsMap).length === 0) {
    console.warn(
      `[applyTheme] Theme "${theme.name}" has no token overrides to apply. No styles injected for selector "${selector}".`,
    );
    return;
  }

  let cssString = `${selector} {\n`;
  for (const varName in cssVarsMap) {
    if (Object.prototype.hasOwnProperty.call(cssVarsMap, varName)) {
      cssString += `  ${varName}: ${cssVarsMap[varName]};\n`;
    }
  }
  cssString += `}\n`;

  let styleElement = document.getElementById(styleElementId) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleElementId;
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = cssString;

  // If applying theme-specific styles (not to root), and also setting this as the active theme.
  // Note: `setTheme` is the more direct way to activate a theme via data-attribute.
  // This ensures that if applyTheme is used for a specific theme, that theme becomes active.
  if (!applyToRoot) {
    // document.documentElement.setAttribute('data-theme', theme.name); // This is handled by setTheme
    S_currentThemeName = theme.name; // Update internal tracker
  } else {
    // If applying to root, it might imply resetting or choosing a new base theme.
    // We don't set data-theme here as :root applies globally.
    // If this root application implies a specific theme (e.g. "light" is the root theme),
    // then `setTheme("light")` should be called.
  }
  console.log(`[applyTheme] Theme "${theme.name}" styles generated and applied to selector "${selector}".`);
}

/**
 * Sets the active theme for the document by setting the `data-theme` attribute
 * on the `<html>` element. This is the primary method for switching themes
 * when CSS rules for `[data-theme="theme-name"]` are already defined (either
 * manually in CSS files or injected via `applyTheme`).
 *
 * @param themeName The name of the theme to activate (e.g., "light", "dark").
 *                  This name should correspond to a `data-theme` attribute selector
 *                  for which styles have been defined.
 * @example
 * // Assuming CSS for [data-theme="dark"] is loaded:
 * setTheme("dark"); // Switches the document to use dark theme styles.
 */
export function setTheme(themeName: string): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeName);
    S_currentThemeName = themeName;
    console.log(`[setTheme] Document theme switched to "${themeName}" by setting data-theme attribute.`);
  } else {
    S_currentThemeName = themeName; // Store for non-DOM environments if needed
    console.warn(
      `[setTheme] 'document' is not available. Theme set to "${themeName}" internally, but data-theme attribute not applied.`,
    );
  }
}

/**
 * Gets the name of the currently active theme.
 * In a browser environment, it reads the `data-theme` attribute from the `<html>` element.
 * Falls back to the last known theme name set by `setTheme` or `applyTheme`
 * if the attribute is not set or in non-DOM environments.
 *
 * @returns The current theme name string, or `null` if no theme is determinable.
 * @example
 * const current = getCurrentTheme();
 * if (current) {
 *   console.log("Current theme:", current);
 * }
 */
export function getCurrentTheme(): string | null {
  if (typeof document !== 'undefined') {
    const attributeTheme = document.documentElement.getAttribute('data-theme');
    if (attributeTheme) return attributeTheme;
  }
  return S_currentThemeName; // Fallback to internally tracked name
}
