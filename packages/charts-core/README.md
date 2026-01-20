# @web-loom/charts-core

`@web-loom/charts-core` is a framework-agnostic, configuration-based charting foundation built on D3.js. The package prioritizes a performant, accessible default experience for time-series line charts while exposing enough hooks to layer axes, annotations, tooltips, and plugins inside any modern framework.

## Highlights

- **Configuration-first API:** Define series, axes, tooltips, and accessibility details through a single `ChartConfig` object inspired by the product requirements document.
- **Tree-shakable assembly:** Consumers import only the pieces they need — core manager, series, axes, annotations, tooltip helpers, and plugin hooks share the same TypeScript bundle.
- **D3-powered internals:** Scale registries and rendering utilities lean on D3.js primitives so consumers can extend axis, series, and tooltip logic with familiar APIs.
- **Framework neutrality:** The library only exposes DOM helpers (SVG, div wrappers, tooltip overlays) so React, Vue, Angular, or vanilla apps can hook into the rendering lifecycle.

## API & Extensibility

- `ChartManager` exposes imperative helpers (`addScale`, `addSeries`, `addAxis`, `addAnnotation`, `getScale`, `getTooltipManager`, `getContainer`) for integrations that need fine-grained control over the rendering lifecycle.
- Use the exported `ChartPlugin` contract to plug in behaviors such as zooming, tooltips, or data-savvy interactions. The built-in `ZoomPanPlugin` ships with a minimal wheel-to-scale experience and shows how plugins interact with the manager.
- Re-exported pieces (`Series`, `AxisRenderer`, `TooltipManager`, `AnnotationLayer`, `ScaleRegistry`, plugins, etc.) let consumers tree-shake only what they import while still accessing shared helpers.

## Getting started

Install the package as part of this monorepo or via npm/yarn/pnpm once published.

```bash
npm install @web-loom/charts-core
# or
pnpm add @web-loom/charts-core
```

```ts
import { ChartManager } from '@web-loom/charts-core';

const chart = new ChartManager({
  width: 800,
  height: 400,
  margin: { top: 24, right: 32, bottom: 32, left: 42 },
  localization: { locale: 'en-US' },
  animation: { duration: 200 },
  accessibility: { ariaLabel: 'Time series' },
});

chart.render('#chart');
```

## Examples & demos

- The [`docs/config-first-demo.md`](./docs/config-first-demo.md) text walks through the config-first render path and how the built-in `ZoomPanPlugin` wires into the lifecycle for wheel-based zooming.
- A pair of Storybook entries live in [`stories/charts-core.stories.ts`](./stories/charts-core.stories.ts); they mount the same configuration twice (with and without the plugin) so you can snapshot the DOM or confirm the plugin hooks without embedding the chart in a framework.
- Start a Storybook dev server for these demos via `npm run storybook` (the package-level script points at `.storybook/main.ts`).

> For the complete product vision, implementation notes, and MVP checklist see [`PRODUCTS_REQUIREMENT_DOCUMENT.md`](./PRODUCTS_REQUIREMENT_DOCUMENT.md).
