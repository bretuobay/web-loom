// packages/design-core/src/utils/theme.ts

import { DesignTokens } from './tokens.d';
import { getAllTokens } from './tokens'; // To access the base tokens
import { generateCssVariablesString } from './cssVariables'; // To apply themed variables

export interface Theme {
  name: string;
  tokens: Partial<DesignTokens>; // Theme can override parts of DesignTokens
}

// Store the current theme name.
let currentThemeName: string | null = null;
const THEME_STYLE_ELEMENT_ID = 'dynamic-theme-styles';

/**
 * Creates a new theme object.
 * A theme consists of a name and a set of token overrides.
 *
 * @param name The name of the theme (e.g., "dark", "highContrast").
 * @param overrides A partial DesignTokens object containing the specific tokens
 *                  that this theme changes.
 * @returns The theme object.
 */
export function createTheme(name: string, overrides: Partial<DesignTokens>): Theme {
  return {
    name,
    tokens: overrides,
  };
}

/**
 * Applies a theme by generating its CSS variables and injecting them into the document.
 * It can either apply variables to the :root or a theme-specific class/attribute.
 *
 * @param theme The theme object to apply.
 * @param applyToRoot If true, variables are applied to :root. If false,
 *                    they are applied to `[data-theme="theme-name"]`.
 *                    Defaults to false.
 */
export async function applyTheme(theme: Theme, applyToRoot: boolean = false): Promise<void> {
  let themeTokens = theme.tokens;

  // If the theme is not applied to root, we might want to layer it over base tokens.
  // For this version, we assume theme.tokens contains all necessary definitions for the theme.
  // A more advanced version could merge with base tokens before generating variables.

  const selector = applyToRoot ? ':root' : `[data-theme="${theme.name}"]`;

  // We need a way to flatten these theme-specific tokens similar to generateCssVariablesString,
  // but using the theme's token values.
  // Let's define a helper for that, or adapt generateCssVariablesString if possible.

  // Re-using the logic from generateCssVariablesString but with specific tokens
  function flattenThemeTokensToCssVars(
    tokens: Partial<DesignTokens>,
    currentPath: string = '',
    cssVarsMap: Record<string, any> = {}
  ): Record<string, any> {
    for (const key in tokens) {
      const value = (tokens as any)[key];
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !('value' in value)) { // Check if it's a group and not a token object like {value: ...}
        flattenThemeTokensToCssVars(value, newPath, cssVarsMap);
      } else {
        // If it's a token object like { value: "..." }, extract the value.
        // Otherwise, use the value directly.
        const tokenValue = (typeof value === 'object' && value !== null && 'value' in value) ? value.value : value;
        cssVarsMap[`--${newPath.replace(/\./g, '-')}`] = tokenValue;
      }
    }
    return cssVarsMap;
  }

  const cssVarsMap = flattenThemeTokensToCssVars(themeTokens);

  let cssString = `${selector} {\n`;
  for (const varName in cssVarsMap) {
    cssString += `  ${varName}: ${cssVarsMap[varName]};\n`;
  }
  cssString += `}\n`;

  // Inject or update the theme style element
  let styleElement = document.getElementById(THEME_STYLE_ELEMENT_ID);
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = THEME_STYLE_ELEMENT_ID;
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = cssString; // Replace content with the new theme

  // Update document attribute if not applying to root (for global theme switching)
  if (!applyToRoot) {
    document.documentElement.setAttribute('data-theme', theme.name);
  }
  currentThemeName = theme.name;
  console.log(`Theme "${theme.name}" applied.`);
}

/**
 * Sets the theme for the entire document by applying its tokens and
 * setting the `data-theme` attribute on the <html> element.
 *
 * @param themeName The name of the theme to set (e.g., "light", "dark").
 *                  This function will look for pre-defined theme tokens.
 *                  For this example, we'll use the "themed" section of the base tokens.
 */
export async function setTheme(themeName: 'light' | 'dark' | 'high-contrast' | string): Promise<void> {
  const allTokens = await getAllTokens();

  if (allTokens.colors && (allTokens.colors as any).themed && (allTokens.colors as any).themed[themeName]) {
    const themeSpecificTokens = (allTokens.colors as any).themed[themeName];

    // The themeSpecificTokens are expected to be like: { background: "#000", text: "#FFF" }
    // These are not full token categories but direct overrides.
    // We need to structure them as if they are part of the 'colors' category for `applyTheme`.
    // For instance, if themeSpecificTokens is { background: 'black' }, it should become
    // { colors: { background: 'black' } } to correctly generate --colors-background.
    // Or, more generally, map them to appropriate full token paths.

    // For simplicity, let's assume the theme generator will apply these themed tokens
    // by creating CSS variables that components can use.
    // Example: if dark theme has { background: 'black' }, it generates `--colors-background: black;`
    // under `[data-theme="dark"]` or `:root`.

    // Let's define a theme object using these.
    // The `themeSpecificTokens` are likely flat key-value pairs for that theme context.
    // e.g., { background: "{colors.neutral.900.value}", text: "{colors.neutral.white.value}" }
    // These values should already be resolved by `getAllTokens()`.

    const themeOverrides: Partial<DesignTokens> = {
      // Assuming the themeable parts are mainly colors for now.
      // The structure of `themeSpecificTokens` from `colors.json` is:
      // "themed": { "light": { "background": "value", "text": "value" } }
      // So `themeSpecificTokens` would be `{ background: "resolved_value", text: "resolved_value" }`
      // We need to map these to the actual token paths they override.
      // For example, `background` might override `colors.background.default` or a similar path.
      // This requires a predefined mapping or a more complex theme structure.

      // For a simpler approach, let's assume the theme sets variables like `--theme-background`, `--theme-text`.
      // Or, if `themeSpecificTokens` are like `colors.background: 'value'`, then `applyTheme` handles it.

      // Let's make `applyTheme` expect overrides that match the structure of `DesignTokens`.
      // So if `themeSpecificTokens` from `colors.json` is:
      // `light: { background: "#FFFFFF", text: "#000000" }`
      // We'd pass this to `createTheme` as:
      // `createTheme("light", { colors: { background: "#FFFFFF", text: "#000000" }})`
      // (assuming 'background' and 'text' are defined paths like 'colors.background' and 'colors.text')

      // For the `colors.themed` structure, we assume these are specific overrides for general purpose semantic tokens.
      // For example, `colors.themed.dark.background` would override a general `colors.background.page`.
      // This mapping needs to be explicit in the theme definition.

      // Given the current `colors.json` structure:
      // "themed": { "light": { "background": "{color.neutral.white.value}", "text": "{color.neutral.black.value}" } }
      // `getAllTokens()` resolves these to:
      // `allTokens.colors.themed.light.background` = "#FFFFFF"
      // `allTokens.colors.themed.light.text` = "#000000"
      // We can create a theme object with these resolved values.
      // These are not overrides for e.g. `colors.base.primary` but new semantic slots.
      const themeTokenOverrides: DesignTokens = {
        // This structure matches how `flattenThemeTokensToCssVars` expects it.
        // We are creating new semantic slots like `themed.background` rather than overriding `base.primary`.
        // If we wanted to override `colors.base.primary` in a theme, the structure would be:
        // { colors: { base: { primary: "newColorForTheme" } } }
      };

      // Build the overrides object for the theme based on the `themed` section.
      // This will create variables like `--colors-themed-light-background`.
      // This might not be what's desired. Usually, a theme redefines common variables.
      // E.g., in dark mode, `--colors-background-default` becomes dark.

      // Let's redefine `applyTheme` and `setTheme` to be more conventional.
      // `setTheme` will fetch base tokens for "light" (default) or "dark".
      // These "dark" tokens are the *entire* set of tokens for the dark theme.
      // Or, more commonly, a theme provides overrides for a subset of base tokens.

      // For now, let's use the `data-theme` attribute and assume CSS handles overrides:
      // :root { --text-color: black; }
      // [data-theme="dark"] { --text-color: white; }
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', themeName);
        currentThemeName = themeName;
        console.log(`Document theme set to "${themeName}" via data-theme attribute.`);

        // To make this effective, the initial CSS variables (from generateCssVariablesString)
        // should be generated from the default theme (e.g., "light" tokens),
        // and then specific theme override files/CSS blocks would define changes for `[data-theme="dark"]`, etc.

        // The `applyTheme` function above is more for JS-driven dynamic themes where JS injects all styles.
        // The `setTheme` function here is simpler, relying on CSS to define theme differences.
        // The user's request "Theme Generator" could mean either.
        // The example `setTheme = (theme: 'light' | 'dark') => { document.documentElement.setAttribute('data-theme', theme); };`
        // points to this simpler data-attribute switching method.
      } else {
        console.warn("Cannot set theme: 'document' is not available in this environment.");
      }

    } else {
      console.warn(`Theme "${themeName}" not found in pre-defined themes within tokens.colors.themed.`);
    }
  } else {
     console.warn(`Theme "${themeName}" not found. Default tokens for 'colors.themed' not available.`);
  }
}


/**
 * Gets the name of the currently applied theme.
 *
 * @returns The current theme name or null if none is set.
 */
export function getCurrentTheme(): string | null {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-theme') || currentThemeName;
  }
  return currentThemeName;
}


// Example of defining a dark theme explicitly (alternative to deriving from `colors.themed`):
// const darkTheme = createTheme("dark", {
//   colors: {
//     // Assuming you have semantic token names like 'backgroundPrimary', 'textPrimary'
//     // that are defined in your base tokens.
//     backgroundApp: '#121212', // Example: overrides what might be colors.background.app in base
//     textPrimary: '#E0E0E0',   // Overrides colors.text.primary
//     textSecondary: '#A0A0A0',
//     accentPrimary: '#BB86FC', // Overrides colors.accent.primary
//     // ... other overrides
//   }
// });

// To use this more advanced `applyTheme`:
// applyTheme(darkTheme); // This would inject styles for `[data-theme="dark"]`

// The initial request for `setTheme` is simpler:
// export const setTheme = (theme: 'light' | 'dark') => {
//   document.documentElement.setAttribute('data-theme', theme);
// };
// This implies that CSS rules for these themes are already defined elsewhere,
// possibly using the CSS variables generated from the base tokens.
// For example:
// :root {
//   --text-color: var(--colors-neutral-black);
//   --background-color: var(--colors-neutral-white);
// }
// [data-theme="dark"] {
//   --text-color: var(--colors-neutral-white);
//   --background-color: var(--colors-neutral-900);
// }
// The `setTheme` function just switches the attribute.
// The `generateCssVariablesString` from `cssVariables.ts` would generate the :root variables.
// Additional CSS would be needed for the [data-theme="dark"] overrides, potentially also generated
// from a "dark" version of the tokens if available, or manually written.

// Let's stick to the simpler `setTheme` for now as per the example,
// and keep `createTheme` and `applyTheme` for more complex, JS-driven theming scenarios.
// The current `setTheme` implementation aligns with the user's example.
// `generateCssVariablesString` should be called once to set up all base tokens on :root.
// Then `setTheme('dark')` would switch to dark mode if CSS for `[data-theme="dark"]` exists.

// To make `setTheme` more useful with `colors.themed` from `tokens.json`:
// It could dynamically generate and apply the overrides for the selected theme.

export async function setAndApplyTheme(themeName: 'light' | 'dark' | 'high-contrast' | string): Promise<void> {
  const allTokens = await getAllTokens();
  let themeSpecificOverrides: Partial<DesignTokens> = {};

  if (allTokens.colors && (allTokens.colors as any).themed && (allTokens.colors as any).themed[themeName]) {
    const rawThemeOverrides = (allTokens.colors as any).themed[themeName]; // e.g., { background: "#000", text: "#FFF" }

    // These overrides need to be mapped to actual token paths.
    // For instance, `background` could map to `colors.background.page` or similar semantic tokens.
    // This mapping is application-specific and not inherently in the tokens.
    // Example: map `themed.light.background` to `colors.background.default`
    // Let's assume for now the `themed` section provides direct values for some *new* semantic slots
    // like `colors.themed.background` and `colors.themed.text`.
    // This is less useful than overriding existing semantic slots.

    // A common pattern is to have semantic tokens like:
    // colors.background.primary, colors.text.primary
    // And themes override these:
    // darkTheme = { colors: { background: { primary: 'black'}, text: { primary: 'white'} } }
    // The current `colors.themed` structure seems to be:
    // `colors.themed.dark = { background: value, text: value }`
    // This implies `background` and `text` are specific keys within `colors.themed.dark`.
    // So it would generate `--colors-themed-dark-background`, etc.

    // To make this truly switch themes, the `themeSpecificOverrides` should target common token paths.
    // E.g., if base tokens have `colors.ui.background`, dark theme provides `colors.ui.background = 'darkgrey'`.
    // The `colors.json` provided doesn't have a full "dark theme" token set, only
    // `colors.themed.dark.background` and `colors.themed.dark.text`.
    // These are effectively new tokens rather than overrides of a global "background" token.

    // Let's assume the `colors.themed.[themeName]` provides values for a *fixed set* of semantic tokens.
    // For example, that `colors.themed.dark.background` is THE background color for the dark theme.
    // And it should set the CSS variable `--colors-background-page` (or some agreed semantic name).

    // This requires a defined mapping:
    const mapping = {
      background: 'colors.background.page', // themed 'background' maps to this main token path
      text: 'colors.text.primary',        // themed 'text' maps to this main token path
    };

    const builtOverrides: any = { colors: { background: {}, text: {} } }; // Adjust structure as needed

    if (rawThemeOverrides.background) {
      // This structure is getting complicated. Let's simplify.
      // The `applyTheme` function takes a `Theme` object.
      // The `Theme` object has `tokens` which are `Partial<DesignTokens>`.
      // So, if `colors.themed.dark` has `{ background: '#001', text: '#fea' }`,
      // we can construct `Partial<DesignTokens>` like:
      // `themeOverrides = { colors: { pageBackground: '#001', primaryText: '#fea' } }`
      // This assumes `pageBackground` and `primaryText` are keys in `allTokens.colors`.
      // This is the most flexible: the theme definition explicitly states which tokens it overrides.
      // The `colors.themed` in `colors.json` is more like a palette for themes, not a theme definition itself.

      // For now, the simplest `setTheme` that uses the `data-theme` attribute is the most robust
      // given the current token structure, and it matches the user's example.
      // The more complex `applyTheme` can be used if themes are defined with explicit overrides.

      // Reverting to the simpler `setTheme` that just sets the attribute.
      // The `generateCssVariablesString` should be used to output all base tokens.
      // Then, separate CSS (possibly also generated) would define overrides for `[data-theme="dark"]`, etc.
      // This CSS would use the resolved values from `colors.themed.dark`, etc.

      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', themeName);
        currentThemeName = themeName;
        console.log(`Document theme set to "${themeName}" via data-theme attribute. Ensure CSS for this theme is loaded.`);
      } else {
        console.warn("Cannot set theme: 'document' is not available in this environment.");
      }

    } else {
      console.warn(`Theme data for "${themeName}" not found or incomplete in tokens.colors.themed.`);
      // Fallback: just set the attribute, assuming CSS will handle it.
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', themeName);
        currentThemeName = themeName;
        console.log(`Document theme attribute set to "${themeName}". CSS must define the theme.`);
      }
    }
  } else {
    console.warn(`Theme configuration for "${themeName}" not found in tokens.colors.themed.`);
     // Fallback: just set the attribute
    if (typeof document !== 'undefined' && themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        currentThemeName = themeName;
        console.log(`Document theme attribute set to "${themeName}". CSS must define the theme.`);
    }
  }
}

// The primary export will be the simple `setTheme` as per user example.
// `createTheme` and `applyTheme` are available for more advanced JS-driven theming.
// The `setAndApplyTheme` is an attempt to use `colors.themed` but it's non-trivial.

export { setTheme, getCurrentTheme, createTheme, applyTheme, setAndApplyTheme };

// For this iteration, `setTheme` will be the primary function as per the example:
// export const setTheme = (theme: 'light' | 'dark') => {
//   document.documentElement.setAttribute('data-theme', theme);
// };
// The implementation of `setTheme` above does exactly this.
// The `generateCssVariablesString` function from `cssVariables.ts` should be used to
// set up the base variables on `:root`.
// e.g., in main application setup:
// import { generateCssVariablesString } from './utils/cssVariables';
// import { setTheme } from './utils/theme';
//
// async function initializeDesignSystem() {
//   // 1. Inject all base tokens as CSS variables
//   const baseCss = await generateCssVariablesString(':root');
//   const styleTag = document.createElement('style');
//   styleTag.id = "base-token-styles";
//   styleTag.textContent = baseCss;
//   document.head.appendChild(styleTag);
//
//   // 2. (Optional) If dark theme overrides are also in JS and need injection:
//   // This would require having a dark theme token set.
//   // const darkThemeCss = await generateCssVariablesStringForTheme('dark', '[data-theme="dark"]');
//   // const darkThemeStyleTag = document.createElement('style');
//   // darkThemeStyleTag.id = "dark-theme-styles";
//   // darkThemeStyleTag.textContent = darkThemeCss;
//   // document.head.appendChild(darkThemeStyleTag);
//
//   // 3. Set a default theme or load from user preference
//   setTheme('light'); // or 'dark'
// }
//
// initializeDesignSystem();
//
// Later, a user action might call:
// setTheme('dark');
//
// This relies on CSS being structured like:
// :root { --primary-color: blue; --text-color: black; }
// [data-theme="dark"] { --primary-color: lightblue; --text-color: white; }
// The `colors.themed` section in `colors.json` provides values that *could* be used
// to generate the `[data-theme="dark"]` part.
//
// For example, to generate the dark theme CSS:
// async function getDarkThemeCss(): Promise<string> {
//   const allTokens = await getAllTokens();
//   const darkThemeValues = allTokens.colors?.themed?.dark;
//   if (!darkThemeValues) return "";
//
//   // Manually map these to your semantic token names
//   // This mapping is crucial and application-specific.
//   let css = '[data-theme="dark"] {\n';
//   if (darkThemeValues.background) { // Assuming darkThemeValues.background is the resolved value
//     css += `  ${pathToCssVar('colors.background.page')}: ${darkThemeValues.background};\n`; // Example path
//   }
//   if (darkThemeValues.text) {
//     css += `  ${pathToCssVar('colors.text.primary')}: ${darkThemeValues.text};\n`; // Example path
//   }
//   // ... add other mappings ...
//   css += '}\n';
//   return css;
// }
//
// getDarkThemeCss().then(darkCss => {
//   // inject darkCss
// });

// The `theme` object provided in the original prompt `createTheme({ tokens: { colors: ... }})`
// suggests that a theme definition explicitly provides overrides.
// The `applyTheme` function I wrote supports this.
// Let's ensure `setTheme` is the simple one, and `applyTheme` is for complex objects.
// The current `setTheme` function is the simple attribute setter.
// The `setAndApplyTheme` is an attempt to bridge, but it's complex due to mapping.
// The most useful export for now based on prompt's examples is the simple `setTheme`.
// The `createTheme` and `applyTheme` are good utilities to keep for more direct JS control.Here's the implementation for the Theme Generator. I've included:

1.  `createTheme(name, overrides)`: A function to define a theme object with a name and token overrides.
2.  `applyTheme(theme, applyToRoot)`: A function to dynamically generate and inject CSS variables for a given theme object. This is for JS-driven theming.
3.  `setTheme(themeName)`: A simpler function (matching the user's example) that sets a `data-theme` attribute on the document's root element. This relies on CSS already being in place to define how that theme looks (e.g., `[data-theme="dark"] { --text-color: white; }`).
4.  `getCurrentTheme()`: Returns the current theme name.

The `applyTheme` function is more powerful for themes defined entirely in JS, while `setTheme` is standard for CSS-driven theme switching. The `colors.json` includes a `themed` section (e.g., `colors.themed.dark`), which provides values. These values can be used to manually construct the CSS for `[data-theme="dark"]` or to create a theme object for `applyTheme`.

```typescript
// packages/design-core/src/utils/theme.ts

import { DesignTokens, TokenValue } from './tokens.d';
import { getAllTokens } from './tokens'; // To access the base tokens
import { pathToCssVar } from './cssVariables'; // For converting paths to CSS var names

export interface Theme {
  name: string;
  /**
   * Token overrides for this theme.
   * Structure should mirror DesignTokens, e.g.,
   * { colors: { primary: { main: 'newColor' } } }
   */
  tokens: Partial<DesignTokens>;
}

// Store the current theme name.
let currentThemeName: string | null = null;
const THEME_STYLE_ELEMENT_ID_PREFIX = 'dynamic-theme-styles-';

/**
 * Creates a new theme object.
 *
 * @param name The name of the theme (e.g., "dark", "highContrast").
 * @param overrides A partial DesignTokens object containing the specific tokens
 *                  that this theme changes from the base tokens.
 * @returns The theme object.
 */
export function createTheme(name: string, overrides: Partial<DesignTokens>): Theme {
  return {
    name,
    tokens: overrides,
  };
}

/**
 * Recursively flattens theme token overrides into a map of CSS variables.
 */
function flattenThemeOverridesToCssVars(
  tokenOverrides: Partial<DesignTokens> | any, // Can be any part of the DesignTokens structure
  currentPath: string = '',
  cssVarsMap: Record<string, TokenValue> = {}
): Record<string, TokenValue> {
  for (const key in tokenOverrides) {
    const value = tokenOverrides[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // It's a nested group, recurse
      flattenThemeOverridesToCssVars(value, newPath, cssVarsMap);
    } else if (value !== undefined && value !== null) {
      // It's a leaf node (a token value)
      cssVarsMap[pathToCssVar(newPath)] = value as TokenValue;
    }
  }
  return cssVarsMap;
}

/**
 * Applies a theme defined by a theme object by generating its CSS variables
 * and injecting them into a style tag in the document head.
 * These variables will override the base tokens for the specified theme.
 *
 * @param theme The theme object to apply.
 * @param applyToRoot If true, variables are applied to :root (effectively changing the base theme).
 *                    If false (default), they are applied to `[data-theme="theme-name"]`,
 *                    allowing for theme switching via the data-theme attribute.
 */
export async function applyTheme(theme: Theme, applyToRoot: boolean = false): Promise<void> {
  if (typeof document === 'undefined') {
    console.warn("Cannot apply theme: 'document' is not available.");
    return;
  }

  const selector = applyToRoot ? ':root' : `[data-theme="${theme.name}"]`;
  const styleElementId = `${THEME_STYLE_ELEMENT_ID_PREFIX}${theme.name}`;

  const cssVarsMap = flattenThemeOverridesToCssVars(theme.tokens);

  if (Object.keys(cssVarsMap).length === 0) {
    console.warn(`Theme "${theme.name}" has no token overrides to apply.`);
    return;
  }

  let cssString = `${selector} {\n`;
  for (const varName in cssVarsMap) {
    cssString += `  ${varName}: ${cssVarsMap[varName]};\n`;
  }
  cssString += `}\n`;

  let styleElement = document.getElementById(styleElementId) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleElementId;
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = cssString;

  if (!applyToRoot) {
    // If not applying to root, ensure the data-theme attribute is set to activate this theme.
    // This is typically handled by `setTheme`.
    // If `applyTheme` is called directly for a non-root theme,
    // the user might need to call `setTheme(theme.name)` separately.
  }

  console.log(`Theme "${theme.name}" styles applied to selector "${selector}".`);
}

/**
 * Sets the active theme for the document by setting the `data-theme` attribute
 * on the <html> element. This function relies on CSS being defined for
 * `[data-theme="theme-name"]` selectors.
 *
 * @param themeName The name of the theme to activate (e.g., "light", "dark").
 */
export function setTheme(themeName: string): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeName);
    currentThemeName = themeName;
    console.log(`Document theme set to "${themeName}" via data-theme attribute.`);
  } else {
    console.warn("Cannot set theme: 'document' is not available in this environment.");
  }
}

/**
 * Gets the name of the currently active theme from the `data-theme` attribute.
 *
 * @returns The current theme name string or null if not set.
 */
export function getCurrentTheme(): string | null {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-theme');
  }
  return currentThemeName; // Fallback for non-browser environments or if attribute not set
}


// --- Example Usage ---
//
// import { generateCssVariablesString } from './cssVariables';
// import { createTheme, applyTheme, setTheme, getCurrentTheme } from './theme';
// import { getAllTokens } from './tokens';
//
// async function initializeTheming() {
//   // 1. Inject all base tokens as CSS variables onto :root
//   const baseCss = await generateCssVariablesString(':root');
//   const styleTag = document.createElement('style');
//   styleTag.id = "base-token-styles";
//   styleTag.textContent = baseCss;
//   document.head.appendChild(styleTag);
//
//   // 2. Define a dark theme using token overrides
//   const allBaseTokens = await getAllTokens();
//   const darkThemeOverrides: Partial<DesignTokens> = {
//     colors: {
//       // Example: assume base tokens have `colors.background.default` and `colors.text.primary`
//       // We need to know the exact paths from the base tokens to override them.
//       // For this example, let's use the values from `allBaseTokens.colors.themed.dark`
//       // and map them to hypothetical semantic token paths.
//       background: { // This path would be e.g. colors.background.default in a real token set
//         // @ts-ignore
//         default: allBaseTokens.colors?.themed?.dark?.background || '#000000'
//       },
//       text: { // This path would be e.g. colors.text.primary
//         // @ts-ignore
//         primary: allBaseTokens.colors?.themed?.dark?.text || '#FFFFFF'
//       },
//       // Override a specific brand color for dark theme
//       base: {
//         // @ts-ignore
//         primary: allBaseTokens.colors?.alpha?.['primary-50'] || '#7995df' // Lighter primary for dark theme
//       }
//     }
//   };
//   const darkTheme = createTheme("dark", darkThemeOverrides);
//
//   // 3. Apply the dark theme styles (will create rules for `[data-theme="dark"]`)
//   await applyTheme(darkTheme);
//
//   // 4. Set the initial theme (e.g., from user preference or system setting)
//   setTheme('light'); // or setTheme('dark');
//
//   // Later, to switch themes:
//   // document.getElementById('theme-toggle-button').addEventListener('click', () => {
//   //   const newTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
//   //   setTheme(newTheme);
//   // });
// }
//
// // Run setup in a browser environment
// if (typeof window !== 'undefined') {
//   // initializeTheming();
// }
```
I've updated the `theme.ts` file with the described functionalities. The `applyTheme` function now correctly uses `flattenThemeOverridesToCssVars` to generate CSS from the theme's partial token structure. The examples illustrate how one might initialize base styles and then apply themed overrides.
