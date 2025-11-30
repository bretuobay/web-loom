# Phase 1.1: Project Setup and Infrastructure

**Duration**: 2-3 days  
**Priority**: Critical  
**Dependencies**: None

## Overview

Set up the foundational project structure, build tooling, and development environment for the forms-core package.

## Tasks

### 1. Project Structure Setup

**Time Estimate**: 1 day

#### Subtasks:

- [ ] Create package.json with proper dependencies
- [ ] Set up TypeScript configuration (tsconfig.json)
- [ ] Configure build tools (Vite for bundling)
- [ ] Set up testing framework (Vitest)
- [ ] Create initial directory structure
- [ ] Set up ESLint and Prettier configuration
- [ ] Configure development scripts

#### Directory Structure:

```
packages/forms-core/
├── src/
│   ├── index.ts              # Main exports
│   ├── form.ts               # Core form factory
│   ├── field.ts              # Field management
│   ├── types.ts              # Core type definitions
│   ├── validation/
│   │   ├── zod-adapter.ts    # Zod integration
│   │   └── types.ts          # Validation types
│   └── utils/
│       ├── path.ts           # Dot notation utilities
│       ├── clone.ts          # Immutable updates
│       └── events.ts         # Subscription system
├── tests/
│   ├── setup.ts              # Test configuration
│   ├── __fixtures__/         # Test data
│   └── integration/          # Integration tests
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

#### Dependencies:

```json
{
  "peerDependencies": {
    "zod": "^3.22.0"
  },
  "optionalDependencies": {
    "@web-loom/storage-core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0",
    "zod": "^3.22.0"
  }
}
```

### 2. Core Type Definitions

**Time Estimate**: 4 hours

#### Subtasks:

- [ ] Define core form state interfaces
- [ ] Create field metadata types
- [ ] Define configuration interfaces
- [ ] Set up Zod type inference utilities
- [ ] Create subscription event types

#### Key Types:

```typescript
// Core form state
interface FormState<T = Record<string, unknown>> {
  values: T;
  defaultValues: T;
  fields: Record<string, FieldMeta>;
  fieldErrors: Record<string, string | null>;
  formErrors: string[];
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
}

// Field metadata
interface FieldMeta {
  touched: boolean;
  dirty: boolean;
  validating: boolean;
  disabled: boolean;
  visible: boolean;
}

// Form configuration
interface FormConfig<T> {
  schema: ZodSchema<T>;
  defaultValues: T;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: T) => Promise<void> | void;
}
```

### 3. Build and Development Setup

**Time Estimate**: 4 hours

#### Subtasks:

- [ ] Configure Vite for library building
- [ ] Set up development server
- [ ] Configure test runner
- [ ] Set up type checking
- [ ] Create development scripts
- [ ] Configure bundle analysis

#### Build Configuration:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'FormsCore',
      fileName: (format) => `forms-core.${format}.js`,
    },
    rollupOptions: {
      external: ['zod'],
      output: {
        globals: {
          zod: 'Zod',
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

## Acceptance Criteria

### Build System

- [ ] `npm run build` produces optimized bundle
- [ ] Bundle size is under 10KB gzipped
- [ ] Tree shaking works correctly
- [ ] TypeScript compilation has zero errors

### Testing

- [ ] `npm run test` runs all tests
- [ ] Test coverage reporting works
- [ ] Watch mode works for development
- [ ] CI/CD pipeline can run tests

### Development Experience

- [ ] Hot reload works in development
- [ ] Type checking is fast (< 2s)
- [ ] Linting and formatting work
- [ ] VSCode IntelliSense works properly

### Documentation

- [ ] README with basic usage examples
- [ ] API documentation structure
- [ ] Contributing guidelines
- [ ] Development setup instructions

## Testing Strategy

### Unit Tests

- Type definition tests
- Build configuration tests
- Utility function tests

### Integration Tests

- End-to-end build process
- Bundle size verification
- TypeScript compilation

## Definition of Done

- [ ] All subtasks completed
- [ ] Tests pass with > 80% coverage
- [ ] Build produces optimized bundle
- [ ] Documentation is complete
- [ ] Code review completed
- [ ] Performance benchmarks baseline established

## Notes

- Focus on setting up robust foundations
- Prioritize developer experience
- Ensure compatibility with monorepo structure
- Plan for future framework adapters
