# Package Integration Guide

This document describes how @repo/ui-react integrates with sibling Web Loom packages.

## Integrated Packages

The following packages are integrated into @repo/ui-react:

1. **@web-loom/design-core** (v0.5.2) - Design system with CSS variables and theming
2. **@web-loom/ui-core** (v0.5.2) - Framework-agnostic headless UI behaviors
3. **@web-loom/ui-patterns** (v0.5.2) - Composed UI patterns built on ui-core
4. **@web-loom/store-core** (transitive) - State management library
5. **@web-loom/event-bus-core** (transitive) - Event bus for cross-component communication

## Integration Configuration

### 1. Package Dependencies (package.json)

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

Using `"*"` allows Turborepo to resolve workspace packages automatically.

### 2. TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "paths": {
      "@web-loom/design-core": ["../design-core/dist/index.d.ts"],
      "@web-loom/ui-core": ["../ui-core/dist/index.d.ts"],
      "@web-loom/ui-core/*": ["../ui-core/dist/*"],
      "@web-loom/ui-patterns": ["../ui-patterns/dist/index.d.ts"],
      "@web-loom/ui-patterns/*": ["../ui-patterns/dist/*"],
      "@web-loom/store-core": ["../store-core/src/index.ts"],
      "@web-loom/event-bus-core": ["../event-bus-core/src/index.ts"]
    }
  }
}
```

**Key Points:**
- Paths point to `dist` directories for built packages (ui-core, ui-patterns)
- `moduleResolution: "bundler"` matches the sibling packages' configuration
- `skipLibCheck: true` avoids type checking sibling package internals
- For type checking, we use declaration files to avoid strictness mismatches

### 3. Vite Configuration (vite.config.ts)

```typescript
{
  resolve: {
    alias: {
      '@web-loom/design-core/design-system': resolve(__dirname, '../design-core/src/design-system'),
      '@web-loom/design-core': resolve(__dirname, '../design-core/src/index.ts'),
      '@web-loom/ui-core': resolve(__dirname, '../ui-core/src/index.ts'),
      '@web-loom/ui-patterns': resolve(__dirname, '../ui-patterns/src/index.ts'),
      '@web-loom/store-core': resolve(__dirname, '../store-core/src/index.ts'),
      '@web-loom/event-bus-core': resolve(__dirname, '../event-bus-core/src/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@web-loom/design-core',
        '@web-loom/ui-core',
        '@web-loom/ui-patterns',
        '@web-loom/store-core',
        '@web-loom/event-bus-core',
      ],
    },
  },
}
```

**Key Points:**
- Vite aliases resolve to source files for HMR and source maps
- Special alias for `design-core/design-system` to handle CSS imports
- All sibling packages are marked as external to avoid bundling

## Development Workflow

### Prerequisites

Build sibling packages before working on ui-react:

```bash
# From repository root
cd packages/ui-core && npm run build
cd ../ui-patterns && npm run build
cd ../design-core && npm run build
```

### Development Commands

```bash
# Install dependencies
npm install

# Type checking (uses built .d.ts files)
npm run check-types

# Build (uses source files via Vite aliases)
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Storybook
npm run storybook
```

## Usage Examples

### Using UI Core Behaviors

```typescript
import { useEffect, useState } from 'react';
import { createDialogBehavior } from '@web-loom/ui-core';

function MyComponent() {
  const [dialog] = useState(() =>
    createDialogBehavior({
      id: 'my-dialog',
      onOpen: () => console.log('Dialog opened'),
    })
  );

  const [state, setState] = useState(dialog.getState());

  useEffect(() => {
    const unsubscribe = dialog.subscribe(setState);
    return unsubscribe;
  }, [dialog]);

  return (
    <div>
      <button onClick={() => dialog.actions.open()}>
        Open Dialog
      </button>
      {state.isOpen && <div>Dialog Content</div>}
    </div>
  );
}
```

### Using UI Patterns

```typescript
import { useEffect, useState } from 'react';
import { createMasterDetail } from '@web-loom/ui-patterns';

function DataBrowser() {
  const [pattern] = useState(() =>
    createMasterDetail({
      items: data,
      getId: (item) => item.id,
    })
  );

  const [state, setState] = useState(pattern.getState());

  useEffect(() => {
    const unsubscribe = pattern.subscribe(setState);
    return unsubscribe;
  }, [pattern]);

  return (
    <div>
      {/* Master view */}
      <aside>
        {state.items.map((item) => (
          <div key={item.id} onClick={() => pattern.actions.selectItem(item)}>
            {item.name}
          </div>
        ))}
      </aside>

      {/* Detail view */}
      <main>{state.selectedItem && <div>{state.selectedItem.name}</div>}</main>
    </div>
  );
}
```

### Using Design System

```typescript
import { Button } from '@repo/ui-react';
import '@web-loom/design-core/design-system';

function App() {
  return <Button variant="primary">Click me</Button>;
}
```

## Troubleshooting

### Issue: Type checking fails with errors in sibling packages

**Solution:** Ensure sibling packages are built first. TypeScript resolves to their `.d.ts` files in `dist/` directories.

```bash
cd packages/ui-core && npm run build
cd ../ui-patterns && npm run build
```

### Issue: Vite can't resolve imports

**Solution:** Check that Vite aliases in `vite.config.ts` point to correct source paths. Verify sibling packages exist at specified paths.

### Issue: Module not found during build

**Solution:**
1. Ensure dependencies are installed: `npm install`
2. Check that package.json has correct workspace dependencies
3. Verify Rollup externals list includes all sibling packages

### Issue: CSS imports fail

**Solution:** The `design-core/design-system` alias must be defined before the general `design-core` alias in Vite config. Order matters for Vite alias resolution.

## Best Practices

### 1. Use Barrel Imports

Always import from package root, not internal paths:

```typescript
// ✅ Good
import { createDialog } from '@web-loom/ui-core';

// ❌ Avoid
import { createDialog } from '@web-loom/ui-core/behaviors/dialog';
```

### 2. Type Safety

TypeScript path mappings point to declaration files for type safety. If you need to modify types, update the source package and rebuild.

### 3. Development vs Production

- **Development**: Vite uses source files for fast HMR
- **Type Checking**: Uses declaration files to avoid strictness conflicts
- **Production**: Packages are bundled separately, dependencies are external

### 4. Build Order

When building multiple packages, follow dependency order:

1. `store-core`, `event-bus-core` (no dependencies)
2. `design-core` (no dependencies)
3. `ui-core` (depends on store-core, event-bus-core)
4. `ui-patterns` (depends on ui-core)
5. `ui-react` (depends on all above)

## Architecture Decisions

### Why Two Different Path Configurations?

**TypeScript paths → dist files:**
- Avoids type checking sibling package internals
- Prevents strictness setting conflicts
- Faster type checking

**Vite aliases → source files:**
- Enables hot module replacement
- Provides better source maps
- Allows debugging into sibling packages

### Why External Dependencies?

Marking sibling packages as external:
- Prevents code duplication
- Allows consuming apps to control versions
- Reduces bundle size
- Maintains proper dependency graph

## Related Documentation

- [Main README](./README.md) - Full package documentation
- [@web-loom/ui-core README](../ui-core/README.md)
- [@web-loom/ui-patterns README](../ui-patterns/README.md)
- [@web-loom/design-core README](../design-core/README.md)
- [Example Integration](./src/examples/integration-example.tsx)
