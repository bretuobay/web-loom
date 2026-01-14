# Flat/paper theming checklist

Summarizes `apps/mvvm-react-integrated/DESIGN-SYSTEM-INTEGRATION.md` plus the design-core docs:

1. **Architecture snapshot**
   - Design Core tokens sit underneath semantic `tokens.css`, which feed into components.
   - ThemeProvider loads both light and dark themes, persists preference, respects `prefers-color-scheme`, and exposes `useTheme`.
   - Theme overrides follow `[data-theme="name"]` selectors via `applyTheme`/`setTheme`.

2. **Token usage**
   - Base tokens: `colors`, `spacing`, `typography`, `shadows`, `radii`, `borders`, `transitions`, `opacity`, `zIndex`.
   - Semantic tokens (cards, headers, buttons) alias Core tokens (`--card-bg: var(--colors-background-surface)`).
   - Use `generateCssVariablesString`/`applyTheme` when token values need to be computed or dynamically changed.

3. **Flat/paper guidelines**
   - No gradients; each surface uses solid fills from Core colors.
   - Minimal, subtle shadows (`--shadows-sm`, `--shadows-md`) plus bold borders (`2px var(--card-border)`).
   - Saturated brand colors (bright blue/purple/green/red) for actions, high-contrast text colors for readability.
   - Simple shapes (8px radii), consistent spacing scale (`xs`→`xl`), and typography weights (400/500/600/700).
   - Focus states, hover states, and button interactions rely on color/border tweaks rather than depth.

4. **Responsive + accessibility**
   - Breakpoints defined via tokens (`--grid-columns-sm/md/lg/xl`) and applied through media queries.
   - WCAG AA color contrast by choosing token pairs for backgrounds/text.
   - Focus outlines (`outline: 2px solid var(--colors-brand-primary)`), keyboard accessible controls, meaningful ARIA labels.

5. **Verification**
   - Toggle ThemeProvider to test both light and dark themes; auto tests can `setTheme` before assertions.
   - Use dev server (`npm run dev` or Turbo filter) to preview theme updates.
   - Document new semantic tokens in `styles/tokens.css` so future themes reuse the same language.

6. **Related packages**
   - `packages/design-core/README.md` for token APIs and CSS utilities.
   - `apps/mvvm-react-integrated` for component examples plus `ThemeProvider`, `ThemeToggle`, `tokens.css`.
