# Framework-Specific Examples - UI Core

This directory contains comprehensive framework-specific examples for all UI Core behaviors.

## Available Examples

### React Examples

**File:** [REACT_EXAMPLES.md](./REACT_EXAMPLES.md)

Complete React implementations using hooks for:

- Keyboard Shortcuts (Command palette, text editor, help panel)
- Undo/Redo Stack (Text editor, drawing canvas, forms)
- Drag and Drop (Reorderable lists, kanban boards, file upload)
- Roving Focus (Enhanced with focus tracking)
- Form Behavior (Enhanced with server-side validation)

### Vue Examples

**File:** [VUE_EXAMPLES.md](./VUE_EXAMPLES.md)

Vue 3 Composition API examples for:

- Keyboard Shortcuts (Command palette, text editor, help panel)
- Undo/Redo Stack (Text editor, drawing canvas, forms)
- Drag and Drop (Reorderable lists, kanban boards, file upload)
- Roving Focus (Enhanced with focus tracking)
- Form Behavior (Enhanced with server-side validation)

### Angular Examples

**File:** [ANGULAR_EXAMPLES.md](./ANGULAR_EXAMPLES.md)

Angular service-based examples for:

- Keyboard Shortcuts (Command palette, text editor, help panel)
- Undo/Redo Stack (Text editor, drawing canvas, forms)
- Drag and Drop (Reorderable lists, kanban boards, file upload)
- Roving Focus (Enhanced with focus tracking)
- Form Behavior (Enhanced with server-side validation)

## Quick Navigation

### By Behavior

| Behavior           | React                                              | Vue                                                  | Angular                                              |
| ------------------ | -------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Keyboard Shortcuts | [Link](./REACT_EXAMPLES.md#keyboard-shortcuts)     | [Link](./VUE_EXAMPLES.md#keyboard-shortcuts)         | [Link](./ANGULAR_EXAMPLES.md#keyboard-shortcuts)     |
| Undo/Redo Stack    | [Link](./REACT_EXAMPLES.md#undoredo-stack)         | [Link](./VUE_EXAMPLES.md#undoredo-stack)             | [Link](./ANGULAR_EXAMPLES.md#undoredo-stack)         |
| Drag and Drop      | [Link](./REACT_EXAMPLES.md#drag-and-drop)          | [Link](./VUE_EXAMPLES.md#drag-and-drop)              | [Link](./ANGULAR_EXAMPLES.md#drag-and-drop)          |
| Roving Focus       | [Link](./REACT_EXAMPLES.md#roving-focus-enhanced)  | [Link](./VUE_EXAMPLES.md#roving-focus-enhanced)      | [Link](./ANGULAR_EXAMPLES.md#roving-focus-enhanced)  |
| Form Behavior      | [Link](./REACT_EXAMPLES.md#form-behavior-enhanced) | [Link](./ANGULAR_EXAMPLES.md#form-behavior-enhanced) | [Link](./ANGULAR_EXAMPLES.md#form-behavior-enhanced) |

### By Use Case

| Use Case        | Behaviors Used                      | Framework Examples                                                                                                                                                                    |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text Editor     | Keyboard Shortcuts, Undo/Redo, Form | [React](./REACT_EXAMPLES.md#complete-integration-example), [Vue](./VUE_EXAMPLES.md#complete-integration-example), [Angular](./ANGULAR_EXAMPLES.md#complete-integration-example)       |
| Command Palette | Keyboard Shortcuts                  | [React](./REACT_EXAMPLES.md#basic-command-palette), [Vue](./VUE_EXAMPLES.md#basic-command-palette), [Angular](./ANGULAR_EXAMPLES.md#basic-command-palette)                            |
| Drawing App     | Undo/Redo, Drag and Drop            | [React](./REACT_EXAMPLES.md#drawing-canvas-with-undoredo), [Vue](./VUE_EXAMPLES.md#drawing-canvas-with-undoredo), [Angular](./ANGULAR_EXAMPLES.md#drawing-canvas-with-undoredo)       |
| Kanban Board    | Drag and Drop                       | [React](./REACT_EXAMPLES.md#kanban-board), [Vue](./VUE_EXAMPLES.md#kanban-board), [Angular](./ANGULAR_EXAMPLES.md#kanban-board)                                                       |
| File Upload     | Drag and Drop                       | [React](./REACT_EXAMPLES.md#file-upload-with-drag-and-drop), [Vue](./VUE_EXAMPLES.md#file-upload-with-drag-and-drop), [Angular](./ANGULAR_EXAMPLES.md#file-upload-with-drag-and-drop) |

## Example Features

All examples include:

- ✅ Full TypeScript support
- ✅ Accessibility best practices (ARIA attributes, keyboard navigation)
- ✅ Proper cleanup and resource management
- ✅ Error handling
- ✅ Performance optimization (throttling, debouncing)
- ✅ Responsive design considerations
- ✅ Real-world use cases

## Getting Started

1. Choose your framework (React, Vue, or Angular)
2. Navigate to the corresponding examples file
3. Find the behavior or use case you're interested in
4. Copy the example code and adapt it to your needs

## Best Practices

Each framework example document includes a "Best Practices" section covering:

- Resource cleanup and lifecycle management
- Performance optimization techniques
- Accessibility guidelines
- TypeScript usage tips
- Common patterns and anti-patterns

## Contributing

When adding new examples:

1. Follow the existing format and structure
2. Include complete, working code examples
3. Add accessibility considerations
4. Include TypeScript types
5. Document any framework-specific patterns
6. Add the example to all three framework files (React, Vue, Angular)

## Related Documentation

- [UI Core README](../../README.md) - Main UI Core documentation
- [API Reference](../README.md) - Complete API documentation
- [UI Patterns Examples](../../../ui-patterns/docs/examples/README.md) - Pattern examples

## License

MIT
