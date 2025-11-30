# UI Patterns Documentation

This directory contains comprehensive documentation for all patterns in the `@web-loom/ui-patterns` package.

## Available Pattern Documentation

### Macro Patterns

These are higher-level patterns that compose multiple behaviors to create complete interaction patterns:

- **[Hub & Spoke Navigation](./HUB_AND_SPOKE.md)** - Central hub navigation with independent spoke pages
  - Perfect for settings interfaces, dashboards, and multi-section applications
  - Features: Breadcrumb tracking, nested spokes, browser history integration
  - Bundle size: ~1.9KB gzipped

- **[Grid/Card Layout](./GRID_LAYOUT.md)** - Responsive grid layouts with keyboard navigation
  - Ideal for photo galleries, product grids, and dashboards
  - Features: 2D keyboard navigation, responsive breakpoints, multi-selection
  - Bundle size: ~2.8KB gzipped

- **[Floating Action Button](./FLOATING_ACTION_BUTTON.md)** - Scroll-aware primary action button
  - Great for scroll-to-top, create actions, and context-aware buttons
  - Features: Scroll direction detection, threshold-based visibility, hide-on-scroll
  - Bundle size: ~0.9KB gzipped

### Core Patterns

For documentation on core patterns (Master-Detail, Wizard, Modal, etc.), see the main [README](../README.md).

## Documentation Structure

Each pattern documentation includes:

1. **Overview** - Purpose and key features
2. **Installation** - How to install the package
3. **Basic Usage** - Simple examples to get started
4. **API Reference** - Complete interface documentation
5. **Advanced Usage** - Complex scenarios and patterns
6. **Framework Integration** - React, Vue, and Angular examples
7. **Accessibility Guidelines** - WCAG 2.1 Level AA compliance
8. **TypeScript Support** - Type definitions and examples
9. **Performance Considerations** - Optimization tips
10. **Common Patterns** - Real-world use cases

## Quick Start

```bash
npm install @web-loom/ui-patterns
```

```typescript
import { createHubAndSpoke, createGridLayout, createFloatingActionButton } from '@web-loom/ui-patterns';

// Hub & Spoke Navigation
const navigation = createHubAndSpoke({
  spokes: [
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
  ],
});

// Grid Layout
const grid = createGridLayout({
  items: photos,
  getId: (photo) => photo.id,
  breakpoints: [
    { minWidth: 0, columns: 1 },
    { minWidth: 768, columns: 3 },
  ],
});

// Floating Action Button
const fab = createFloatingActionButton({
  scrollThreshold: 200,
  hideOnScrollDown: true,
});
```

## Framework Support

All patterns support:

- ✅ React (via hooks)
- ✅ Vue (via composables)
- ✅ Angular (via services)
- ✅ Vanilla JavaScript

## Accessibility

All patterns are designed with accessibility in mind:

- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader announcements
- ARIA attributes and roles
- Focus management

## TypeScript

Full TypeScript support with:

- Complete type definitions
- Exported interfaces
- Generic type support
- Type-safe configuration

## Performance

All patterns are optimized for performance:

- Minimal bundle sizes (<3KB gzipped)
- Tree-shakeable exports
- Efficient state management
- Event delegation where applicable
- Throttled/debounced event handlers

## Contributing

Found an issue or want to improve the documentation? Please open an issue or pull request on our [GitHub repository](https://github.com/your-org/web-loom).

## License

MIT
