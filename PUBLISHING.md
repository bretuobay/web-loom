# Publishing Guide

This document outlines the process for publishing Web Loom packages to npm.

## Package Dependency Graph

```
Level 1 (No dependencies):
  - @web-loom/store-core
  - @web-loom/event-bus-core
  - @web-loom/query-core
  - @web-loom/design-core
  - @web-loom/prose-scriber

Level 2 (Depends on Level 1):
  - @web-loom/mvvm-core (depends on query-core)
  - @web-loom/ui-core (depends on store-core, event-bus-core)

Level 3 (Depends on Level 2):
  - @web-loom/ui-patterns (depends on ui-core, store-core, event-bus-core)
```

## Publishing Order

To ensure all dependencies are available when publishing, follow this order:

### Phase 1: Foundation Libraries

Publish these first (no dependencies on other @web-loom packages):

1. `@web-loom/store-core`
2. `@web-loom/event-bus-core`
3. `@web-loom/query-core`
4. `@web-loom/design-core`
5. `@web-loom/prose-scriber`

### Phase 2: Core Libraries

Publish after Phase 1 is complete:

6. `@web-loom/mvvm-core` (requires: query-core)
7. `@web-loom/ui-core` (requires: store-core, event-bus-core)

### Phase 3: Advanced Patterns

Publish after Phase 2 is complete:

8. `@web-loom/ui-patterns` (requires: ui-core, store-core, event-bus-core)

## Publishing Methods

### Automatic Publishing (Recommended)

The repository has GitHub Actions workflows configured for automatic publishing:

1. **Make changes** to a package (e.g., update code, bump version)
2. **Commit and push** to a feature branch
3. **Create a Pull Request** to `main` branch
   - This triggers CI workflows to test and build
4. **Merge PR** to `main` branch
   - This triggers publish workflows
   - Workflows check if version already exists on npm
   - If version is new, package is automatically published

**Note**: Ensure the `NPM_TOKEN` secret is configured in GitHub repository settings.

### Manual Publishing

For manual publishing or first-time setup:

```bash
# 1. Ensure you're logged in to npm
npm login

# 2. Build all packages
npm run build

# 3. Publish in order (from repository root)

# Phase 1
cd packages/store-core && npm publish --access public && cd ../..
cd packages/event-bus-core && npm publish --access public && cd ../..
cd packages/query-core && npm publish --access public && cd ../..
cd packages/design-core && npm publish --access public && cd ../..
cd packages/prose-scriber && npm publish --access public && cd ../..

# Phase 2
cd packages/mvvm-core && npm publish --access public && cd ../..
cd packages/ui-core && npm publish --access public && cd ../..

# Phase 3
cd packages/ui-patterns && npm publish --access public && cd ../..
```

## Version Management

All packages are currently at version `0.5.2`. When bumping versions:

1. **Update all package.json files** to the same version
2. **Update internal dependencies** to use the new version with caret ranges (e.g., `^0.5.2`)
3. **Commit version changes** before publishing

### Automated Version Bump

You can use this command to bump all packages to a specific version:

```bash
# Example: Bump to 0.6.0
NEW_VERSION="0.6.0"
find packages apps -name "package.json" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.angular/*" -not -path "*/examples/*" -exec sh -c 'jq ".version = \"$1\"" "$0" > "$0.tmp" && mv "$0.tmp" "$0"' {} "$NEW_VERSION" \;
```

Then update dependency versions manually in:

- `packages/ui-core/package.json`
- `packages/ui-patterns/package.json`
- `packages/mvvm-core/package.json`
- `packages/shared/package.json`

## Internal Packages (Not Published)

The following packages are internal to the monorepo and should NOT be published to npm:

- `@repo/shared` (used by apps only)
- `@repo/ui` (React component library for apps)
- `@repo/models` (shared data models)
- `@repo/view-models` (shared ViewModels for demo apps)
- `@repo/plugin-core` (plugin system for apps)
- `@repo/eslint-config` (shared ESLint config)
- `@repo/typescript-config` (shared TypeScript config)

These are marked with `"private": true` in their package.json.

## Development vs Production

### Development Mode (Monorepo)

In development, packages reference each other using:

- Workspace protocol: `"@repo/shared": "*"`
- Version ranges: `"@web-loom/ui-core": "^0.5.2"`

Turbo and npm workspaces resolve these to local packages automatically.

### Production Mode (Published)

When published to npm:

- `@web-loom/*` packages are fetched from npm registry
- `@repo/*` packages are never fetched (they're not published)
- Apps should only depend on published `@web-loom/*` packages or self-contain their code

## Troubleshooting

### Error: Package version already exists

This is normal - the workflow skips publishing if the version already exists. Bump the version number to publish a new version.

### Error: Cannot find module '@web-loom/...'

Ensure dependencies are published in the correct order (see Publishing Order above).

### Error: E404 '@repo/...' not found

`@repo/*` packages are internal and not published. If you see this error when installing a `@web-loom/*` package, it means that package incorrectly depends on an internal package. Remove the dependency.

## Checking Published Versions

```bash
# Check what versions are published
npm view @web-loom/ui-core versions
npm view @web-loom/ui-patterns versions
npm view @web-loom/store-core versions
```

## Current Status (v0.5.2)

### Published Packages

- ✅ @web-loom/store-core: 0.0.3, 0.0.4
- ✅ @web-loom/event-bus-core: 0.0.1, 0.0.2
- ⚠️ @web-loom/query-core: (needs 0.5.2 to be published)
- ⚠️ @web-loom/design-core: (needs 0.5.2 to be published)
- ⚠️ @web-loom/prose-scriber: (needs 0.5.2 to be published)
- ⚠️ @web-loom/mvvm-core: (needs 0.5.2 to be published)
- ❌ @web-loom/ui-core: Not yet published
- ❌ @web-loom/ui-patterns: Not yet published

### Next Steps

1. Publish Phase 1 packages (store-core, event-bus-core, query-core, design-core, prose-scriber) with v0.5.2
2. Publish Phase 2 packages (mvvm-core, ui-core) with v0.5.2
3. Publish Phase 3 packages (ui-patterns) with v0.5.2
