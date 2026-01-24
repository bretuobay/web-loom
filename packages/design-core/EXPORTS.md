# Package Exports Configuration

This document explains how the `@web-loom/design-core` package exports are configured for use in third-party applications.

## Overview

The package now supports multiple entry points through package.json `exports` field, allowing consumers to import specific modules without importing the entire package.

## Available Exports

### Main Entry Point

```typescript
import * as DesignCore from '@web-loom/design-core';
```

- **Path**: `@web-loom/design-core`
- **JavaScript**: `./dist/index.js`
- **Types**: `./dist/index.d.ts`
- **Description**: Exports all type definitions from the package

### Utilities

```typescript
import { getTokenValue, createTheme, applyTheme } from '@web-loom/design-core/utils';
```

- **Path**: `@web-loom/design-core/utils`
- **JavaScript**: `./dist/utils/index.js`
- **Types**: `./dist/utils/index.d.ts`
- **Description**: All utility functions for working with tokens, themes, and CSS variables

**Available Functions:**

- `getTokenValue(path)` - Get a specific token value
- `getAllTokens()` - Get all design tokens
- `pathToCssVar(path)` - Convert token path to CSS variable name
- `getTokenVar(path)` - Get CSS variable reference for a token
- `getSafeTokenVar(path)` - Get CSS variable with fallback
- `generateCssVariablesMap()` - Generate a map of CSS variables
- `generateCssVariablesString(selector)` - Generate CSS variables as a string
- `createTheme(name, overrides)` - Create a new theme
- `applyTheme(theme)` - Apply a theme to the DOM
- `setTheme(name)` - Set the active theme
- `getCurrentTheme()` - Get the current theme name

### Types

```typescript
import type { ColorTokens, SpacingTokens, Theme } from '@web-loom/design-core/types';
```

- **Path**: `@web-loom/design-core/types`
- **JavaScript**: `./dist/types/index.js`
- **Types**: `./dist/types/index.d.ts`
- **Description**: All TypeScript type definitions

**Available Types:**

- `BorderTokens`
- `BreakpointTokens`
- `ColorTokens`
- `CursorStyleTokens`
- `FocusRingTokens`
- `GradientTokens`
- `OpacityTokens`
- `RadiiTokens`
- `ShadowTokens`
- `SizingTokens`
- `SpacingTokens`
- `TimingTokens`
- `TokenValue`
- `TransitionTokens`
- `TypographyTokens`
- `ZIndexTokens`

### CSS Files

```typescript
// Import all design system CSS
import '@web-loom/design-core/design-system';

// Import specific token categories
import '@web-loom/design-core/css/colors.css';
import '@web-loom/design-core/css/spacing.css';
import '@web-loom/design-core/css/typography.css';
```

- **Pattern**: `@web-loom/design-core/css/*`
- **Path**: `./src/css/*.css`
- **Description**: Pre-generated CSS files with CSS custom properties

**Available CSS Files:**

- `borders.css`
- `breakpoints.css`
- `colors.css`
- `cursor-styles.css`
- `focus-rings.css`
- `gradients.css`
- `opacity.css`
- `radii.css`
- `shadows.css`
- `sizing.css`
- `spacing.css`
- `timing.css`
- `transitions.css`
- `typography.css`
- `z-index.css`

### Design System Components

```typescript
// Import all component styles
import '@web-loom/design-core/design-system';

// Import specific component categories
import '@web-loom/design-core/design-system/forms/button.css';
import '@web-loom/design-core/design-system/display/card.css';
```

- **Pattern**: `@web-loom/design-core/design-system/*`
- **Path**: `./src/design-system/*.css`
- **Description**: Pre-styled component CSS

## Build Configuration

The package uses Vite to build separate entry points:

```typescript
{
  entry: {
    'design-core.es': './src/index.ts',  // Main bundle
    index: './src/index.ts',              // New main entry
    'utils/index': './src/utils/index.ts', // Utils subpath
    'types/index': './src/types/index.ts', // Types subpath
  }
}
```

TypeScript declarations are generated separately for each entry point using `vite-plugin-dts` with `rollupTypes: false` to maintain the module structure.

## Usage Examples

### In a React Application

```typescript
// ThemeProvider.tsx
import { createTheme, applyTheme, setTheme } from '@web-loom/design-core/utils';
import type { Theme } from '@web-loom/design-core/utils';

const customTheme: Theme = {
  name: 'my-theme',
  cssVariables: {
    '--color-brand-primary': '#ff6b6b',
  },
};

createTheme('my-theme', customTheme);
setTheme('my-theme');
```

### In a Vanilla JavaScript Application

```javascript
// main.js
import '@web-loom/design-core/design-system';
import { generateCssVariablesString } from '@web-loom/design-core/utils';

// Inject CSS variables
const cssVars = await generateCssVariablesString(':root');
const style = document.createElement('style');
style.textContent = cssVars;
document.head.appendChild(style);
```

### In a TypeScript Library

```typescript
// tokens.ts
import type { ColorTokens, SpacingTokens } from '@web-loom/design-core/types';
import { getTokenValue } from '@web-loom/design-core/utils';

export async function getThemeColors(): Promise<ColorTokens> {
  const primary = await getTokenValue('colors.brand.primary');
  return { brand: { primary } };
}
```

## Backwards Compatibility

The package maintains backwards compatibility with the previous exports:

- `main` field points to `./dist/index.js`
- `module` field points to `./dist/design-core.es.js` (legacy bundle)
- `types` field points to `./dist/index.d.ts`

## Testing the Configuration

To verify the exports work correctly:

```bash
# Build the package
cd packages/design-core
npm run build

# Check the generated files
ls -la dist/
ls -la dist/utils/
ls -la dist/types/

# Verify in a test project
node -e "import('@web-loom/design-core/utils').then(m => console.log(Object.keys(m)))"
```

## Troubleshooting

### Module not found errors

If you see errors like:

```
Cannot find module '@web-loom/design-core/utils' or its corresponding type declarations
```

**Solutions:**

1. Ensure the package is built: `npm run build`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check that the `dist/` folder contains `utils/index.js` and `utils/index.d.ts`
4. Verify your bundler supports package.json `exports` field (most modern bundlers do)

### TypeScript cannot find types

If TypeScript can't find the type declarations:

1. Ensure `moduleResolution` in your `tsconfig.json` is set to `"bundler"`, `"node16"`, or `"nodenext"`
2. Make sure you're using TypeScript 4.7 or higher
3. Check that the package's `dist/` folder has the `.d.ts` files

## Related Documentation

- [README.md](./README.md) - General package documentation
- [package.json](./package.json) - Package configuration
- [vite.config.ts](./vite.config.ts) - Build configuration
