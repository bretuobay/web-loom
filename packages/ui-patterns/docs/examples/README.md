# Framework-Specific Examples - UI Patterns

This directory contains comprehensive framework-specific examples for all UI Patterns.

## Available Examples

### React Examples
**File:** [REACT_EXAMPLES.md](./REACT_EXAMPLES.md)

Complete React implementations using hooks for:
- Hub & Spoke Navigation (Settings interface, nested spokes)
- Grid/Card Layout (Photo gallery, product grid)
- Floating Action Button (Scroll-aware, create item)
- Modal (Enhanced with escape and backdrop options)
- Sidebar Shell (Enhanced with mobile mode)
- Toast Queue (Enhanced with position configuration)
- Tabbed Interface (Enhanced with keyboard navigation)
- Command Palette (Enhanced with navigation methods)

### Vue Examples
**File:** [VUE_EXAMPLES.md](./VUE_EXAMPLES.md) *(To be created)*

Vue 3 Composition API examples for all patterns listed above.

### Angular Examples
**File:** [ANGULAR_EXAMPLES.md](./ANGULAR_EXAMPLES.md) *(To be created)*

Angular service-based examples for all patterns listed above.

## Quick Navigation

### By Pattern

| Pattern | React | Vue | Angular |
|---------|-------|-----|---------|
| Hub & Spoke Navigation | [Link](./REACT_EXAMPLES.md#hub--spoke-navigation) | Coming Soon | Coming Soon |
| Grid/Card Layout | [Link](./REACT_EXAMPLES.md#gridcard-layout) | Coming Soon | Coming Soon |
| Floating Action Button | [Link](./REACT_EXAMPLES.md#floating-action-button) | Coming Soon | Coming Soon |
| Modal (Enhanced) | [Link](./REACT_EXAMPLES.md#modal-enhanced) | Coming Soon | Coming Soon |
| Sidebar Shell (Enhanced) | [Link](./REACT_EXAMPLES.md#sidebar-shell-enhanced) | Coming Soon | Coming Soon |
| Toast Queue (Enhanced) | [Link](./REACT_EXAMPLES.md#toast-queue-enhanced) | Coming Soon | Coming Soon |
| Tabbed Interface (Enhanced) | [Link](./REACT_EXAMPLES.md#tabbed-interface-enhanced) | Coming Soon | Coming Soon |
| Command Palette (Enhanced) | [Link](./REACT_EXAMPLES.md#command-palette-enhanced) | Coming Soon | Coming Soon |

### By Use Case

| Use Case | Patterns Used | Framework Examples |
|----------|---------------|-------------------|
| Settings Interface | Hub & Spoke | [React](./REACT_EXAMPLES.md#basic-settings-interface) |
| Photo Gallery | Grid Layout | [React](./REACT_EXAMPLES.md#photo-gallery) |
| Product Catalog | Grid Layout | [React](./REACT_EXAMPLES.md#product-grid) |
| Scroll-to-Top | Floating Action Button | [React](./REACT_EXAMPLES.md#scroll-aware-fab) |
| Responsive App Layout | Sidebar Shell | [React](./REACT_EXAMPLES.md#responsive-sidebar-with-mobile-mode) |
| Notification System | Toast Queue | [React](./REACT_EXAMPLES.md#toast-with-position-configuration) |
| Tabbed Content | Tabbed Interface | [React](./REACT_EXAMPLES.md#tabs-with-keyboard-navigation) |
| Quick Actions | Command Palette | [React](./REACT_EXAMPLES.md#command-palette-with-navigation) |

## Example Features

All examples include:
- ✅ Full TypeScript support
- ✅ Accessibility best practices (ARIA attributes, keyboard navigation)
- ✅ Proper cleanup and resource management
- ✅ Responsive design patterns
- ✅ Performance optimization (throttling, debouncing)
- ✅ Real-world use cases
- ✅ Integration with routing libraries (where applicable)

## Getting Started

1. Choose your framework (React, Vue, or Angular)
2. Navigate to the corresponding examples file
3. Find the pattern or use case you're interested in
4. Copy the example code and adapt it to your needs

## Pattern Enhancements

All patterns include enhancements from the gap closure work:

### Modal
- `closeOnEscape` option
- `closeOnBackdropClick` option
- Event emission for escape and backdrop clicks

### Sidebar Shell
- Mobile mode support
- Auto-collapse on mobile
- `toggleMobile` and `setMobileMode` actions

### Toast Queue
- Position configuration (6 positions)
- `setPosition` action
- Position change events

### Tabbed Interface
- `focusNextTab` convenience method
- `focusPreviousTab` convenience method
- Improved keyboard navigation

### Command Palette
- `selectNext` convenience method
- `selectPrevious` convenience method
- `executeSelected` action

## Best Practices

Each framework example document includes a "Best Practices" section covering:
- Resource cleanup and lifecycle management
- Performance optimization techniques
- Accessibility guidelines
- Responsive design patterns
- TypeScript usage tips
- Common patterns and anti-patterns

## Integration with UI Core

Many patterns work best when combined with UI Core behaviors:

| Pattern | Recommended UI Core Behaviors |
|---------|------------------------------|
| Hub & Spoke | Keyboard Shortcuts (for navigation) |
| Grid Layout | Roving Focus (for keyboard navigation) |
| Command Palette | Keyboard Shortcuts (for opening/closing) |
| Modal | Keyboard Shortcuts (for escape key) |
| Tabbed Interface | Roving Focus (for tab navigation) |

See the [UI Core Examples](../../../ui-core/docs/examples/README.md) for behavior examples.

## Contributing

When adding new examples:
1. Follow the existing format and structure
2. Include complete, working code examples
3. Add accessibility considerations
4. Include TypeScript types
5. Document any framework-specific patterns
6. Add the example to all three framework files (React, Vue, Angular)

## Related Documentation

- [UI Patterns README](../../README.md) - Main UI Patterns documentation
- [Hub & Spoke Documentation](../HUB_AND_SPOKE.md) - Complete API reference
- [Grid Layout Documentation](../GRID_LAYOUT.md) - Complete API reference
- [Floating Action Button Documentation](../FLOATING_ACTION_BUTTON.md) - Complete API reference
- [Pattern Enhancements Documentation](../PATTERN_ENHANCEMENTS.md) - Enhancement details
- [UI Core Examples](../../../ui-core/docs/examples/README.md) - Behavior examples

## License

MIT
