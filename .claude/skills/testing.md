# Testing

Testing patterns and commands using Vitest with jsdom environment.

## Running Tests

```bash
# Run tests in specific packages
cd packages/mvvm-core && npm test              # Run tests once
cd packages/mvvm-core && npm run test:watch    # Watch mode
cd packages/mvvm-core && npm run test:coverage # With coverage

# Run all tests via Turbo
npm run test
turbo run test --filter=mvvm-core
```

## Packages with Tests

- mvvm-core, store-core, event-bus-core, query-core, plugin-core
- design-core, typography-core, ui-core, ui-patterns
- forms-core, http-core, i18n-core, storage-core, error-core

## Vitest Configuration

Reference: `apps/mvvm-react/vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Key Settings

- Test timeout: 20000ms (see `vitest.config.js`)
- Tests co-located with source files (`.test.ts` suffix)
- Pattern: `src/**/*.{test,spec}.{js,ts}`
- Same alias map as Vite config for consistent resolution

## Testing MVVM Components

### Testing ViewModels

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('GreenHouseViewModel', () => {
  it('fetches data on command execution', async () => {
    const mockFetcher = vi.fn().mockResolvedValue([{ id: '1', name: 'Test' }]);
    const vm = createViewModel({ fetcher: mockFetcher });

    await vm.fetchCommand.execute();

    expect(mockFetcher).toHaveBeenCalled();
    expect(vm.data$.getValue()).toHaveLength(1);
  });

  it('handles errors gracefully', async () => {
    const mockFetcher = vi.fn().mockRejectedValue(new Error('Network error'));
    const vm = createViewModel({ fetcher: mockFetcher });

    await vm.fetchCommand.execute();

    expect(vm.error$.getValue()).toBe('Network error');
  });
});
```

### Testing with RxJS

```typescript
import { firstValueFrom } from 'rxjs';

it('emits loading state', async () => {
  const loadingStates: boolean[] = [];
  vm.isLoading$.subscribe((state) => loadingStates.push(state));

  await vm.fetchCommand.execute();

  expect(loadingStates).toEqual([false, true, false]);
});
```

### Testing Commands

```typescript
it('disables command while executing', async () => {
  const canExecute = await firstValueFrom(vm.fetchCommand.canExecute$);
  expect(canExecute).toBe(true);

  const executePromise = vm.fetchCommand.execute();
  const isExecuting = await firstValueFrom(vm.fetchCommand.isExecuting$);
  expect(isExecuting).toBe(true);

  await executePromise;
});
```

## Testing React Components

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
  it('shows loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders data after fetch', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Greenhouse 1')).toBeInTheDocument();
    });
  });
});
```

## Mocking Patterns

### Mock Fetchers

```typescript
const mockFetcher = vi.fn().mockImplementation(async (url) => {
  if (url.includes('/greenhouses')) {
    return [{ id: '1', name: 'Test Greenhouse' }];
  }
  throw new Error('Unknown endpoint');
});
```

### Stub RxJS Subjects

```typescript
import { BehaviorSubject } from 'rxjs';

const mockViewModel = {
  data$: new BehaviorSubject([]),
  isLoading$: new BehaviorSubject(false),
  fetchCommand: {
    execute: vi.fn(),
    isExecuting$: new BehaviorSubject(false),
  },
};
```

## Best Practices

1. **Test ViewModels directly** - Mock fetchers, don't hit real endpoints
2. **Use `firstValueFrom`** for single observable emissions
3. **Subscribe to capture all emissions** when testing state transitions
4. **Mock at boundaries** - Fetchers, localStorage, timers
5. **Dispose ViewModels** in test cleanup to prevent memory leaks
6. **Keep alias maps in sync** between Vite and Vitest configs

## Coverage

```bash
npm run test:coverage
```

Coverage excludes:

- `node_modules/`
- `dist/`
- Config files (`*.config.*`)
