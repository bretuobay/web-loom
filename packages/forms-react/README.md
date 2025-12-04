# @web-loom/forms-react

React adapter for the framework-agnostic [@web-loom/forms-core](../forms-core) library. Provides hooks and components for building reactive, validated forms in React applications.

## Features

- React 18+ hooks and context
- Type-safe form state and validation
- Zod schema integration
- Field arrays, subscriptions, and error handling
- Works with any UI library or custom components
- Lightweight and tree-shakeable

## Installation

```bash
npm install @web-loom/forms-react @web-loom/forms-core zod
```

## Usage Example

```tsx
import { useForm, useField, FormProvider } from '@web-loom/forms-react';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

function MyForm() {
  const { form, handleSubmit } = useForm({
    schema,
    initialValues: { name: '', email: '' },
  });
  const nameField = useField(form, 'name');
  const emailField = useField(form, 'email');

  return (
    <FormProvider form={form}>
      <form
        onSubmit={handleSubmit((values) => {
          /* handle submit */
        })}
      >
        <input {...nameField.inputProps} />
        <input {...emailField.inputProps} />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

## API

### Hooks

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
