# Task List for @web-loom/charts-core

This package follows the requirements in `PRODUCTS_REQUIREMENT_DOCUMENT.md`. Work is grouped by capability so future coding agents can pick a logical milestone and deliverable.

## 1. Foundation

- **Establish packaging + tooling**: confirm `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.js`, and README align with PRD sections 2.1, 2.3, and 5.2 (bundling formats, TypeScript declarations, docs).
- **Document dependencies & peers**: ensure D3 peers, `date-fns`, and tooling libs match PRD dependencies (Section 13). Add any new runtime peers before release.
- **Share TS configs**: reference `packages/typescript-config/base.json` and extend or override for library needs; include appropriate excludes/targets.

## 2. Core Architecture

- **ChartManager lifecycle** (Section 4.1.1): implement configuration ingestion, DOM mounting, series/axis/annotation registration, scale registry interactions, and cleanup (`destroy`, `update`, `render`). Provide plugin hooks (`use`, `uninstall`).
- **Scale registry** (Section 4.1.2): wrap `d3-scale` continuums with registry helpers to create, update, and expose scales by id; add helpers to sync domains/ranges.
- **Series abstraction** (Section 4.1.2): build base `Series` class plus `LineSeries` and (later) `AreaSeries`/others. Enforce tooltip metadata and data updates.
- **Axis renderer** (Section 3.1.1, 3.2.3): map axis configs to DOM layers, support left/right orientations, make it easy to extend with D3 axis generators, and honor a `visible` flag so axes can be hidden when minimalism is desired.
- **Axis theming** (Section 3.1.6): add axis style defaults inspired by Chart.js (muted strokes, polished tick fonts, optional dashed grid lines) plus per-axis overrides so teams can keep the axis in-check without custom CSS hacks.
- **Annotation & Tooltip layers** (Sections 3.1.5 & 3.1.4): render annotation metadata and tooltip overlays that can be shared across components; ensure tooltips honor strategies (follow/fixed) and formatting.

## 3. MVP Feature Set

- **Time-series line graphs** (Section 3.1.1): support date-based x-axis, multiple y-axes, smoothing/interpolation, area fill toggles, and customizable markers by exposing config flags.
- **Configuration API** (Section 3.1.2 & 3.2): design `ChartConfig`, `SeriesConfig`, `AxisConfig`, `TooltipConfig`, `AnnotationConfig` types and builder helpers so consumer code can declare charts declaratively and instantiate `ChartManager` imperatively.
- **Localization + accessibility** (Sections 3.1.3 & 8): integrate `date-fns` formatters, number/localization helpers, aria labels, keyboard navigation toggles, and color/accessibility guidance.
- **Tooltip system** (Section 3.1.4): provide hover/focus detection, multi-series data support, custom tooltip formatters, and positioning strategies. Tie into series render updates.
- **Annotations & icons** (Section 3.1.5 & 5.3): support attaching icons/text to data points with optional tooltips, enabling z-index layering for SVG overlays.

## 4. API & Extensibility

- **Plugin interface** (Section 4.2): define `ChartPlugin` contract with `install`, `uninstall`, and unique `id`. Implement sample plugin scaffolding (e.g., zoom/pan, tooltip enhancements).
- **Series, axis, tooltip exports**: re-export key classes/types from `src/index.ts` so consumers can tree-shake needed bits (Section 3.2.1).
- **Imperative helpers**: expose `addScale`, `addSeries`, `addAxis`, `addAnnotation`, `getScale`, `getTooltipManager` for framework integrations wanting fine-grained control (Section 3.2.3).

## 5. Testing & Examples

- **Unit tests** (Section 9.1): use Vitest for core helpers (scale registry, config validation, tooltip formatting). Mock D3 when needed.
- **Integration tests** (Section 9.2): add jsdom-based tests that simulate rendering ChartManager with axis/series configs.
- **Visual regression / demos** (Section 9.3): author demo pages/storybook entry showing config-first usage and plugin integration.

## 6. Performance & Maintenance

- **Rendering optimizations** (Section 7.1): debounce resize/redraw, consider canvas fallback hooks, and prepare for possible worker-based data processing.
- **Memory/accessibility guards** (Section 7.2 & 8.1): ensure cleanup removes D3 listeners, uses ARIA roles, and manages focusable elements.
- **Success metrics tracking** (Section 12): keep note of bundle size targets (<50kb gzipped) and performance metrics for future profiling.

## 7. Roadmap & Extensions

- **Phase-based milestones** (Section 10): align tasks with Phase 1 foundations (core manager, scales), Phase 2 MVP features (time series, tooltips, annotations), Phase 3 polish (localization, accessibility), and Phase 4 integrations (React/Vue/Angular adapters).
- **Non-goals reminder** (Section 11): explicitly avoid legends/pie/bar/3D/export features until after Phase 4.

Use this document to divide work across coding agents; each item can be broken into sub-tasks (could also be tracked as GitHub issues) for focused implementation and verification cycles.
