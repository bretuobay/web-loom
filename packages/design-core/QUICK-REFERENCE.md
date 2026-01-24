# @web-loom/design-core Quick Import Reference

## Available Imports

### 🎨 Main Package (Types)

```typescript
import * as DesignCore from '@web-loom/design-core';
// Exports all type definitions
```

### 🛠️ Utilities (Functions & Theme)

```typescript
import {
  // Token Access
  getTokenValue,
  getAllTokens,

  // CSS Variables
  pathToCssVar,
  getTokenVar,
  getSafeTokenVar,
  generateCssVariablesMap,
  generateCssVariablesString,

  // Theming
  createTheme,
  applyTheme,
  setTheme,
  getCurrentTheme,

  // Types
  Theme,
} from '@web-loom/design-core/utils';
```

### 📐 Types Only

```typescript
import type {
  BorderTokens,
  BreakpointTokens,
  ColorTokens,
  CursorStyleTokens,
  FocusRingTokens,
  GradientTokens,
  OpacityTokens,
  RadiiTokens,
  ShadowTokens,
  SizingTokens,
  SpacingTokens,
  TimingTokens,
  TokenValue,
  TransitionTokens,
  TypographyTokens,
  ZIndexTokens,
} from '@web-loom/design-core/types';
```

### 🎨 CSS Files

#### All Design System CSS

```typescript
import '@web-loom/design-core/design-system';
```

#### Specific Token Categories

```typescript
import '@web-loom/design-core/css/colors.css';
import '@web-loom/design-core/css/spacing.css';
import '@web-loom/design-core/css/typography.css';
import '@web-loom/design-core/css/shadows.css';
import '@web-loom/design-core/css/borders.css';
// ... and more
```

#### Component Styles

```typescript
import '@web-loom/design-core/design-system/forms/button.css';
import '@web-loom/design-core/design-system/display/card.css';
```

## Common Patterns

### React Theme Provider

```typescript
import { createTheme, setTheme } from '@web-loom/design-core/utils';
import type { Theme } from '@web-loom/design-core/utils';

const darkTheme: Theme = {
  name: 'dark',
  cssVariables: {
    '--color-background': '#1a1a1a',
  },
};

createTheme('dark', darkTheme);
setTheme('dark');
```

### Get Token Value

```typescript
import { getTokenValue } from '@web-loom/design-core/utils';

const primaryColor = await getTokenValue('color.base.primary');
console.log(primaryColor); // "#1E40AF"
```

### Generate CSS Variables

```typescript
import { generateCssVariablesString } from '@web-loom/design-core/utils';

const cssVars = await generateCssVariablesString(':root');
const style = document.createElement('style');
style.textContent = cssVars;
document.head.appendChild(style);
```

### Type-safe Token Access

```typescript
import type { ColorTokens } from '@web-loom/design-core/types';
import { getTokenValue } from '@web-loom/design-core/utils';

async function getColors(): Promise<Partial<ColorTokens>> {
  return {
    base: {
      primary: await getTokenValue('color.base.primary'),
    },
  };
}
```

## ✅ Verified Working

- ✅ Works in monorepo apps
- ✅ Works with TypeScript
- ✅ Works with external npm packages
- ✅ Tree-shakeable
- ✅ Full type support
- ✅ 183 CSS variables available

## 📦 Build Output

```
dist/
├── index.js & index.d.ts           # Main
├── utils/index.js & index.d.ts     # Utils
├── types/index.js & index.d.ts     # Types
└── design-core.es.js               # Legacy
```

## 🚀 Quick Start

```bash
npm install @web-loom/design-core
```

```typescript
// Import utils
import { getTokenValue, createTheme } from '@web-loom/design-core/utils';

// Import CSS
import '@web-loom/design-core/design-system';

// Import types
import type { ColorTokens } from '@web-loom/design-core/types';
```

## 📚 More Info

- Full docs: [README.md](./README.md)
- Exports guide: [EXPORTS.md](./EXPORTS.md)
- Fix details: [FIX-SUMMARY.md](./FIX-SUMMARY.md)
