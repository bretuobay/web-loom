# Fix Summary: Package Exports Configuration for @web-loom/design-core

## Problem

Third-party applications and apps within the monorepo could not import from `@web-loom/design-core/utils` or `@web-loom/design-core/types`, resulting in the following error:

```
Cannot find module '@web-loom/design-core/utils' or its corresponding type declarations.ts(2307)
```

This only worked within the monorepo due to TypeScript path mapping, but failed for external consumers of the package.

## Root Cause

The package.json `exports` field did not include entries for subpath exports (`/utils`, `/types`), and the build configuration was bundling everything into a single file instead of preserving the module structure needed for subpath imports.

## Changes Made

### 1. Updated package.json Exports

Added explicit export paths for `/utils` and `/types`:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.js",
      "default": "./dist/utils/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js",
      "default": "./dist/types/index.js"
    }
    // ... CSS exports remain unchanged
  }
}
```

### 2. Updated Vite Build Configuration

Modified `vite.config.ts` to generate separate entry points:

```typescript
{
  entry: {
    'design-core.es': './src/index.ts',  // Backwards compatibility
    index: './src/index.ts',
    'utils/index': './src/utils/index.ts',
    'types/index': './src/types/index.ts',
  }
}
```

Key changes:

- Added multiple entry points for different subpaths
- Set `rollupTypes: false` in vite-plugin-dts to preserve type structure
- Removed UMD format (not needed for modern packages)

### 3. Created src/types/index.ts

Added a new index file to export all types from a single entry point:

```typescript
export * from './borders';
export * from './breakpoints';
export * from './colors';
// ... all type exports
```

### 4. Updated Package Files Configuration

Added README and LICENSE to the published files:

```json
{
  "files": ["dist", "src/css", "src/design-system", "README.md", "LICENSE"]
}
```

### 5. Created Documentation

- Added [EXPORTS.md](./EXPORTS.md) explaining all available exports
- Updated [README.md](./README.md) with package exports section
- Created verification script at `scripts/verify-exports.mjs`
- Added `verify:exports` npm script

## Verification

### Within Monorepo

The following apps successfully import without errors:

- `/apps/mvvm-react-integrated/src/providers/ThemeProvider.tsx`
- `/apps/task-flow-ui/src/providers/ThemeProvider.tsx`
- `/apps/docs/content/docs/design-core.mdx`

### Export Verification Script

Created automated verification that checks:

- ✅ Main entry point works
- ✅ Utils export works with all 11 functions
- ✅ Types export works
- ✅ Functions are callable
- ✅ 183 CSS variables are generated

Run with:

```bash
npm run verify:exports
```

## Usage Examples

### Before (Broken for External Apps)

```typescript
// This only worked within the monorepo
import { getTokenValue } from '@web-loom/design-core/utils';
```

### After (Works Everywhere)

```typescript
// Main export
import * as DesignCore from '@web-loom/design-core';

// Utils
import { getTokenValue, createTheme, applyTheme } from '@web-loom/design-core/utils';

// Types only
import type { ColorTokens, SpacingTokens } from '@web-loom/design-core/types';

// CSS files (unchanged)
import '@web-loom/design-core/design-system';
import '@web-loom/design-core/css/colors.css';
```

## Distribution Structure

After building, the `dist/` folder now contains:

```
dist/
├── index.js                    # Main entry
├── index.d.ts                  # Main types
├── design-core.es.js          # Legacy bundle
├── design-core.es.d.ts
├── utils/
│   ├── index.js               # Utils implementation
│   ├── index.d.ts             # Utils types
│   ├── cssVariables.d.ts
│   ├── theme.d.ts
│   └── tokens.d.ts
├── types/
│   ├── index.js               # Types implementation
│   ├── index.d.ts             # Types definitions
│   ├── borders.d.ts
│   ├── colors.d.ts
│   └── ... (all type files)
└── ... (other chunks)
```

## Backwards Compatibility

The package maintains backwards compatibility:

- `main` field still points to `./dist/index.js`
- `module` field points to `./dist/design-core.es.js` (legacy)
- `types` field points to `./dist/index.d.ts`
- Old import style (`import from '@web-loom/design-core'`) still works

## Testing for External Apps

To test that this works for external packages:

1. **Publish to npm** (or use npm pack):

   ```bash
   npm pack
   # This creates @web-loom-design-core-0.5.4.tgz
   ```

2. **Install in a test project**:

   ```bash
   cd /path/to/test-project
   npm install /path/to/@web-loom-design-core-0.5.4.tgz
   ```

3. **Import and use**:
   ```typescript
   import { getTokenValue } from '@web-loom/design-core/utils';
   import type { ColorTokens } from '@web-loom/design-core/types';
   ```

## Notes

- TypeScript 4.7+ required for full `exports` support
- Modern bundlers (Vite, Webpack 5, Rollup, etc.) all support package exports
- Some token reference warnings exist but don't affect exports functionality

## Files Modified

1. `package.json` - Added exports, updated scripts
2. `vite.config.ts` - Multiple entry points, preserved types
3. `src/types/index.ts` - Created new file
4. `README.md` - Added package exports section
5. `scripts/verify-exports.mjs` - Created verification script
6. `EXPORTS.md` - Created comprehensive documentation
