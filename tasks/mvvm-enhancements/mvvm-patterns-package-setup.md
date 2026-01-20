# Task: Create mvvm-patterns Package

**Target Package**: `packages/mvvm-patterns` (NEW)
**Priority**: P0 (Must be done first)
**Status**: Not Started
**Breaking Changes**: None (new package)

---

## Overview

Create a new package `mvvm-patterns` for application-level MVVM patterns that don't belong in the core primitives. This package will contain InteractionRequest, ActiveAware, and other patterns.

## Implementation Steps

### Step 1: Create Package Directory Structure

```bash
mkdir -p packages/mvvm-patterns/src
cd packages/mvvm-patterns
```

### Step 2: Create package.json

Create `packages/mvvm-patterns/package.json`:

```json
{
  "name": "@anthropic/mvvm-patterns",
  "version": "0.0.1",
  "description": "Application-level MVVM patterns for Web Loom",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts,.tsx",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic/mvvm-core": "*"
  },
  "peerDependencies": {
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "typescript": "^5.8.2",
    "vitest": "^2.1.8",
    "rxjs": "^7.8.0"
  },
  "keywords": [
    "mvvm",
    "patterns",
    "interaction-request",
    "active-aware"
  ]
}
```

**Note**: Adjust the package name to match your organization's naming convention (e.g., `@repo/mvvm-patterns`).

### Step 3: Create tsconfig.json

Create `packages/mvvm-patterns/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Step 4: Create vite.config.ts (for Vitest)

Create `packages/mvvm-patterns/vite.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@anthropic/mvvm-core': resolve(__dirname, '../mvvm-core/src'),
    },
  },
});
```

### Step 5: Create Initial Index File

Create `packages/mvvm-patterns/src/index.ts`:

```typescript
/**
 * @packageDocumentation
 * Application-level MVVM patterns for Web Loom
 *
 * This package provides patterns for:
 * - ViewModel-to-View communication (InteractionRequest)
 * - Active/Inactive state tracking (ActiveAware)
 * - View lifetime management (IViewLifetime)
 */

// Interaction Request Pattern
// export { InteractionRequest } from './interactions/InteractionRequest';
// export type { INotification, IConfirmation, InteractionRequestedEvent } from './interactions/types';

// Active Aware Pattern
// export { ActiveAwareViewModel } from './viewmodels/ActiveAwareViewModel';
// export type { IActiveAware } from './lifecycle/IActiveAware';
// export { isActiveAware } from './lifecycle/IActiveAware';

// Placeholder export to make package valid
export const VERSION = '0.0.1';
```

### Step 6: Create Directory Structure

```bash
mkdir -p packages/mvvm-patterns/src/interactions
mkdir -p packages/mvvm-patterns/src/lifecycle
mkdir -p packages/mvvm-patterns/src/viewmodels
```

### Step 7: Add to Turbo Pipeline

Update root `turbo.json` if needed to include the new package in build/test pipelines.

### Step 8: Install Dependencies

From the root:

```bash
npm install
```

### Step 9: Verify Setup

```bash
cd packages/mvvm-patterns
npm run build
npm test
```

---

## Acceptance Criteria

- [ ] Package directory created at `packages/mvvm-patterns`
- [ ] `package.json` with correct dependencies
- [ ] `tsconfig.json` extending root config
- [ ] `vite.config.ts` for Vitest
- [ ] `src/index.ts` with placeholder exports
- [ ] Directory structure: `src/interactions`, `src/lifecycle`, `src/viewmodels`
- [ ] Package builds without errors
- [ ] Tests run (even if empty)
- [ ] Added to workspace (npm install works)

---

## Notes

- This package depends on `@anthropic/mvvm-core` for base classes
- RxJS is a peer dependency (user's app provides it)
- Follow existing Web Loom package patterns for consistency
