# Vue Configuration Guide

This document outlines the proper Vite and Vitest configurations for Vue applications and packages in the Web Loom monorepo.

## Common Issues & Solutions

### 1. Version Conflicts

**Problem**: Plugin version mismatches between workspace-level and package-level dependencies.
**Solution**: Use simplified configurations and avoid complex plugin chains.

### 2. Node.js Version

**Problem**: Vite requires Node.js 18+ for latest features.
**Solution**: Use Node.js 23+ as recommended: `nvm use 23`

### 3. Plugin Compatibility

**Problem**: Vue plugin conflicts with different Vite versions.
**Solution**: Use minimal plugin configurations for packages.

## Configuration Templates

### For Vue Applications (`apps/*/`)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Add workspace aliases as needed
    },
  },
  optimizeDeps: {
    include: ['vue', 'vue-router'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  },
});
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,ts,vue}', 'src/**/*.{test,spec}.{js,ts,vue}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### For Vue Packages (`packages/*/`)

```typescript
// vite.config.ts - Library Build
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PackageName',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
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
    include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
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
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest --run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "type-check": "vue-tsc --build --force"
  }
}
```

### Essential Dependencies

For Vue Apps:

```json
{
  "dependencies": {
    "vue": "^3.5.13",
    "vue-router": "^4"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.3",
    "@vue/test-utils": "^2.4.6",
    "@vitest/coverage-v8": "^3.2.4",
    "jsdom": "^26.1.0",
    "typescript": "~5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.2.4",
    "vue-tsc": "^2.2.8"
  }
}
```

For Vue Packages:

```json
{
  "peerDependencies": {
    "vue": ">=3.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.4",
    "@vue/test-utils": "^2.4.6",
    "vitest": "^3.2.4",
    "vue": "^3.5.13"
  }
}
```

## Best Practices

1. **Use Node.js 23+** for optimal compatibility
2. **Simplify plugin chains** to avoid version conflicts
3. **Keep Vue plugins minimal** in package configurations
4. **Use TypeScript references** properly with `vue-tsc`
5. **Configure path aliases** for better imports
6. **Include coverage reporting** for quality metrics
7. **Use jsdom environment** for Vue component testing

## Troubleshooting

### Build Failures

- Check Node.js version: `node --version`
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Verify Vue plugin compatibility

### Test Failures

- Ensure jsdom is installed
- Check for Vue component mounting issues
- Verify path aliases in test configuration

### Type Errors

- Run `vue-tsc --noEmit` to check types
- Ensure Vue types are properly imported
- Check tsconfig.json configuration
