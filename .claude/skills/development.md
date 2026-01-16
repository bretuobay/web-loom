# Development Commands

Common commands for developing in the Web Loom monorepo.

## Quick Start

```bash
nvm use 23               # Use preferred Node version
npm install              # Install dependencies
npm run dev              # Start all apps in dev mode
```

## Core Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode (concurrency=20) |
| `npm run build` | Build all packages and apps |
| `npm run lint` | Lint all packages |
| `npm run format` | Format code with Prettier |
| `npm run check-types` | Type-check all packages |
| `npm run test` | Run all tests |

## Turbo Commands

```bash
# Filtered builds
turbo run build --filter=mvvm-react
turbo run build --filter=@web-loom/mvvm-core

# Force rebuild (bypass cache)
turbo run build --force

# Run specific tasks
turbo run test --filter=mvvm-core
turbo run dev --filter=task-flow-ui
```

## Working with Apps

Each app can be run individually:

```bash
# MVVM Demo Apps
cd apps/mvvm-react && npm run dev
cd apps/mvvm-angular && npm run dev
cd apps/mvvm-vue && npm run dev
cd apps/mvvm-lit && npm run dev
cd apps/mvvm-vanilla && npm run dev

# Feature Apps
cd apps/task-flow-ui && npm run dev      # Port 5178
cd apps/plugin-react && npm run dev
cd apps/ui-patterns-playground && npm run dev
cd apps/mvvm-react-integrated && npm run dev
```

## Working with Packages

```bash
# Build specific package
cd packages/mvvm-core && npm run build

# Run package tests
cd packages/mvvm-core && npm test
cd packages/mvvm-core && npm run test:watch
cd packages/mvvm-core && npm run test:coverage

# Type check package
cd packages/mvvm-core && npm run check-types
```

## API Development

```bash
# Main API
cd apps/api
npm run dev    # Start with nodemon (auto-restart)
npm run seed   # Seed SQLite database
npm run build  # Build TypeScript
npm start      # Run built API

# TaskFlow API
cd apps/task-flow-api
npm run dev    # Start TaskFlow API
npm run seed   # Seed database
```

## Adding New Packages

1. Create package in `packages/` or app in `apps/`
2. Add standard scripts to `package.json`:

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

3. Extend TypeScript config from `@repo/typescript-config`
4. Update Vite/Vitest aliases in consuming apps
5. Add workspace dependency: `"@repo/new-package": "*"`

## Cross-Package Dependencies

Use workspace protocol:

```json
{
  "dependencies": {
    "@repo/models": "*",
    "@web-loom/mvvm-core": "0.5.0"
  }
}
```

## Environment Requirements

- **Node.js**: >=18 (preferred: `nvm use 23`)
- **Package manager**: npm@10.9.2
- **TypeScript**: v5.8.2

## Pre-Commit Checklist

```bash
npm run check-types      # TypeScript passes
npm run lint             # Linting passes
npm run test             # Tests pass
npm run format           # Code formatted
```

## Troubleshooting

### Alias Resolution Issues
- Check Vite config `resolve.alias` matches package paths
- Ensure Vitest config mirrors Vite aliases
- Verify `optimizeDeps.include` for pre-bundling

### Build Cache Issues
```bash
turbo run build --force  # Bypass Turbo cache
rm -rf node_modules/.vite  # Clear Vite cache
```

### Port Conflicts
- mvvm-react: 5173
- task-flow-ui: 5178
- api: 3000
- task-flow-api: 3001
