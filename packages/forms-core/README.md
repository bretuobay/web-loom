# @web-loom/forms-core

Framework-agnostic form management library for building reactive, validated forms in any frontend environment. Provides core logic for form state, field management, validation, and integration with Zod schemas. Framework adapters (React, Vue, vanilla JS) live in the separate `web-loom-extensions` repo and are not yet on npm.

## Features

- Pure TypeScript, no framework dependencies (runtime deps: `@web-loom/event-emitter-core` and `rxjs`, used internally for dirty tracking and error containers; `zod` is a peer dependency)
- Type-safe form state and validation
- Zod schema integration, plus async validators
- Nested field paths, event subscriptions, and error handling
- Field dependency, visibility and focus managers

## Installation

```bash
npm install @web-loom/forms-core zod
```

## Usage Example

```typescript
import { FormFactory } from '@web-loom/forms-core';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const form = FormFactory.create({
  schema,
  defaultValues: { name: '', email: '' },
  onSubmit: async (values) => saveContact(values),
});

form.setFieldValue('name', 'Alice');
form.setFieldValue('email', 'alice@example.com');

const stop = form.subscribe('stateChange', (state) => {
  // state.values, state.errors, state.touched, etc.
});

await form.submit(); // validates, then calls onSubmit when valid
stop();
form.destroy();
```

## API

### Core

- `FormFactory.create(config)` — create a form instance (`setFieldValue`, `setFieldTouched`, `setFieldError`, `getValues`, `validate`, `submit`, `reset`, `subscribe(event, cb)`, `subscribeToField(path, cb)`, `subscribeToErrors(cb)`, `destroy`, …)
- `AdvancedFieldManager`, `FieldDependencyManager`, `FieldVisibilityManager`, `FieldFocusManager` — field-level helpers
- `AsyncValidator` / `AsyncValidationManager` — debounced, cancellable async validation

### State and validation

- `DirtyTracker`, `FieldDirtyTracker` — dirty-state tracking
- `ErrorsContainer`, `AsyncErrorsContainer` — error containers (`populateFromZodError`, `validateWithZodContainer`, `validateFieldWithZodContainer`)
- Zod helpers (`validateWithZod`, `formatZodErrors`, …) and path utilities for nested fields

## Adapters

Adapters live in the sibling [`web-loom-extensions`](https://github.com/bretuobay/web-loom-extensions) repo and are not yet on npm:

- `@web-loom/forms-react`: React hooks and context
- `@web-loom/forms-vue`: Vue 3 composables
- `@web-loom/forms-vanilla`: Vanilla JS controllers

## Testing

Vitest is used for unit tests:

```bash
pnpm test
```

## License

MIT
