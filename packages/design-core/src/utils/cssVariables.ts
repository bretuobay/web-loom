// packages/design-core/src/utils/cssVariables.ts

import { DesignTokens, TokenValue, TokenCategory, TokenGroup } from './tokens.d';
import { getAllTokens, getTokenValue } from './tokens';

/**
 * Converts a token path string (e.g., "colors.primary.main") into a CSS variable name
 * (e.g., "--colors-primary-main").
 *
 * @param path The token path string.
 * @returns The corresponding CSS variable name.
 * @example
 * const cssVarName = pathToCssVar("colors.brand.primary"); // "--colors-brand-primary"
 */
export function pathToCssVar(path: string): string {
  return `--${path.replace(/\./g, '-')}`;
}

/**
 * Converts a token path string into a CSS variable reference string `var(--name)`.
 * This function does not check if the token or CSS variable exists.
 *
 * @param path The token path string (e.g., "colors.primary.main").
 * @returns The CSS variable reference (e.g., "var(--colors-primary-main)").
 * @example
 * const cssVarRef = getTokenVar("colors.brand.primary"); // "var(--colors-brand-primary)"
 */
export function getTokenVar(path: string): string {
  return `var(${pathToCssVar(path)})`;
}

/**
 * Checks if a token exists for the given path and, if so, returns its CSS variable reference string `var(--name)`.
 * If the token does not exist, it logs a warning and returns `undefined`.
 *
 * @param path The token path (e.g., "colors.base.primary").
 * @returns A promise that resolves to the CSS variable string (e.g., "var(--colors-base-primary)") if the token exists, otherwise `undefined`.
 * @example
 * async function getSafeCssVar() {
 *   const primaryColorVar = await getSafeTokenVar("colors.brand.primary");
 *   if (primaryColorVar) {
 *     // Use primaryColorVar, e.g., element.style.color = primaryColorVar;
 *   }
 *   const nonExistentVar = await getSafeTokenVar("colors.brand.undefined"); // undefined, logs warning
 * }
 */
export async function getSafeTokenVar(path: string): Promise<string | undefined> {
  const value = await getTokenValue(path); // Check if the token path is valid
  if (value === undefined) {
    // Warning already logged by getTokenValue if path is invalid
    // console.warn(`Token not found for path: ${path} when trying to generate CSS variable string.`);
    return undefined;
  }
  return getTokenVar(path); // Return "var(--css-variable-name)"
}

/**
 * Internal helper: Flattens a nested token structure into a flat map of CSS custom properties.
 * @param tokens The design tokens object or a part of it.
 * @param currentPath The current path prefix for recursion.
 * @param cssVarsMap The map being built.
 * @returns A flat object where keys are CSS variable names (e.g., "--colors-primary-main")
 *          and values are the corresponding token values.
 */
function flattenTokensToCssVarsRecursive(
  tokens: DesignTokens | TokenCategory | TokenGroup,
  currentPath: string = '',
  cssVarsMap: Record<string, TokenValue> = {},
): Record<string, TokenValue> {
  for (const key in tokens) {
    // Ensure 'key' is a property of 'tokens' and not from prototype chain for safety,
    // though typically not an issue with well-structured JSON/objects.
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      const value = (tokens as any)[key];
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // It's a nested group, recurse
        flattenTokensToCssVarsRecursive(value, newPath, cssVarsMap);
      } else if (value !== undefined && value !== null) {
        // It's a leaf node (a token value)
        cssVarsMap[pathToCssVar(newPath)] = value as TokenValue;
      }
    }
  }
  return cssVarsMap;
}

/**
 * Asynchronously loads all design tokens, flattens them, and generates a map of
 * CSS custom properties (e.g., { "--colors-base-primary": "#1E40AF" }).
 * This map can be used, for example, to set multiple CSS variables on an element's style property.
 *
 * @returns A promise that resolves to a Record<string, TokenValue> representing the CSS variables map.
 * @example
 * async function applyVariablesToElement() {
 *   const styleMap = await generateCssVariablesMap();
 *   // const element = document.getElementById('my-element');
 *   // if (element) {
 *   //   for (const varName in styleMap) {
 *   //     element.style.setProperty(varName, styleMap[varName].toString());
 *   //   }
 *   // }
 * }
 */
export async function generateCssVariablesMap(): Promise<Record<string, TokenValue>> {
  const allTokens = await getAllTokens();
  return flattenTokensToCssVarsRecursive(allTokens);
}

/**
 * Generates a string of CSS custom property definitions from all design tokens,
 * ready to be injected into a stylesheet or a `<style>` tag.
 *
 * @param selector The CSS selector under which variables will be defined (default: ":root").
 * @returns A promise that resolves to a string containing CSS variable definitions.
 * @example
 * async function injectGlobalCssVariables() {
 *   const cssString = await generateCssVariablesString(':root');
 *   // const styleTag = document.createElement('style');
 *   // styleTag.id = 'design-tokens-variables';
 *   // styleTag.textContent = cssString;
 *   // document.head.appendChild(styleTag);
 *   // console.log(cssString);
 *   // Output might be:
 *   // :root {
 *   //   --colors-base-primary: #1E40AF;
 *   //   --spacing-1: 4px;
 *   //   ...
 *   // }
 * }
 */
export async function generateCssVariablesString(selector: string = ':root'): Promise<string> {
  const cssVarsMap = await generateCssVariablesMap();
  if (Object.keys(cssVarsMap).length === 0) {
    return `${selector} {}\n`; // Return empty block if no variables
  }
  let cssString = `${selector} {\n`;
  for (const varName in cssVarsMap) {
    if (Object.prototype.hasOwnProperty.call(cssVarsMap, varName)) {
      cssString += `  ${varName}: ${cssVarsMap[varName]};\n`;
    }
  }
  cssString += `}\n`;
  return cssString;
}
