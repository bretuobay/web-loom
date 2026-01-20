# Config-first demo & plugin integration

This document captures the visual regression/demo story for `@web-loom/charts-core`. The story file at `stories/charts-core.stories.ts` showcases how to compose a chart through configuration and how plugins (like `ZoomPanPlugin`) hook into that declarative surface.

## Config-first story

- `ConfigFirst` mounts a chart with shared tooltips, a time-based x-axis, and a left-aligned value axis. The helper functions inside the story build the `ChartConfig` object, render the chart directly into a temporary DOM node, and then hand the DOM tree back to Storybook so the preview stays live without re-running `render`.
- The core snippet looks like this:

```ts
const config: ChartConfig = {
  width: 760,
  height: 420,
  margin: { top: 24, right: 32, bottom: 40, left: 50 },
  localization: { locale: 'en-US', dateFormat: 'MMM dd' },
  axes: [
    { id: 'time', orient: 'bottom', scale: 'time-x' },
    { id: 'value', orient: 'left', scale: 'value-y' },
  ],
  series: [
    {
      type: 'line',
      data: timeline,
      xAccessor: (datum) => datum.x,
      yAccessor: (datum) => datum.y,
    },
  ],
  tooltip: { enabled: true, shared: true, strategy: 'follow' },
};

const chart = new ChartManager(config);
chart.render(`#${containerId}`);
```

## Plugin-enhanced story

- `PluginEnhanced` reuses the same config but also registers the built-in `ZoomPanPlugin`. The story mentions that the plugin listens for wheel gestures on the chart container and scales the host node accordingly, demonstrating how plugins can augment interactivity without touching the chart internals.
- The plugin registration happens via `chart.use(new ZoomPanPlugin({ zoomStep: 1.2 }))` before the call to `render` so the manager ensures `install`/`uninstall` are invoked alongside the lifecycle hooks.

## Running the demo

Integrate the `stories/charts-core.stories.ts` file into your Storybook setup (for example, by adding `packages/charts-core/stories/**/*` to the `stories` array). Once Storybook is running, the two examples provide a quick way to catch regressions and to see plugin integration in the browser without wiring additional framework wrappers.
