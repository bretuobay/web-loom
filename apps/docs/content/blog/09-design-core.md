# `@web-loom/design-core` — Design Tokens as the Contract Between Design and Code

---

Somewhere in every medium-to-large frontend codebase there is a file called `colors.ts`, or `theme.js`, or `design-tokens.json`, or some variation thereof. It was created by someone who recognised that hardcoding `#3B82F6` in seventeen places was a bad idea. It has since been modified by twelve different engineers and is now partially duplicated, partially outdated, and only loosely connected to what's actually rendering.

The problem isn't the idea of centralising design values. The problem is that "centralised" and "enforced" are different things. A file of constants is one way to centralise. A typed token system with CSS custom properties is another. The second one actually works.

---

## What Design Tokens Are

The term "design token" was introduced by Salesforce's Lightning Design System team around 2014. It described a set of named design decisions — colours, spacing values, font sizes, border radii — expressed in a format that could be consumed by any platform. The same token `color.brand.primary` might become `#0070D2` in CSS, `UIColor(hex: "#0070D2")` in Swift, and `Color(0xFF0070D2)` in Flutter.

The insight was that design decisions are not platform-specific. The choice "our primary brand colour is this blue" is made once. The way it's expressed in CSS versus Swift versus Android XML is a translation problem, not a design problem. Tokens are the source of truth; their platform representations are derived from it.

The W3C Design Tokens Community Group has been working on a specification for a standard token format since 2019. Tools like Style Dictionary (Amazon), Theo (Salesforce), and Cobalt take token definitions in JSON or YAML and compile them to CSS variables, Sass maps, JavaScript objects, or whatever format your platform needs.

`@web-loom/design-core` brings this discipline to TypeScript without an external build tool.

---

## What the Package Provides

The package ships three things: the token values themselves as ready-made CSS custom-property files (`@web-loom/design-core/design-system`, or individual files under `@web-loom/design-core/css/*`), TypeScript types for every token category from the root entry, and a small runtime under `@web-loom/design-core/utils` for reading tokens and creating, injecting and switching themes.

The types cover fifteen categories:

```typescript
import type {
  ColorToken,
  SpacingToken,
  TypographyToken,
  BorderToken,
  RadiusToken,
  ShadowToken,
  GradientToken,
  OpacityToken,
  TransitionToken,
  TimingToken,
  ZIndexToken,
  BreakpointToken,
  SizingToken,
  CursorToken,
  FocusRingToken,
} from '@web-loom/design-core';
```

These types describe the shape of each category (for example `RadiusToken` is `{ sm, md, lg, full }`). Individual values share a common shape, `DesignTokenValue` — `{ value, type, description? }` — with per-category specialisations such as `ColorValue` (`type: 'color'`), `SpacingValue` (`type: 'spacing'`) and `BorderRadiusValue` (`type: 'borderRadius'`). When a piece of code needs a design value, it can require a value of the appropriate type — not a raw string.

---

## Defining a Theme

The package ships one default token set (the CSS files above, with light, dark and high-contrast themed colours). You can describe your own values with the same types — here's a simplified custom set:

```typescript
import type { ColorValue, SpacingValue, BorderRadiusValue } from '@web-loom/design-core';

// Define your tokens as typed constants
const colors: Record<string, ColorValue> = {
  'color-brand-primary': { value: '#2563EB', type: 'color' },
  'color-brand-secondary': { value: '#7C3AED', type: 'color' },
  'color-surface': { value: '#FFFFFF', type: 'color' },
  'color-surface-raised': { value: '#F8FAFC', type: 'color' },
  'color-text-primary': { value: '#0F172A', type: 'color' },
  'color-text-secondary': { value: '#64748B', type: 'color' },
  'color-border': { value: '#E2E8F0', type: 'color' },
};

const spacing: Record<string, SpacingValue> = {
  'space-1': { value: '4px', type: 'spacing' },
  'space-2': { value: '8px', type: 'spacing' },
  'space-3': { value: '12px', type: 'spacing' },
  'space-4': { value: '16px', type: 'spacing' },
  'space-6': { value: '24px', type: 'spacing' },
  'space-8': { value: '32px', type: 'spacing' },
};

const radii: Record<string, BorderRadiusValue> = {
  'radius-sm': { value: '4px', type: 'borderRadius' },
  'radius-md': { value: '8px', type: 'borderRadius' },
  'radius-lg': { value: '12px', type: 'borderRadius' },
  'radius-full': { value: '9999px', type: 'borderRadius' },
};
```

---

## CSS Custom Properties as the Output

The tokens become CSS custom properties. You generate the CSS declaration block from your token definitions — typically in a `theme.css` or as a `<style>` tag injected at application startup:

```css
:root {
  --color-brand-primary: #2563eb;
  --color-brand-secondary: #7c3aed;
  --color-surface: #ffffff;
  --color-surface-raised: #f8fafc;
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-border: #e2e8f0;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

For the package's own tokens you don't need to generate anything — import the shipped CSS once (`import '@web-loom/design-core/design-system'`). The `utils` entry can also produce a declaration block from the built-in token set, or inject overrides as a theme:

```typescript
import { generateCssVariablesString, createTheme, applyTheme, setTheme } from '@web-loom/design-core/utils';

const css = await generateCssVariablesString(':root'); // built-in tokens as one CSS rule
// Note: generated names carry the token-file prefix (e.g. --colors-color-base-primary).

const brand = createTheme('brand', { /* partial token overrides */ });
await applyTheme(brand); // injects a [data-theme="brand"] rule
setTheme('brand');       // sets data-theme on <html>
```

For a hand-written token set like the one above, emitting the `:root` block is a few lines of your own code. You inject it into the document once. From that point, every component that references `var(--color-brand-primary)` in its styles is using the correct themed value.

---

## Dark Mode Through Token Redefinition

CSS custom properties cascade. The cleanest way to implement dark mode is to redefine the same token names inside a `[data-theme="dark"]` or `.dark` scope:

```css
:root {
  --color-surface: #ffffff;
  --color-surface-raised: #f8fafc;
  --color-text-primary: #0f172a;
  --color-border: #e2e8f0;
}

.dark {
  --color-surface: #0f172a;
  --color-surface-raised: #1e293b;
  --color-text-primary: #f1f5f9;
  --color-border: #334155;
}
```

Every component using `var(--color-surface)` automatically adapts when `class="dark"` is applied to an ancestor. No JavaScript. No conditional class logic in components. No `isDark ? '#0F172A' : '#FFFFFF'` in twelve places.

Your components become theme-agnostic by construction. A `Card` component uses `background: var(--color-surface)` and it's correct in both themes without knowing either theme exists.

---

## Integration With Tailwind CSS

If you're using Tailwind, you can map your CSS custom properties to Tailwind's theme config:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        border: 'var(--color-border)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
      },
    },
  },
};
```

Now `bg-surface`, `text-text-primary`, and `border-border` in Tailwind classes reference your custom properties. Your components use Tailwind utility classes. The actual values live in CSS custom properties. The theme definition lives in `design-core`. Everything is connected by convention without tight coupling.

---

## Why Not Just Use a Design System Library?

This question comes up whenever anyone ships a "design tokens" package. Why not use MUI's theme, or Ant Design's token system, or Chakra's semantic tokens?

The answer is the same as the answer to "why not use a component library for behaviour?" — these systems bundle the tokens with the components. You can't easily use MUI's token system if you're not using MUI's components. Ant Design's design tokens are expressed as JavaScript objects consumed by Ant Design's style engine, not as CSS custom properties that work with any styling approach.

`design-core` is a decoupled token system. It works with:

- Tailwind CSS (via theme config extension)
- CSS Modules (via `var()` references)
- Styled Components (via `createGlobalStyle` or CSS variables)
- Plain CSS (via the generated custom properties)
- Any other styling approach that understands CSS variables

The tokens are the contract between design decisions and implementation. The implementation can change — switch from CSS Modules to Tailwind, or from Tailwind to vanilla CSS — without changing the tokens.

---

## Using Tokens in TypeScript

Beyond CSS, the token types serve as guardrails in TypeScript code that needs to reference design values:

```typescript
import type { ColorValue } from '@web-loom/design-core';

function applyColorTokens(tokens: Record<string, ColorValue>) {
  const root = document.documentElement;
  for (const [name, token] of Object.entries(tokens)) {
    root.style.setProperty(`--${name}`, token.value);
  }
}
```

When you call `applyColorTokens`, TypeScript verifies that every value in the record is a `ColorValue` — an object with `{ value: string, type: 'color' }`. You can't accidentally pass a spacing token where a colour token is expected.

This is the token-as-contract pattern. The type enforces that the right category of design decision is used in the right context.

---

## The Broader Picture

The long-term value of a design token system is consistency across surfaces. Today your application is a web app. Tomorrow it might have a React Native mobile client, a VS Code extension, a desktop Electron app, or an AI chat interface with inline components. If your design decisions are encoded as tokens in a framework-agnostic TypeScript module, each new surface can import the same token definitions and compile them to the format it needs.

This is exactly what Salesforce, Adobe, and IBM do at scale. Their component libraries on multiple platforms share a token definition layer that's maintained by designers and expressed consistently everywhere. The token is the source of truth. The CSS variable, the Swift constant, the Android attribute — those are derived.

`@web-loom/design-core` is the foundation for this approach on a smaller scale, starting with the token types, the shipped CSS variables and the theme utilities.

---

## Installing

```bash
npm install @web-loom/design-core
```

No runtime dependencies. TypeScript types, CSS files and a small set of utilities (the theme helpers need a DOM to inject styles).

---

Next in the series: `@web-loom/mvvm-patterns`, the higher-level pattern package that adds `InteractionRequest` (ViewModel-to-View communication without coupling) and `ActiveAwareViewModel` (lifecycle-aware ViewModels for tabbed interfaces and route activation).
