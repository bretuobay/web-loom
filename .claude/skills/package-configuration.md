# Package Configuration

Configure workspace apps and packages to match repo-wide Vite/Vitest/Turbo conventions.

## Vite Configuration

Reference implementations: `apps/mvvm-react/vite.config.ts`, `apps/task-flow-ui/vite.config.ts`

### Standard Setup

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@repo/models': path.resolve(__dirname, '../../packages/models/src'),
      '@repo/view-models': path.resolve(__dirname, '../../packages/view-models/src'),
      '@web-loom/mvvm-core': path.resolve(__dirname, '../../packages/mvvm-core/src'),
      '@web-loom/ui-core': path.resolve(__dirname, '../../packages/ui-core/src'),
      '@web-loom/design-core': path.resolve(__dirname, '../../packages/design-core/src'),
    },
  },
  optimizeDeps: {
    include: ['@repo/models', '@repo/view-models'],
  },
});
```

### Key Points

- `server.port` + `strictPort` keep dev server stable
- `build.target: 'esnext'` with `sourcemap: true`
- `resolve.alias` ties `@repo/*` and `@web-loom/*` to package sources
- `optimizeDeps.include` lists packages needing pre-bundling

## Vitest Configuration

Reference: `apps/mvvm-react/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Same aliases as Vite config
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', '*.config.*'],
    },
  },
});
```

### Key Points

- Mirror Vite alias map so tests resolve same sources as builds
- Use `globals: true` and `environment: 'jsdom'`
- Coverage provider: `v8` with text/json/html reporters

## Turbo Pipeline

Root `turbo.json` governs caching and task dependencies.

### Standard Tasks

| Task          | Cache | Dependencies | Notes                      |
| ------------- | ----- | ------------ | -------------------------- |
| `build`       | Yes   | `^build`     | Depends on upstream builds |
| `lint`        | Yes   | -            | Runs independently         |
| `check-types` | Yes   | -            | TypeScript validation      |
| `test`        | Yes   | `^build`     | Depends on builds          |
| `dev`         | No    | -            | Persistent, no cache       |

### Required Package Scripts

Every app/package should have:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint src",
    "test": "vitest run",
    "check-types": "tsc --noEmit"
  }
}
```

## TypeScript Configuration

All packages extend `@repo/typescript-config` variants:

- `base.json` - Core settings
- `react-library.json` - React packages
- `nextjs.json` - Next.js apps

### Package tsconfig.json

```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Workspace Dependencies

### package.json Setup

```json
{
  "dependencies": {
    "@repo/models": "*",
    "@repo/view-models": "*",
    "@web-loom/mvvm-core": "0.5.0"
  }
}
```

### Package Exports

```json
{
  "name": "@repo/models",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

## Adding New Package Checklist

1. Create package in `packages/` or app in `apps/`
2. Add standard scripts: `dev`, `build`, `lint`, `test`, `check-types`
3. Extend appropriate TypeScript config
4. Update Vite/Vitest aliases in consuming apps
5. Add to workspace in root `package.json` if needed

## Verification

```bash
npm run lint              # Lint passes
npm run check-types       # TypeScript passes
npm run test              # Tests pass
npm run dev               # Dev server starts
turbo run build --force   # Full rebuild works
```

Watch console for alias resolution warnings when running dev server.
