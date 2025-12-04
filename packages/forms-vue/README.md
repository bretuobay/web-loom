# @web-loom/forms-vue

Vue 3 adapter for the framework-agnostic [@web-loom/forms-core](../forms-core) library. Provides composables and components for building reactive, validated forms in Vue applications.

## Features

- Vue 3 Composition API support
- Type-safe form state and validation
- Zod schema integration
- Field arrays, subscriptions, and error handling
- Works with any UI library or custom components
- Lightweight and tree-shakeable

## Installation

```bash
npm install @web-loom/forms-vue @web-loom/forms-core zod
```

## Usage Example

```typescript
// main.ts
import { useForm, useField } from '@web-loom/forms-vue';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const { form, handleSubmit } = useForm({
  schema,
  initialValues: { name: '', email: '' },
});

const nameField = useField(form, 'name');
const emailField = useField(form, 'email');

function onSubmit(values: any) {
  // handle form submission
}
```

## API

### Composables

- `useForm(options)` — Create a reactive form instance
- `useField(form, fieldName)` — Bind a field to form state
- `useFieldArray(form, fieldName)` — Manage array fields
- `useFormErrors(form)` — Access validation errors
- `useFormState(form)` — Access form state (dirty, touched, etc.)
- `useFormSubscription(form, callback)` — Subscribe to form changes

### Components

- `FormProvider` — Provide form context to child components

## Testing

Vitest is used for unit tests:

```bash
npm run test
```

## License

MIT
