# @web-loom/design-core

[![Version](https://img.shields.io/npm/v/@web-loom/design-core.svg)](https://www.npmjs.com/package/@web-loom/design-core)
[![License](https://img.shields.io/npm/l/@web-loom/design-core.svg)](https://github.com/bretuobay/web-loom.git/design-core/blob/main/LICENSE)

A comprehensive, framework-agnostic design token system with built-in theming, CSS variable utilities, and a lightweight design system. Perfect for building scalable, maintainable design systems across React, Vue, Angular, and vanilla JavaScript applications.

## Features

- **Design Tokens**: Single source of truth for colors, typography, spacing, shadows, and more
- **CSS Custom Properties**: Automatic CSS variable generation from design tokens
- **Dynamic Theming**: Runtime theme switching with light/dark mode support
- **Framework Agnostic**: Works with React, Vue, Angular, or vanilla JavaScript
- **TypeScript Support**: Fully typed APIs with excellent IDE autocomplete
- **Lightweight Design System**: Optional pre-styled components built on design tokens
- **Zero Runtime Dependencies**: Minimal bundle size impact
- **Tree-Shakeable**: Import only what you need

The `@web-loom/design-core` package provides a foundational layer for building design systems. It includes a comprehensive set of design tokens and utilities to manage and apply these tokens effectively in various JavaScript environments and CSS styling approaches.

## Core Concepts

### Design Tokens

Design tokens are the single source of truth for your design system's visual properties. They represent values for colors, spacing, typography, shadows, and more. Tokens are organized into categories (e.g., `colors`, `spacing`, `typography`) and are defined in JSON files located in `packages/design-core/src/tokens/`.

**Key Features:**

- **Centralized Management:** All design values are stored and managed in one place.
- **Referenceable:** Tokens can reference other tokens, promoting consistency and easier maintenance (e.g., a `brand.primary` color token might reference a specific shade from your `blue` color palette). The utilities handle the resolution of these references automatically.
- **Platform Agnostic:** While this package focuses on web technologies (CSS and JavaScript), the token definitions themselves are abstract and can be transformed for other platforms.

### CSS Custom Properties

The primary way design tokens are exposed for use in styling is through CSS Custom Properties (also known as CSS Variables). Utilities are provided to generate these variables from the token definitions.

## Quick Start

### Installation

```bash
npm install @web-loom/design-core
# or
yarn add @web-loom/design-core
# or
pnpm add @web-loom/design-core
```

### Basic Usage

```typescript
import { getTokenValue, generateCssVariablesString } from '@web-loom/design-core/utils';

// Get a specific token value
const primaryColor = await getTokenValue('colors.brand.primary');
console.log(primaryColor); // "#007bff"

// Generate and inject CSS variables
const cssVars = await generateCssVariablesString(':root');
const style = document.createElement('style');
style.textContent = cssVars;
document.head.appendChild(style);
```

### Import Pre-built CSS

For the quickest setup, import the pre-generated CSS files:

```javascript
// Import all token CSS variables
import '@web-loom/design-core/design-system';

// Or import specific token categories
import '@web-loom/design-core/src/css/colors.css';
import '@web-loom/design-core/src/css/spacing.css';
import '@web-loom/design-core/src/css/typography.css';
```

**Note:** The utilities provided by this package are often asynchronous because they may need to dynamically load token definition files. Therefore, you'll typically use `async/await` when working with them.

## Available Design Tokens

The package includes the following token categories:

| Category          | Description                                 | Example Tokens                                         |
| ----------------- | ------------------------------------------- | ------------------------------------------------------ |
| **Colors**        | Brand colors, semantic colors, neutrals     | `colors.brand.primary`, `colors.background.page`       |
| **Typography**    | Font families, sizes, weights, line heights | `typography.fontSize.md`, `typography.fontFamily.sans` |
| **Spacing**       | Margins, padding, gaps                      | `spacing.xs`, `spacing.m`, `spacing.xl`                |
| **Sizing**        | Widths, heights, icon sizes                 | `sizing.sm`, `sizing.iconSize.md`                      |
| **Shadows**       | Elevation and depth effects                 | `shadows.sm`, `shadows.md`, `shadows.lg`               |
| **Borders**       | Border widths and styles                    | `borders.width.thin`, `borders.style.solid`            |
| **Radii**         | Border radius values                        | `radii.sm`, `radii.md`, `radii.full`                   |
| **Opacity**       | Transparency levels                         | `opacity.disabled`, `opacity.hover`                    |
| **Z-Index**       | Layering values                             | `zIndex.modal`, `zIndex.dropdown`                      |
| **Transitions**   | Animation timing and easing                 | `transitions.fast`, `transitions.easeInOut`            |
| **Breakpoints**   | Responsive design breakpoints               | `breakpoints.tablet`, `breakpoints.desktop`            |
| **Gradients**     | Color gradients                             | `gradients.primary`, `gradients.sunset`                |
| **Focus Rings**   | Focus indicator styles                      | `focusRings.default`, `focusRings.offset`              |
| **Cursor Styles** | Cursor types                                | `cursorStyles.pointer`, `cursorStyles.notAllowed`      |

## Utilities API

All utilities can be imported from `@web-loom/design-core/utils`.

```typescript
import {
  getTokenValue,
  getAllTokens,
  pathToCssVar,
  getTokenVar,
  getSafeTokenVar,
  generateCssVariablesString,
  generateCssVariablesMap,
  createTheme,
  applyTheme,
  setTheme,
  getCurrentTheme,
  Theme, // Type for Theme objects
  DesignTokens, // Type for the complete token structure
} from '@web-loom/design-core/utils';
```

### 1. Accessing Token Values in JavaScript

You can directly access resolved token values in your JavaScript/TypeScript code.

#### `getTokenValue(path: string): Promise<TokenValue | undefined>`

Retrieves the value of a specific design token.

- `path`: A dot-separated string representing the path to the token (e.g., `"colors.brand.primary"`, `"spacing.medium"`).

**Example:**

```typescript
async function fetchTokenDetails() {
  const primaryBrandColor = await getTokenValue('colors.brand.primary');
  if (primaryBrandColor) {
    console.log('Primary Brand Color:', primaryBrandColor); // e.g., "#007bff"
  } else {
    console.log('Token not found.');
  }

  const mediumSpacing = await getTokenValue('spacing.m');
  console.log('Medium Spacing:', mediumSpacing); // e.g., "16px"
}

fetchTokenDetails();
```

#### `getAllTokens(): Promise<DesignTokens>`

Retrieves the entire tree of processed design tokens.

**Example:**

```typescript
async function logAllTokens() {
  const allTokens = await getAllTokens();
  console.log('All Design Tokens:', allTokens);
  // You can then access specific values:
  // console.log(allTokens.colors.accent.default);
}

logAllTokens();
```

### 2. Using Tokens as CSS Variables

These utilities help you bridge the gap between your design tokens and CSS.

#### `generateCssVariablesString(selector: string = ':root'): Promise<string>`

Generates a string of CSS custom property definitions from all design tokens. This string can be injected into a `<style>` tag or a CSS file.

- `selector` (optional): The CSS selector under which the variables will be defined. Defaults to `":root"` for global availability.

**Example: Injecting global CSS variables**

```typescript
async function setupGlobalCssVariables() {
  const cssVariablesString = await generateCssVariablesString(':root');

  const styleTag = document.createElement('style');
  styleTag.id = 'global-design-tokens';
  styleTag.textContent = cssVariablesString;
  document.head.appendChild(styleTag);

  console.log('Global CSS variables injected.');
}

// Call this early in your application's lifecycle
// if (typeof window !== 'undefined') {
//   setupGlobalCssVariables();
// }
```

Alternatively, you can link the pre-generated CSS files directly in your HTML or import them into your main CSS/JS files. The core tokens are available as individual CSS files:

```html
<!-- Example: Link specific token CSS files in HTML -->
<link rel="stylesheet" href="node_modules/@web-loom/design-core/src/css/colors.css" />
<link rel="stylesheet" href="node_modules/@web-loom/design-core/src/css/spacing.css" />
<!-- etc. -->
```

Or import them in your JavaScript entry point (if your bundler supports CSS imports):

```javascript
// main.js or App.js
import '@web-loom/design-core/src/css/colors.css';
import '@web-loom/design-core/src/css/spacing.css';
// ... import other required token CSS files
```

Once injected or linked, you can use these variables in your CSS:

```css
/* Example CSS */
body {
  background-color: var(--colors-background-page); /* Assuming 'colors.background.page' token exists */
  font-family: var(--typography-fontFamily-sans);
  padding: var(--spacing-l);
}

.button-primary {
  background-color: var(--colors-brand-primary);
  color: var(--colors-text-onBrand);
  padding: var(--spacing-s) var(--spacing-m);
  border-radius: var(--radii-default);
}
```

#### `pathToCssVar(path: string): string`

Converts a token path to its corresponding CSS variable name.

- `path`: The token path (e.g., `"colors.brand.primary"`).

**Example:**

```typescript
const primaryColorVarName = pathToCssVar('colors.brand.primary');
console.log(primaryColorVarName); // Output: --colors-brand-primary
```

#### `getTokenVar(path: string): string`

Returns a `var()` CSS function string for a given token path. This is useful for applying styles dynamically via JavaScript or for CSS-in-JS libraries.

- `path`: The token path.

**Example:**

```typescript
const element = document.getElementById('myElement');
if (element) {
  // Assuming 'colors.accent.default' token exists and CSS variables are loaded
  element.style.borderColor = getTokenVar('colors.accent.default'); // e.g., "var(--colors-accent-default)"
}
```

#### `getSafeTokenVar(path: string): Promise<string | undefined>`

Similar to `getTokenVar`, but first checks if the token path is valid. If not, it returns `undefined` and logs a warning.

**Example:**

```typescript
async function applySafeStyle() {
  const element = document.getElementById('myElement');
  if (element) {
    const accentColor = await getSafeTokenVar('colors.accent.default');
    if (accentColor) {
      element.style.backgroundColor = accentColor;
    } else {
      console.warn('Accent color token not found, using fallback.');
      // element.style.backgroundColor = 'grey'; // Fallback
    }
  }
}

applySafeStyle();
```

#### `generateCssVariablesMap(): Promise<Record<string, TokenValue>>`

Generates a flat JavaScript object where keys are CSS variable names (e.g., `"--colors-brand-primary"`) and values are the corresponding token values.

**Example:**

```typescript
async function getVariablesMap() {
  const variablesMap = await generateCssVariablesMap();
  console.log(variablesMap['--colors-brand-primary']); // e.g., "#007bff"
  // Useful for applying multiple styles via JavaScript:
  // const element = document.getElementById('my-element');
  // if (element) {
  //   for (const varName in variablesMap) {
  //     element.style.setProperty(varName, variablesMap[varName].toString());
  //   }
  // }
}

getVariablesMap();
```

### 3. Theming

The `@design-core` utilities provide a robust way to define and switch between different themes (e.g., light, dark, high contrast). Themes work by overriding specific token values.

#### `createTheme(name: string, overrides: Partial<DesignTokens>): Theme`

Creates a theme object.

- `name`: A string name for the theme (e.g., `"dark"`, `"highContrast"`). This name will be used in the `data-theme` attribute.
- `overrides`: An object whose structure mirrors `DesignTokens`, containing only the tokens you want to override for this theme.

**Example: Defining a dark theme**

```typescript
const darkTheme = createTheme('dark', {
  colors: {
    background: {
      page: '#121212', // Override page background for dark theme
      default: '#1E1E1E',
    },
    text: {
      primary: '#E0E0E0', // Override primary text color
      secondary: '#A0A0A0',
    },
    brand: {
      primary: '#3B82F6', // Slightly different brand color for dark theme
    },
  },
  shadows: {
    medium: '0 4px 12px rgba(255, 255, 255, 0.1)', // Softer shadows for dark theme
  },
});
```

#### `applyTheme(theme: Theme, applyToRoot: boolean = false): Promise<void>`

Generates the CSS custom properties for a theme's overrides and injects them into a `<style>` tag.

- `theme`: The `Theme` object created by `createTheme`.
- `applyToRoot` (optional, default: `false`):
  - If `false` (default): Variables are scoped to a `[data-theme="theme-name"]` selector (e.g., `[data-theme="dark"]`). This allows the theme to be activated by setting the `data-theme` attribute on an ancestor element (typically `<html>`).
  - If `true`: Variables are applied to the `:root` selector, effectively changing the base token values for all elements, regardless of the `data-theme` attribute. This can be used to apply a base set of overrides.

**Example: Applying the dark theme styles**

```typescript
async function setupDarkThemeStyles() {
  // Assuming `darkTheme` is defined as above
  await applyTheme(darkTheme); // Scopes variables to [data-theme="dark"]
  console.log('Dark theme styles prepared. Use setTheme("dark") to activate.');

  // Example: Applying a theme to :root (less common for alternative themes)
  // const highContrastBase = createTheme('high-contrast-base', { ... });
  // await applyTheme(highContrastBase, true); // Overrides :root variables
}

// if (typeof window !== 'undefined') {
//   setupDarkThemeStyles();
// }
```

#### `setTheme(themeName: string): void`

Activates a theme by setting the `data-theme` attribute on the `<html>` element. This is the primary way to switch between themes after their styles have been defined and applied using `applyTheme`.

- `themeName`: The name of the theme to activate (must match the name used in `createTheme` and `applyTheme`).

**Example: Switching themes**

```typescript
// After darkTheme styles have been applied via applyTheme(darkTheme)
function switchToDarkTheme() {
  setTheme('dark');
  console.log('Switched to dark theme.');
}

function switchToLightTheme() {
  // Assuming your base styles (e.g., loaded via generateCssVariablesString(':root'))
  // represent the light theme, or you have a specific 'light' theme applied.
  // To revert to default (no data-theme or data-theme="light"):
  document.documentElement.removeAttribute('data-theme');
  // Or, if you have a specific light theme: setTheme('light');
  console.log('Switched to light theme (default).');
}

// Example:
// switchToDarkTheme();
// setTimeout(switchToLightTheme, 3000);
```

It's important that the CSS for the theme (e.g., `[data-theme="dark"] { ... }`) is loaded _before_ `setTheme` is called. `applyTheme` handles this injection.

#### `getCurrentTheme(): string | null`

Gets the name of the currently active theme. It reads the `data-theme` attribute from the `<html>` element or falls back to an internally tracked name.

**Example:**

```typescript
function logCurrentTheme() {
  const current = getCurrentTheme();
  if (current) {
    console.log('Current active theme:', current);
  } else {
    console.log('No specific theme active (likely default/light).');
  }
}

logCurrentTheme();
```

## Token Files

Design tokens are defined in JSON files within the `packages/design-core/src/tokens/` directory. Each file typically represents a category of tokens:

- `colors.json`
- `spacing.json`
- `typography.json`
- `shadows.json`
- `radii.json`
- And more...

These files use the [Design Tokens Community Group (DTCG) format](https://design-tokens.github.io/community-group/format/) where applicable, often with a `value` property for each token. References to other tokens can be made using a special syntax like `"{colors.base.blue.500.value}"` (the `.value` suffix is important in the raw JSON). The utilities in this package handle the processing and resolution of these references.

**Example snippet from `colors.json` (conceptual):**

```json
{
  "brand": {
    "primary": { "value": "{colors.blue.600.value}" }, // Reference
    "secondary": { "value": "{colors.green.500.value}" }
  },
  "blue": {
    "600": { "value": "#007bff" }
    // ... other shades
  }
  // ... other color categories
}
```

You generally don't need to interact with these files directly if you're consuming the tokens through the provided utilities, but it's helpful to understand their structure if you plan to extend or modify the token set.

## TypeScript Types

The package also exports various TypeScript types related to the design tokens and their structure (e.g., `DesignTokens`, `TokenValue`, `Theme`). These can be imported from the root of `@design-core` or directly from `@design-core/utils` for utility-specific types.

```typescript
import { DesignTokens, ColorTokens } from '@design-core'; // Example type imports
```

This provides type safety and autocompletion when working with tokens and theme objects in a TypeScript environment.

## Lightweight Design System (CSS Styles)

Beyond the core tokens and utilities, `@design-core` also provides a lightweight, optional CSS-based design system built on top of these tokens. This includes pre-styled components for common UI elements.

**Location:** `packages/design-core/src/design-system/`

### How to Use

You can import the entire design system's CSS, or import styles for specific components.

**1. Import all styles:**

This is the simplest way to get all component styles. Import it in your main JavaScript/TypeScript file (if your bundler supports CSS imports) or link it in your HTML.

_In your main JS/TS file:_

```javascript
import '@web-loom/design-core/design-system'; // if using package exports
// or directly:
// import '@web-loom/design-core/src/design-system/index.css';
```

_In your HTML `head`:_

```html
<link rel="stylesheet" href="node_modules/@web-loom/design-core/src/design-system/index.css" />
```

This will include `base.css` (which itself imports all token CSS) and all component styles.

**2. Import individual component styles:**

If you only need styles for specific components, you can import them directly. This can help reduce the amount of CSS included in your application if you're not using all components.

_In your JS/TS file (e.g., for a specific component or view):_

```javascript
// Example: Only import button and card styles
import '@web-loom/design-core/src/design-system/forms/button.css';
import '@web-loom/design-core/src/design-system/display/card.css';
// Don't forget to also include base styles if not importing the full index.css
import '@web-loom/design-core/src/design-system/base.css';
// Or ensure all token css files from src/css/* are loaded
```

_Note: Individual component CSS files rely on the CSS Custom Properties defined by the token CSS files (`packages/design-core/src/css/_.css`). The `base.css`file within the design system imports all of these. If you import component styles individually without`base.css`or the main`index.css`, ensure the token CSS files are loaded separately.\*

**Using the component classes:**

Once the CSS is imported, you can use the defined classes in your HTML:

```html
<button class="btn btn-primary">Primary Button</button>

<div class="card">
  <div class="card-header">Card Title</div>
  <div class="card-body">This is a simple card.</div>
</div>

<div class="form-group">
  <label for="myInput" class="form-label">My Input</label>
  <input type="text" id="myInput" class="input-base" placeholder="Enter text..." />
</div>
```

Refer to the CSS files within `packages/design-core/src/design-system/` subdirectories (e.g., `layout`, `display`, `forms`) to see available classes and component structures. The design aims for a flat look with well-defined borders.

### Theming the Design System

The design system components are built using the CSS Custom Properties derived from the design tokens. This means they will automatically respond to theme changes implemented via the `applyTheme` and `setTheme` utilities described earlier. For example, switching to a "dark" theme will adjust the appearance of buttons, cards, inputs, etc., provided the dark theme overrides the relevant color and style tokens.

```html
<!-- Set a theme on the HTML element -->
<html data-theme="dark">
  <body>
    <!-- Components will now use dark theme styles -->
    <button class="btn btn-secondary">Dark Theme Button</button>
  </body>
</html>
```

Ensure your theme definitions in `createTheme` cover the tokens used by the design system components for complete theming.

---

## Framework Integration Examples

### React

```typescript
import { useEffect, useState } from 'react';
import { getTokenValue, createTheme, applyTheme, setTheme } from '@web-loom/design-core/utils';
import '@web-loom/design-core/design-system';

function App() {
  const [theme, setActiveTheme] = useState('light');

  useEffect(() => {
    // Set up dark theme
    const darkTheme = createTheme('dark', {
      colors: {
        background: { page: '#121212' },
        text: { primary: '#E0E0E0' }
      }
    });
    applyTheme(darkTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setActiveTheme(newTheme);
  };

  return (
    <div>
      <button className="btn btn-primary" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
}
```

### Vue 3

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { createTheme, applyTheme, setTheme } from '@web-loom/design-core/utils';
import '@web-loom/design-core/design-system';

const currentTheme = ref('light');

onMounted(async () => {
  const darkTheme = createTheme('dark', {
    colors: {
      background: { page: '#121212' },
      text: { primary: '#E0E0E0' },
    },
  });
  await applyTheme(darkTheme);
});

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
  setTheme(currentTheme.value);
};
</script>

<template>
  <div>
    <button class="btn btn-primary" @click="toggleTheme">Toggle Theme</button>
  </div>
</template>
```

### Next.js (App Router)

```typescript
// app/layout.tsx
import '@web-loom/design-core/design-system';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// app/theme-provider.tsx (client component)
'use client';

import { useEffect } from 'react';
import { createTheme, applyTheme } from '@web-loom/design-core/utils';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const setupThemes = async () => {
      const darkTheme = createTheme('dark', {
        colors: {
          background: { page: '#121212' },
          text: { primary: '#E0E0E0' }
        }
      });
      await applyTheme(darkTheme);
    };
    setupThemes();
  }, []);

  return <>{children}</>;
}
```

---

## Component Library

The design system includes 20+ pre-styled components:

### Forms

- Buttons (primary, secondary, outline, ghost)
- Input fields
- Textarea
- Select dropdowns
- Checkboxes
- Radio groups
- Switches

### Display

- Cards
- Badges
- Avatars
- Lists
- Tables

### Navigation

- Navigation bar
- Sidebar
- Tabs

### Layout

- Container
- Page header
- Page content
- Footer

### Overlays

- Modals
- Tooltips
- Toasts

### Utility

- Loaders/Spinners

All components use CSS custom properties from design tokens, making them fully themeable.

---

## Package Exports

The package provides multiple entry points for different use cases:

```typescript
// Main entry - TypeScript types
import { ColorTokens, SpacingTokens } from '@web-loom/design-core';

// Utils - Token utilities and theming
import { getTokenValue, createTheme } from '@web-loom/design-core/utils';

// Individual token CSS files
import '@web-loom/design-core/css/colors.css';
import '@web-loom/design-core/css/spacing.css';

// Complete design system
import '@web-loom/design-core/design-system';

// Individual component CSS
import '@web-loom/design-core/design-system/forms/button.css';
import '@web-loom/design-core/design-system/display/card.css';
```

---

## Best Practices

### 1. Load Tokens Early

Load and inject CSS variables as early as possible in your application lifecycle:

```typescript
// main.ts or index.ts
import { generateCssVariablesString } from '@web-loom/design-core/utils';

async function setupTokens() {
  const cssVars = await generateCssVariablesString(':root');
  const style = document.createElement('style');
  style.id = 'design-tokens';
  style.textContent = cssVars;
  document.head.appendChild(style);
}

setupTokens();
```

### 2. Use Semantic Token Names

Prefer semantic names over primitive values:

```css
/* Good - Semantic */
.card {
  background: var(--colors-background-surface);
  padding: var(--spacing-m);
}

/* Avoid - Too specific */
.card {
  background: var(--colors-gray-100);
  padding: var(--spacing-16);
}
```

### 3. Theme Testing

Test your application in all supported themes:

```typescript
// Automated theme testing
const themes = ['light', 'dark', 'high-contrast'];

themes.forEach((themeName) => {
  test(`renders correctly in ${themeName} theme`, () => {
    setTheme(themeName);
    // Your assertions
  });
});
```

### 4. Performance Optimization

For production, import only what you need:

```typescript
// Import specific categories instead of all tokens
import '@web-loom/design-core/src/css/colors.css';
import '@web-loom/design-core/src/css/spacing.css';
// Don't import everything if you only need a few tokens
```

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- CSS Custom Properties required (IE11 not supported)

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/bretuobay/web-loom.git/web-loom.git
cd web-loom/packages/design-core

# Install dependencies
npm install

# Generate CSS files from tokens
npm run generate:css

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the package
npm run build

# Lint code
npm run lint
```

### Adding New Tokens

1. Edit the appropriate JSON file in `src/tokens/`
2. Run `npm run generate:css` to update CSS files
3. Update TypeScript types if needed
4. Add tests for new tokens
5. Update documentation

---

## Troubleshooting

### CSS Variables Not Loading

**Issue:** CSS variables are undefined in the browser.

**Solution:** Ensure CSS files are imported before use:

```typescript
import '@web-loom/design-core/design-system';
```

### Async Token Loading Errors

**Issue:** `getTokenValue()` returns `undefined`.

**Solution:** Ensure you're using `await` and that token files are accessible:

```typescript
const value = await getTokenValue('colors.brand.primary');
```

### Theme Not Applying

**Issue:** Theme switch doesn't change appearance.

**Solution:**

1. Verify theme CSS is loaded with `applyTheme()`
2. Check that `data-theme` attribute is set on `<html>`
3. Ensure component CSS uses CSS variables

### Build/Import Errors

**Issue:** "Cannot find module" errors.

**Solution:** Check your bundler configuration supports:

- JSON imports (`resolveJsonModule: true` in tsconfig)
- CSS imports (bundler plugin for CSS)
- Dynamic imports (ES2020+ target)

---

## Roadmap

### v1.0 (Production Ready)

- [ ] 80%+ test coverage
- [ ] Performance benchmarks
- [ ] Accessibility compliance (WCAG AA)
- [ ] API documentation site
- [ ] Migration guides

### v1.1

- [ ] Design tool plugins (Figma, Sketch)
- [ ] VS Code extension
- [ ] Token visualization tool
- [ ] Advanced theming features

### v2.0

- [ ] Multi-platform support (React Native, Flutter)
- [ ] Token composition utilities
- [ ] Performance monitoring
- [ ] WCAG AAA compliance

See [PRODUCTION-READINESS-GAP-ANALYSIS.md](./PRODUCTION-READINESS-GAP-ANALYSIS.md) for detailed gap analysis.

---

## Related Packages

- `@web-loom/mvvm-core` - MVVM architecture for web applications
- `@web-loom/ui-core` - Headless UI behaviors and patterns
- `@web-loom/store-core` - Reactive state management
- `@web-loom/event-bus-core` - Event bus for cross-component communication

---

## License

MIT © Festus Yeboah

---

## Support

- Documentation: [Web Loom Docs](https://web-loom.dev)
- Issues: [GitHub Issues](https://github.com/bretuobay/web-loom.git/web-loom/issues)
- Discussions: [GitHub Discussions](https://github.com/bretuobay/web-loom.git/web-loom/discussions)

---

## Acknowledgments

Design token specifications inspired by:

- [Design Tokens Community Group](https://design-tokens.github.io/community-group/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Theo](https://github.com/salesforce-ux/theo)

### From the root README:

#### [@web-loom/design-core](packages/design-core) ![Version](https://img.shields.io/badge/version-0.5.2-blue)

Theme and CSS variable utilities for design systems.
