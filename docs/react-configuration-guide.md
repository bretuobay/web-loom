# React Configuration Guide

This document outlines the proper Vite and Vitest configurations for React applications and packages in the Web Loom monorepo.

## Common Issues & Solutions

### 1. Version Conflicts

**Problem**: React plugin version mismatches between workspace-level and package-level dependencies.
**Solution**: Use simplified configurations and remove problematic plugins when version conflicts occur.

### 2. Node.js Version

**Problem**: Vite requires Node.js 18+ for latest features.
**Solution**: Use Node.js 23+ as recommended: `nvm use 23`

### 3. TypeScript Compilation

**Problem**: Test files being included in production TypeScript compilation.
**Solution**: Exclude test files and test directories from tsconfig.app.json.

### 4. React Router Warnings

**Problem**: "use client" directive warnings during build.
**Solution**: These are normal warnings and don't affect functionality - safe to ignore.

## Configuration Templates

### For React Applications (`apps/*/`)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Add workspace aliases as needed
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@web-loom/mvvm-core', '@web-loom/ui-core', '@web-loom/ui-patterns'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}', 'src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

```jsonc
// tsconfig.app.json
{
  "compilerOptions": {
    // ... other options
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.spec.ts", "src/**/*.spec.tsx", "src/test/**/*"],
}
```

### For React Packages (`packages/*/`)

```typescript
// vite.config.ts - Library Build
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PackageName',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    emptyOutDir: true,
  },
});
```

```typescript
// vitest.config.ts - Package Testing
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}', 'src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest --run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --build --force",
    "lint": "eslint ."
  }
}
```

### Essential Dependencies

For React Apps:

```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.1"
  },
  "devDependencies": {
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@vitest/coverage-v8": "^3.2.4",
    "jsdom": "^26.1.0",
    "typescript": "~5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.2.4"
  }
}
```

For React Packages:

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@testing-library/react": "^16.0.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "vitest": "^3.2.4"
  }
}
```

## Plugin Issues & Workarounds

### React SWC Plugin Conflicts

When experiencing version conflicts with `@vitejs/plugin-react-swc`:

1. **Remove the plugin temporarily** from problematic configurations
2. **Use esbuild transform** instead (Vite's default for React JSX)
3. **Ensure consistent versions** across the monorepo

```typescript
// Simplified config without plugin
export default defineConfig({
  // No plugins array - Vite will handle JSX with esbuild
  resolve: {
    // ... aliases
  },
  // ... rest of config
});
```

### TypeScript Project References

For complex TypeScript setups:

```jsonc
// tsconfig.json (root)
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }],
}
```

## Best Practices

1. **Use Node.js 23+** for optimal compatibility
2. **Exclude test files** from production TypeScript compilation
3. **Simplify plugin chains** when experiencing version conflicts
4. **Use path aliases** for better imports
5. **Configure proper externals** for library builds
6. **Include coverage reporting** for quality metrics
7. **Use jsdom environment** for React component testing

## Troubleshooting

### Build Failures

- Check Node.js version: `node --version`
- Verify TypeScript configuration excludes test files
- Remove problematic plugins temporarily

### Development Server Issues

- Ensure using Node.js 23+
- Check for port conflicts
- Verify path aliases are correctly configured

### Test Setup

- Install required testing dependencies
- Configure jsdom environment properly
- Set up proper React Testing Library imports

### Version Conflicts

- Use simplified configurations without problematic plugins
- Ensure consistent dependency versions across monorepo
- Consider using workspace dependency hoisting
