// packages/design-core/src/utils/cssVariables.ts

import { DesignTokens, TokenValue, TokenCategory, TokenGroup } from './tokens.d';
import { getAllTokens, getTokenValue } from './tokens'; // Assuming this is the processed token getter

/**
 * Generates a CSS variable name from a token path.
 * Example: `colors.primary.main` becomes `--colors-primary-main`.
 *
 * @param path The token path string (e.g., "colors.primary.main").
 * @returns The CSS variable name string.
 */
export function pathToCssVar(path: string): string {
  return `--${path.replace(/\./g, '-')}`;
}

/**
 * Resolves a token path to its CSS variable string `var(--name)`.
 * This function does not check if the token or variable exists.
 *
 * @param path The token path string (e.g., "colors.primary.main").
 * @returns The CSS variable reference (e.g., "var(--colors-primary-main)").
 */
export function getTokenVar(path: string): string {
  return `var(${pathToCssVar(path)})`;
}

/**
 * Retrieves the actual value of a token and returns its CSS variable representation.
 * This is useful if you want to apply a token that might be a direct value or a CSS var.
 * For now, it primarily focuses on generating the var string.
 *
 * @param path The token path (e.g., "colors.base.primary").
 * @returns A promise that resolves to the CSS variable string like "var(--colors-base-primary)".
 */
export async function getResolvedTokenVar(path: string): Promise<string | undefined> {
  const value = await getTokenValue(path);
  if (value === undefined) {
    console.warn(`Token not found for path: ${path} when trying to generate CSS variable.`);
    return undefined;
  }
  // Even if we have the value, the goal is to return the CSS variable string.
  return getTokenVar(path);
}

/**
 * Flattens the token structure and generates a map of CSS custom properties.
 *
 * @param tokens The design tokens object.
 * @param currentPath Internal: The current path prefix for recursion.
 * @param cssVarsMap Internal: The map being built.
 * @returns A flat object where keys are CSS variable names (e.g., "--colors-primary-main")
 *          and values are the corresponding token values.
 */
function flattenTokensToCssVars(
  tokens: DesignTokens | TokenCategory | TokenGroup,
  currentPath: string = '',
  cssVarsMap: Record<string, TokenValue> = {}
): Record<string, TokenValue> {
  for (const key in tokens) {
    const value = (tokens as any)[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // It's a nested group, recurse
      flattenTokensToCssVars(value, newPath, cssVarsMap);
    } else if (value !== undefined && value !== null) {
      // It's a leaf node (a token value)
      cssVarsMap[pathToCssVar(newPath)] = value as TokenValue;
    }
  }
  return cssVarsMap;
}

/**
 * Asynchronously loads all tokens, flattens them, and generates a map of
 * CSS custom properties (e.g., { "--colors-base-primary": "#1E40AF" }).
 * This map can then be used to inject CSS variables into the document.
 *
 * @returns A promise that resolves to a Record<string, TokenValue> representing the CSS variables.
 */
export async function generateCssVariablesMap(): Promise<Record<string, TokenValue>> {
  const allTokens = await getAllTokens(); // Gets the fully processed tokens
  return flattenTokensToCssVars(allTokens);
}

/**
 * Generates a string of CSS custom properties to be injected into a stylesheet or style tag.
 *
 * @param selector The CSS selector under which variables will be defined (e.g., ":root").
 * @returns A promise that resolves to a string containing CSS variable definitions.
 */
export async function generateCssVariablesString(selector: string = ':root'): Promise<string> {
  const cssVarsMap = await generateCssVariablesMap();
  let cssString = `${selector} {\n`;
  for (const varName in cssVarsMap) {
    cssString += `  ${varName}: ${cssVarsMap[varName]};\n`;
  }
  cssString += `}\n`;
  return cssString;
}

// Example Usage:
//
// import { getTokenVar, generateCssVariablesString, pathToCssVar } from './cssVariables';
//
// // Get a specific CSS variable reference
// const primaryColorVar = getTokenVar('colors.base.primary'); // "var(--colors-base-primary)"
// console.log(primaryColorVar);
//
// // Generate CSS variables string for :root
// generateCssVariablesString(':root').then(css => {
//   console.log(css);
//   /*
//   :root {
//     --colors-base-primary: #1E40AF;
//     --colors-base-secondary: #64748B;
//     ...
//     --spacing-0: 0px;
//     --spacing-1: 4px;
//     ...
//   }
//   */
//
//   // This string can be injected into a <style> tag in the document head.
//   // const styleTag = document.createElement('style');
//   // styleTag.textContent = css;
//   // document.head.appendChild(styleTag);
// });

// // Get a path to a css var
// const primaryColorPath = pathToCssVar('colors.base.primary'); // "--colors-base-primary"
// console.log(primaryColorPath);
