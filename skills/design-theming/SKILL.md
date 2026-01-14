---
name: design-theming
description: Use `@web-loom/design-core` to theme apps with a flat/paper look and follow the UX/UI guidance captured in `apps/mvvm-react-integrated`. Trigger this skill for theming questions, setting up token+theme pipelines, or aligning new screens with the repo’s flat design system.
---

# Design theming with Design Core

Apply this skill whenever the task is about theming an app/package, explaining flat/paper design choices, or wiring the Design Core tokens/custom CSS into a workspace UI (React, Angular, Vue, or vanilla). The reference integration lives in `apps/mvvm-react-integrated/DESIGN-SYSTEM-INTEGRATION.md`, which mirrors the `packages/design-core/README.md` token+utility APIs.

## Build your theme stack

- Load tokens early: import `@web-loom/design-core/src/css/*.css` (or `design-system`) before the app renders so CSS variables are ready for layout and component styles. Use `generateCssVariablesString`/`applyTheme` to inject runtime CSS when you need to compute tokens in JS.
- Compose semantic overrides in `apps/mvvm-react-integrated/src/styles/tokens.css` (e.g., `--card-bg`, `--card-border`) so the flat/paper look stays consistent. Keep those semantic tokens tied to Design Core values and share them across components.
- Mirror the integration architecture diagram (app components → semantic tokens → design-core tokens → ThemeProvider) by introducing a `ThemeProvider` that loads both light/dark overrides and exposes `useTheme`/`toggleTheme` hooks. Persist the preference (localStorage + `prefers-color-scheme`) and always expose `setTheme(themeName)` to update the `[data-theme]` attribute.

## Flat/paper UI guidelines

- Emphasize solid backgrounds and visible borders instead of gradients or dramatic shadows. Use tokens like `--colors-background-surface`, `--shadows-sm`, `--card-border`, and `--radii-md` to achieve the paper feel described in the reference doc.
- Prefer bold typography, clear spacing (`--spacing-m`, `--spacing-l`), and saturated brand colors (blue/purple/green/red) for actionable elements. Keep hover/focus states subtle (slight border color changes or `translateY(-1px)` lifts) to stay on the flat design spectrum.
- Ensure accessibility: focus rings (`outline: 2px solid var(--colors-brand-primary)`), WCAG AA contrast for light/dark tokens, and screen-reader friendly semantics for interactive controls (ARIA labels, keyboard navigation).

## Component and theme verification

- Use the existing cards, buttons, headers, and dashboard styles in `apps/mvvm-react-integrated` as examples—copy the class patterns (`.card`, `.page-header`, `.nav-link`) and update them to consume semantic tokens.
- When introducing new layouts, verify both themes (light/dark) by toggling the ThemeProvider switch and re-running `npm run dev` for that app. Automated tests can `setTheme('light')`/`setTheme('dark')` before snapshotting UI.
- Document any new color/spacing tokens you add beside the existing `styles/tokens.css` entries so future designers know the flat/paper language you are extending.

Refer to [references/design-core-flat-guidelines.md](references/design-core-flat-guidelines.md) for the distilled instructions from the integration guide, and consult `packages/design-core/README.md` whenever you need implementation specifics (token APIs, utilities, CSS imports).
