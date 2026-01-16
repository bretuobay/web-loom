# Design Theming

Use `@web-loom/design-core` to theme apps with a flat/paper look. Reference implementation: `apps/mvvm-react-integrated`.

## Theme Stack Architecture

```
App Components → Semantic Tokens → Design Core Tokens → ThemeProvider
```

### Setup Steps

1. **Load tokens early** - Import `@web-loom/design-core/src/css/*.css` before app renders
2. **Compose semantic overrides** in `styles/tokens.css` (e.g., `--card-bg`, `--card-border`)
3. **Implement ThemeProvider** that:
   - Loads light/dark theme overrides
   - Exposes `useTheme`/`toggleTheme` hooks
   - Persists preference (localStorage + `prefers-color-scheme`)
   - Updates `[data-theme]` attribute via `setTheme(themeName)`

## Token System

### Base Tokens

- `colors` - Background, text, brand colors
- `spacing` - xs, s, m, l, xl scale
- `typography` - Font families, sizes, weights
- `shadows` - sm, md, lg elevations
- `radii` - Border radius values
- `borders` - Border widths and styles
- `transitions` - Animation timing
- `opacity` - Transparency levels
- `zIndex` - Stacking order

### Semantic Tokens

Alias core tokens for component-specific use:

```css
--card-bg: var(--colors-background-surface);
--card-border: var(--colors-border-default);
--button-primary: var(--colors-brand-primary);
```

### Dynamic Theming

Use `generateCssVariablesString`/`applyTheme` when tokens need runtime computation:

```typescript
import { applyTheme } from '@web-loom/design-core';
applyTheme('dark');
```

## Flat/Paper UI Guidelines

### Visual Principles

- **No gradients** - Use solid fills from core colors
- **Minimal shadows** - `--shadows-sm`, `--shadows-md` only
- **Bold borders** - `2px var(--card-border)` for definition
- **Saturated brand colors** - Bright blue/purple/green/red for actions
- **Simple shapes** - 8px radii consistently
- **Consistent spacing** - Follow xs→xl scale

### Interaction States

- **Hover** - Subtle border color changes or `translateY(-1px)` lifts
- **Focus** - `outline: 2px solid var(--colors-brand-primary)`
- **Active** - Slight color/border tweaks, no depth changes

### Typography

- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Clear hierarchy with size scale
- High contrast for readability

## Accessibility

- **Focus rings** - `outline: 2px solid var(--colors-brand-primary)`
- **WCAG AA contrast** - Choose token pairs for backgrounds/text
- **Keyboard navigation** - All interactive controls accessible
- **ARIA labels** - Meaningful labels for screen readers

### Responsive Design

- Breakpoints via tokens: `--grid-columns-sm/md/lg/xl`
- Apply through media queries
- Mobile-first approach

## Component Patterns

Reference components in `apps/mvvm-react-integrated`:

- `.card` - Surface with border and subtle shadow
- `.page-header` - Title area with consistent spacing
- `.nav-link` - Navigation with hover states
- `.button` - Primary/secondary variants

## Verification Checklist

1. Toggle ThemeProvider to test both light and dark themes
2. Run `npm run dev` to preview theme updates
3. Auto tests can `setTheme('light')`/`setTheme('dark')` before assertions
4. Document new semantic tokens in `styles/tokens.css`

## Related Resources

- `packages/design-core/README.md` - Token APIs and CSS utilities
- `apps/mvvm-react-integrated/DESIGN-SYSTEM-INTEGRATION.md` - Integration guide
- `apps/mvvm-react-integrated/src/styles/tokens.css` - Semantic token examples
