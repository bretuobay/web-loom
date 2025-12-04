# @web-loom/forms-vanilla

Vanilla JavaScript adapter for the framework-agnostic [@web-loom/forms-core](../forms-core) library. Provides controllers and utilities for building reactive, validated forms in plain JS or any templating system.

## Features

- No framework required (works with any UI)
- Type-safe form state and validation
- Zod schema integration
- DOM helpers for binding fields and events
- Lightweight and tree-shakeable

## Installation

```bash
npm install @web-loom/forms-vanilla @web-loom/forms-core zod
```

## Usage Example

```js
import { createFormController } from '@web-loom/forms-vanilla';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const form = createFormController({
  schema,
  initialValues: { name: '', email: '' },
});

// Bind to DOM
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');

nameInput.addEventListener('input', (e) => form.setField('name', e.target.value));
emailInput.addEventListener('input', (e) => form.setField('email', e.target.value));

form.subscribe((state) => {
  // update UI with state.values, state.errors, etc.
});
```

## API

### Controllers

- `createFormController(options)` — Create a reactive form instance
- `FieldController` — Manage individual field state
- `FormController` — Main form logic
- `FormBinder` — Bind form to DOM elements

### Utilities

- `DOMHelpers` — DOM event and value helpers
- `EventHelpers` — Event subscription utilities

## Testing

Vitest is used for unit tests:

```bash
npm run test
```

## License

MIT
