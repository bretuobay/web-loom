# @web-loom/forms-core

Framework-agnostic form management library for building reactive, validated forms in any frontend environment. Provides core logic for form state, field management, validation, and integration with Zod schemas. Adapters are available for React, Vue, and vanilla JS.

## Features

- Pure TypeScript, no framework dependencies
- Type-safe form state and validation
- Zod schema integration
- Field arrays, subscriptions, and error handling
- Composable architecture for adapters (React, Vue, Vanilla)
- Lightweight and tree-shakeable

## Installation

```bash
npm install @web-loom/forms-core zod
```

## Usage Example

```typescript
import { createForm } from '@web-loom/forms-core';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const form = createForm({
  schema,
  initialValues: { name: '', email: '' },
});

form.setField('name', 'Alice');
form.setField('email', 'alice@example.com');

form.subscribe((state) => {
  // state.values, state.errors, state.touched, etc.
});
```

## API

### Core

- `createForm(options)` — Create a reactive form instance
- `FormController` — Main form logic
- `FieldController` — Manage individual field state
- `FormBinder` — Bind form to external systems

### Utilities

- `events` — Event subscription helpers
- `path` — Path utilities for nested fields
- `validation` — Zod integration and validation helpers

## Adapters

- [@web-loom/forms-react](../forms-react): React hooks and context
- [@web-loom/forms-vue](../forms-vue): Vue 3 composables
- [@web-loom/forms-vanilla](../forms-vanilla): Vanilla JS controllers

## Testing

Vitest is used for unit tests:

```bash
npm run test
```

## License

MIT
