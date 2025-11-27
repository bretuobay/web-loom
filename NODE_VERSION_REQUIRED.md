# ⚠️ CRITICAL: Node.js Version Upgrade Required

## Current Issue

You are experiencing TypeScript declaration file errors like:

```
Could not find a declaration file for module '@web-loom/ui-core/react'
```

**Root Cause**: You're using Node.js v15.14.0, but this project requires Node.js 22 LTS.

## Why This Matters

1. **Vite 6 requires Node.js >= 20.19.0 or >= 22.12.0**
   - Your current version (15.14.0) is incompatible
   - Vite uses modern JavaScript features not supported in Node 15

2. **Rollup doesn't officially support Node 23 yet**
   - Use Node 22 LTS for best compatibility
   - Node 23 causes optional dependency issues in CI/CD

3. **Build Process Fails Silently**
   - `npm run build` fails with regex syntax errors
   - TypeScript declaration files (`.d.ts`) are not generated
   - This causes IDE/TypeScript errors when importing packages

4. **Current Error Example**:
   ```
   SyntaxError: Invalid regular expression flags
   at Loader.moduleStrategy (node:internal/modules/esm/translators:147:18)
   ```

## How to Fix

### Step 1: Install Node.js 22 LTS

Using nvm (Node Version Manager):

```bash
# Install Node.js 22 LTS
nvm install 22

# Switch to Node.js 22
nvm use 22

# Verify the version
node --version  # Should output v22.x.x
```

### Step 2: Reinstall Dependencies

```bash
# Clean install with correct Node version
rm -rf node_modules package-lock.json
npm install
```

### Step 3: Rebuild All Packages

```bash
# Build all packages with working Node version
npm run build
```

This will generate all the missing `.d.ts` files and resolve TypeScript errors.

## What Happens After Upgrade

✅ Vite builds will work correctly
✅ TypeScript declaration files (`.d.ts`) will be generated
✅ IDE autocomplete and type checking will work
✅ `npm run dev` will work without errors
✅ All GitHub Actions will work (they use Node 23)

## Why Node 22 Instead of Node 23?

- **Node 22 is LTS (Long Term Support)** - stable and well-tested
- **Rollup doesn't officially support Node 23** - causes optional dependency issues
- **Better CI/CD compatibility** - GitHub Actions work more reliably
- **Vite 6 fully supports Node 22** - no compatibility issues

## Alternative: Use Node 20

If you prefer, you can also use:
- Node.js 20.19.0 or higher (also LTS)

## Current Status

- ❌ Node v15.14.0 (INCOMPATIBLE)
- ✅ Required: Node v22 LTS (as per .nvmrc)
- ⚠️ Node v23 (NOT RECOMMENDED - Rollup issues)
- ✅ Alternative: Node v20.19.0+

## Verification

After upgrading Node, verify everything works:

```bash
# Check Node version
node --version

# Test build
cd packages/ui-core && npm run build

# Verify .d.ts files were created
ls -la packages/ui-core/dist/*.d.ts
ls -la packages/ui-core/dist/adapters/react.d.ts

# Test development mode
npm run dev
```

## Impact on Your Project

Until you upgrade Node.js:
- ❌ Cannot build packages
- ❌ Cannot publish to npm
- ❌ TypeScript errors in IDE
- ❌ Missing type definitions
- ❌ Dev mode may fail

After upgrading Node.js:
- ✅ All builds work
- ✅ Type definitions generated
- ✅ No TypeScript errors
- ✅ Ready to publish
- ✅ Full dev environment works

## Summary

**Action Required**: Upgrade to Node.js 23 immediately using `nvm use 23`

This is not optional - the project cannot function properly with Node 15.
