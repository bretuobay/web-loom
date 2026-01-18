# Contributing to Web Loom

Thank you for your interest in contributing to Web Loom! We welcome contributions from developers who share our vision of framework-agnostic architecture.

## Philosophy

**Framework Agnosticism First**: Web Loom's core principle is that business logic, UI behaviors, and architectural patterns should outlive any single framework. When contributing, always prioritize framework-agnostic solutions over framework-specific implementations.

## Getting Started

### Prerequisites

- Node.js >= 18 (we recommend Node.js 23 via `nvm use 23`)
- npm 10.9.2+
- Git

### Setup

1. **Fork the repository**
   ```bash
   # Fork via GitHub UI, then clone your fork
   git clone https://github.com/YOUR_USERNAME/web-loom.git
   cd web-loom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

## Development Workflow

### 1. Make Your Changes

- **Core packages** (`packages/*-core`): Keep 100% framework-agnostic. No React, Vue, or Angular imports.
- **Framework adapters**: Place framework-specific code in separate packages (`ui-react`, `forms-vue`, etc.)
- **Follow existing patterns**: Study similar implementations before adding new features.

### 2. Write Tests

All new features and bug fixes must include tests:

```bash
# Run tests for specific package
cd packages/mvvm-core
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Test Coverage Requirements**:
- Core packages: Aim for 80%+ coverage
- Framework adapters: Test behavior, not framework internals
- Use Vitest for all tests

### 3. Check Code Quality

Before committing, ensure your code passes all checks:

```bash
# Type checking
npm run check-types

# Linting
npm run lint

# Formatting
npm run format

# Build all packages
npm run build
```

### 4. Run All Tests

```bash
# Run all tests across packages
npm test
```

## Code Style

### TypeScript Standards

- **Strict mode**: All packages use TypeScript strict mode
- **Explicit types**: Avoid `any`, prefer `unknown` when needed
- **Export types**: Always export types/interfaces used in public APIs
- **Erasable syntax**: Use `erasableSyntaxOnly: true` compatible syntax

### Framework Agnostic Patterns

**✅ DO:**
```typescript
// Framework-agnostic behavior using RxJS
import { BehaviorSubject } from 'rxjs';

export function createDialog() {
  const isOpen$ = new BehaviorSubject(false);
  return {
    isOpen$,
    open: () => isOpen$.next(true),
    close: () => isOpen$.next(false)
  };
}
```

**❌ DON'T:**
```typescript
// Framework-specific implementation in core package
import { useState } from 'react'; // ❌ No framework imports in core

export function createDialog() {
  const [isOpen, setIsOpen] = useState(false); // ❌
  // ...
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `dialog-behavior.ts`)
- **Classes**: `PascalCase` (e.g., `BaseViewModel`)
- **Functions**: `camelCase` (e.g., `createDialog`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_TIMEOUT`)
- **Interfaces**: `IPascalCase` or `PascalCase` (e.g., `ICommand`, `DialogOptions`)

### File Organization

```
packages/your-package/
├── src/
│   ├── index.ts           # Main exports
│   ├── types/             # TypeScript types
│   ├── behaviors/         # Behavior implementations
│   └── __tests__/         # Tests (mirror src structure)
├── package.json
├── README.md
├── vite.config.ts
└── tsconfig.json
```

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples**:
```bash
feat(mvvm-core): add CompositeCommand support

Implements composite command pattern allowing multiple commands
to be executed as a single unit. Useful for coordinating actions
across ViewModels.

Closes #123

---

fix(ui-core): resolve dialog focus trap issue

Dialog was not properly returning focus to trigger element on close.
Added focus restoration logic in cleanup phase.

---

docs(contributing): add framework-agnostic guidelines

Clarifies expectations for keeping core packages framework-agnostic
and where to place framework-specific adapters.
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass (`npm test`)
2. ✅ Type checking passes (`npm run check-types`)
3. ✅ Linting passes (`npm run lint`)
4. ✅ Code is formatted (`npm run format`)
5. ✅ Build succeeds (`npm run build`)
6. ✅ Tests added for new features/fixes
7. ✅ Documentation updated (if applicable)

### Submitting a PR

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** via GitHub UI

3. **Fill out PR template**:
   - Clear description of changes
   - Link related issues
   - Screenshots/videos (for UI changes)
   - Breaking changes noted
   - Migration guide (if breaking)

4. **Wait for review**:
   - Address reviewer feedback
   - Keep commits clean (squash if needed)
   - Be responsive to questions

### PR Review Criteria

- ✅ Maintains framework agnosticism in core packages
- ✅ Follows existing code patterns
- ✅ Includes comprehensive tests
- ✅ Documentation is clear and complete
- ✅ No breaking changes (or properly documented)
- ✅ Performance considered
- ✅ Accessibility maintained (for UI)

## Package Development Guidelines

### Adding a New Package

1. **Choose appropriate scope**:
   - `@web-loom/*`: Public packages
   - `@repo/*`: Internal/tooling packages

2. **Create package structure**:
   ```bash
   cd packages
   mkdir your-package
   cd your-package
   npm init --scope=@web-loom
   ```

3. **Setup package.json**:
   ```json
   {
     "name": "@web-loom/your-package",
     "version": "0.1.0",
     "private": false,
     "type": "module",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "files": ["dist", "LICENSE"],
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.js"
       }
     },
     "repository": {
       "type": "git",
       "url": "https://github.com/bretuobay/web-loom.git",
       "directory": "packages/your-package"
     },
     "bugs": "https://github.com/bretuobay/web-loom/issues",
     "homepage": "https://github.com/bretuobay/web-loom#readme"
   }
   ```

4. **Add build configuration** (vite.config.ts)
5. **Write README.md** following template in existing packages
6. **Add tests** in `__tests__/` directory

### Internal Dependencies

Use workspace protocol for internal packages:

```json
{
  "dependencies": {
    "@web-loom/mvvm-core": "*",
    "@web-loom/event-bus-core": "*"
  }
}
```

### Publishing Checklist

Before publishing a package:
- [ ] Version bumped (semver)
- [ ] CHANGELOG.md updated
- [ ] Tests passing
- [ ] README.md complete
- [ ] LICENSE file included in `files` field
- [ ] Repository metadata in package.json

## Testing Guidelines

### Unit Tests

- Test public API, not implementation details
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createDialog } from '../dialog';

describe('createDialog', () => {
  it('should start with isOpen = false', () => {
    const dialog = createDialog();
    expect(dialog.isOpen$.value).toBe(false);
  });

  it('should open when open() is called', () => {
    const dialog = createDialog();
    dialog.open();
    expect(dialog.isOpen$.value).toBe(true);
  });
});
```

### Integration Tests

For framework adapters, test integration with framework:

```typescript
// React adapter test
import { renderHook, act } from '@testing-library/react';
import { useDialog } from '../useDialog';

it('should sync dialog state with React', () => {
  const { result } = renderHook(() => useDialog());

  act(() => {
    result.current.open();
  });

  expect(result.current.isOpen).toBe(true);
});
```

### Property-Based Tests

For complex logic, consider property-based testing:

```typescript
import { fc, test } from 'fast-check';

test.prop([fc.integer()])('should handle any integer', (value) => {
  const result = yourFunction(value);
  expect(result).toBeDefined();
});
```

## Documentation

### README.md Template

Each package should have:

```markdown
# @web-loom/package-name

[One-sentence description]

## Installation
## Quick Start
## Features
## API Reference
## Framework Integration
  ### React
  ### Vue
  ### Angular
## Troubleshooting
## Contributing
## License
```

### Code Comments

- **Public APIs**: JSDoc comments required
- **Complex logic**: Explain the "why", not the "what"
- **TODOs**: Use `// TODO(username): description` format

```typescript
/**
 * Creates a dialog behavior with open/close state management.
 *
 * @param options - Configuration options
 * @param options.initialOpen - Initial open state (default: false)
 * @param options.onOpen - Callback when dialog opens
 * @param options.onClose - Callback when dialog closes
 * @returns Dialog behavior object with state and actions
 *
 * @example
 * ```typescript
 * const dialog = createDialog({
 *   onOpen: () => console.log('Dialog opened'),
 *   onClose: () => console.log('Dialog closed')
 * });
 *
 * dialog.open();
 * dialog.isOpen$.subscribe(isOpen => console.log(isOpen));
 * ```
 */
export function createDialog(options?: DialogOptions): DialogBehavior {
  // Implementation
}
```

## Community Guidelines

- **Be respectful**: Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- **Be patient**: Maintainers review PRs as time permits
- **Be collaborative**: Share knowledge, help others
- **Ask questions**: GitHub Discussions for Q&A
- **Report bugs**: Use issue templates

## Framework-Specific Contributions

### Core Packages (Framework-Agnostic)
- `mvvm-core`, `ui-core`, `ui-patterns`, `store-core`, `query-core`, `event-bus-core`, `plugin-core`, `router-core`, `forms-core`
- **No framework imports allowed**
- Use RxJS for reactivity
- Export plain objects/functions
- Adapters go in separate packages

### Framework Adapters
- `ui-react`, `forms-react`, `forms-vue`, `forms-vanilla`, `media-react`, `media-vue`
- Framework-specific implementations
- Must maintain same API as core
- Test with framework's testing tools

### Example Apps
- `apps/mvvm-react`, `apps/mvvm-vue`, `apps/mvvm-angular`, etc.
- Demonstrate real-world usage
- Share ViewModels from `packages/view-models`
- Show best practices

## Release Process

Handled by maintainers. Contributors don't need to worry about releases.

For maintainers, see [RELEASING.md](RELEASING.md) (to be created).

## Getting Help

- 💬 [GitHub Discussions](https://github.com/bretuobay/web-loom/discussions) - Q&A and ideas
- 🐛 [Issue Tracker](https://github.com/bretuobay/web-loom/issues) - Bug reports
- 📖 [Documentation](https://github.com/bretuobay/web-loom#readme) - Guides and API reference

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md (to be created)
- Release notes
- Project README

Thank you for contributing to Web Loom and advancing framework-agnostic architecture! 🚀
