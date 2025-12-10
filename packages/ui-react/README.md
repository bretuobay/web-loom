# @repo/ui-react

A comprehensive React component library built on top of the Web Loom UI ecosystem, providing production-ready components with built-in accessibility, theming, and behavior management.

## Overview

`@repo/ui-react` is a React-specific implementation that seamlessly integrates three framework-agnostic Web Loom libraries:

1. **@web-loom/design-core** - Design system with CSS variables, themes, and styling utilities
2. **@web-loom/ui-core** - Headless UI behaviors (dialog, disclosure, form, keyboard shortcuts, etc.)
3. **@web-loom/ui-patterns** - Composed patterns (master-detail, wizard, modal, command palette, etc.)

This integration provides a complete solution for building modern web applications with React while maintaining the flexibility and reusability of framework-agnostic core libraries.

## Architecture

```
@repo/ui-react (React Components)
    ↓
    ├── @web-loom/design-core (Theming & Styles)
    ├── @web-loom/ui-core (Headless Behaviors)
    └── @web-loom/ui-patterns (Composed Patterns)
         ↓
         ├── @web-loom/store-core (State Management)
         └── @web-loom/event-bus-core (Event System)
```

## Package Integration Pattern

This package demonstrates the **Sibling Package Integration Pattern** used throughout the Web Loom monorepo. This pattern ensures seamless development and production builds while maintaining proper type safety.

### Integration Steps

#### 1. Add Dependencies

Add sibling packages to `package.json`:

```json
{
  "dependencies": {
    "@web-loom/design-core": "*",
    "@web-loom/ui-core": "*",
    "@web-loom/ui-patterns": "*",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  }
}
```

**Note**: Use `"*"` for workspace packages to leverage Turborepo's internal dependency resolution.

#### 2. Configure TypeScript Path Mappings

Update `tsconfig.json` to map sibling packages to their source files:

```json
{
  "compilerOptions": {
    "paths": {
      "@web-loom/design-core": ["../design-core/src/index.ts"],
      "@web-loom/ui-core": ["../ui-core/src/index.ts"],
      "@web-loom/ui-core/*": ["../ui-core/src/*"],
      "@web-loom/ui-patterns": ["../ui-patterns/src/index.ts"],
      "@web-loom/ui-patterns/*": ["../ui-patterns/src/*"],
      "@web-loom/store-core": ["../store-core/src/index.ts"],
      "@web-loom/event-bus-core": ["../event-bus-core/src/index.ts"]
    }
  }
}
```

**Benefits**:
- TypeScript resolves to source files for better intellisense
- Jump-to-definition navigates to source, not built files
- Type checking across package boundaries
- Refactoring works across packages

#### 3. Configure Vite Aliases

Update `vite.config.ts` to resolve imports during builds:

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@web-loom/design-core': resolve(__dirname, '../design-core/src/index.ts'),
      '@web-loom/ui-core': resolve(__dirname, '../ui-core/src/index.ts'),
      '@web-loom/ui-patterns': resolve(__dirname, '../ui-patterns/src/index.ts'),
      '@web-loom/store-core': resolve(__dirname, '../store-core/src/index.ts'),
      '@web-loom/event-bus-core': resolve(__dirname, '../event-bus-core/src/index.ts'),
    },
  },
});
```

**Benefits**:
- Vite resolves imports during development and build
- Hot module replacement works across packages
- Faster builds by avoiding pre-built artifacts
- Source maps point to original source

#### 4. Mark Dependencies as External

Configure Rollup to externalize sibling packages:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        '@web-loom/design-core',
        '@web-loom/ui-core',
        '@web-loom/ui-patterns',
        '@web-loom/store-core',
        '@web-loom/event-bus-core',
      ],
    },
  },
});
```

**Benefits**:
- Prevents bundling sibling packages into your package
- Reduces bundle size
- Avoids duplicate code in consuming applications
- Maintains proper dependency graph

#### 5. Add Build Scripts

Add development and build scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "check-types": "tsc --noEmit"
  }
}
```

## Usage

### Using Design System

```typescript
import { Button } from '@repo/ui-react';
import '@web-loom/design-core/design-system';

function App() {
  return (
    <Button variant="primary">
      Click me
    </Button>
  );
}
```

### Using UI Core Behaviors

```typescript
import { useDialog } from '@repo/ui-react';

function MyComponent() {
  const dialog = useDialog({
    id: 'my-dialog',
    onOpen: () => console.log('Dialog opened'),
  });

  return (
    <div>
      <button onClick={() => dialog.actions.open()}>
        Open Dialog
      </button>

      {dialog.state.isOpen && (
        <div role="dialog">
          <h2>{dialog.state.title}</h2>
          <button onClick={() => dialog.actions.close()}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
```

### Using UI Patterns

```typescript
import { useMasterDetail } from '@repo/ui-react';

function DataBrowser() {
  const masterDetail = useMasterDetail({
    items: data,
    getId: (item) => item.id,
    onSelectionChange: (item) => {
      console.log('Selected:', item);
    },
  });

  return (
    <div className="master-detail">
      <aside className="master">
        {masterDetail.state.items.map(item => (
          <div
            key={item.id}
            onClick={() => masterDetail.actions.selectItem(item)}
            className={masterDetail.state.selectedItem?.id === item.id ? 'active' : ''}
          >
            {item.name}
          </div>
        ))}
      </aside>

      <main className="detail">
        {masterDetail.state.selectedItem && (
          <div>
            <h2>{masterDetail.state.selectedItem.name}</h2>
            <p>{masterDetail.state.selectedItem.description}</p>
          </div>
        )}
      </main>
    </div>
  );
}
```

## Key Integration Patterns

### Pattern 1: Direct Import

Import behaviors and patterns directly:

```typescript
import { createDialogBehavior } from '@web-loom/ui-core';
import { createWizard } from '@web-loom/ui-patterns';
```

### Pattern 2: React Hooks Wrapper

Create React hooks that wrap behaviors:

```typescript
import { createDialogBehavior } from '@web-loom/ui-core/behaviors/dialog';
import { useEffect, useState } from 'react';

export function useDialog(config) {
  const [dialog] = useState(() => createDialogBehavior(config));
  const [state, setState] = useState(dialog.getState());

  useEffect(() => {
    const unsubscribe = dialog.subscribe(setState);
    return unsubscribe;
  }, [dialog]);

  return { state, actions: dialog.actions };
}
```

### Pattern 3: Component Composition

Build React components using behaviors:

```typescript
import { useDialog } from '@repo/ui-react/hooks';

export function Dialog({ children, ...props }) {
  const dialog = useDialog(props);

  if (!dialog.state.isOpen) return null;

  return (
    <div role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

## Development Workflow

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

### 3. Type Checking

```bash
npm run check-types
```

### 4. Run Tests

```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### 5. Build for Production

```bash
npm run build
```

### 6. Storybook Development

```bash
npm run storybook
```

## Troubleshooting

### Issue: TypeScript can't find sibling packages

**Solution**: Ensure `tsconfig.json` has correct path mappings and the sibling packages exist.

```bash
# Check if sibling packages exist
ls -la ../design-core/src/index.ts
ls -la ../ui-core/src/index.ts
ls -la ../ui-patterns/src/index.ts
```

### Issue: Vite build fails with "cannot find module"

**Solution**: Check that `vite.config.ts` has correct alias paths and `resolve()` uses `__dirname`.

### Issue: Circular dependencies

**Solution**:
1. Check import statements - avoid deep imports that could create cycles
2. Use the barrel exports (`index.ts`) instead of direct file imports
3. Review dependency graph in `package.json`

### Issue: Hot reload not working across packages

**Solution**: Restart the dev server and ensure all sibling packages have `dev` or `build` scripts running.

## Best Practices

### 1. Use Barrel Exports

Always import from package root:

```typescript
// ✅ Good
import { createDialog } from '@web-loom/ui-core';

// ❌ Avoid (unless needed for tree-shaking)
import { createDialog } from '@web-loom/ui-core/behaviors/dialog';
```

### 2. Keep Dependencies Updated

Ensure all sibling packages use the same versions of shared dependencies:

```bash
# Check versions across packages
npm list @web-loom/store-core
```

### 3. Follow the Dependency Graph

Respect the dependency hierarchy:
- Components depend on behaviors/patterns
- Patterns depend on behaviors
- Behaviors depend on store/event-bus
- Design system is independent

### 4. Document Component APIs

Provide clear documentation for components that wrap behaviors:

```typescript
/**
 * Dialog component built on @web-loom/ui-core dialog behavior
 *
 * @example
 * <Dialog isOpen={isOpen} onClose={handleClose}>
 *   <Dialog.Title>My Dialog</Dialog.Title>
 *   <Dialog.Content>Content here</Dialog.Content>
 * </Dialog>
 */
```

## Testing Integration

### Unit Tests

Test components using behaviors:

```typescript
import { render, screen } from '@testing-library/react';
import { Dialog } from './Dialog';

test('dialog opens and closes', () => {
  const { rerender } = render(<Dialog isOpen={false} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  rerender(<Dialog isOpen={true} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

### Integration Tests

Test patterns with multiple components:

```typescript
test('master-detail selection works', () => {
  render(<MasterDetail items={testItems} />);

  const firstItem = screen.getByText('Item 1');
  fireEvent.click(firstItem);

  expect(screen.getByText('Item 1 Details')).toBeInTheDocument();
});
```

## Contributing

When adding new sibling package dependencies:

1. Add to `package.json` dependencies
2. Update `tsconfig.json` path mappings
3. Update `vite.config.ts` aliases
4. Add to Rollup externals
5. Update this README with usage examples
6. Run type checking and tests

## License

MIT

## Related Packages

- [@web-loom/design-core](../design-core/README.md) - Design system
- [@web-loom/ui-core](../ui-core/README.md) - Headless behaviors
- [@web-loom/ui-patterns](../ui-patterns/README.md) - UI patterns
- [@web-loom/store-core](../store-core/README.md) - State management
- [@web-loom/event-bus-core](../event-bus-core/README.md) - Event system
