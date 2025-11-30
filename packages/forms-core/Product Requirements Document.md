# Product Requirements Document: @web-loom/forms-core

## Executive Summary

@web-loom/forms-core is a framework-agnostic form management library that handles the complete lifecycle of form data—from field registration and validation to submission and error handling. It provides a headless core that can power forms in React, Vue, Svelte, or vanilla JavaScript applications, filling a critical gap in the web-loom ecosystem where no unified form solution currently exists.

---

## Problem Statement

Forms are among the most complex UI patterns in web development, yet developers repeatedly solve the same problems from scratch or wrestle with framework-locked solutions.

**Validation Fragmentation**: Applications typically implement validation in multiple places—client-side for UX, server-side for security, and sometimes in schemas for documentation. Keeping these in sync is error-prone and tedious.

**State Complexity**: Form state involves values, touched fields, dirty tracking, validation states, submission status, and error messages. Managing this manually leads to bugs, especially with dynamic forms.

**Dynamic Forms Are Hard**: Adding and removing fields, conditional visibility, and dependent validations require careful orchestration that most form libraries handle poorly or not at all.

**File Uploads Are Special**: File handling requires progress tracking, chunked uploads, and different serialization—capabilities rarely integrated into form libraries.

**Framework Lock-in**: Teams using multiple frameworks (React web app, React Native mobile, Vue admin panel) must learn different form libraries with different APIs and mental models.

**No Persistence Story**: Users lose form data on page refresh, tab close, or navigation. Implementing draft saving requires custom integration with storage solutions.

The web-loom ecosystem needs a forms solution that integrates naturally with storage-core for persistence, uses Zod for validation consistency, and provides the foundation that framework-specific adapters can build upon.

---

## Goals and Success Metrics

### Primary Goals

1. Provide complete form lifecycle management without framework dependencies
2. Enable type-safe forms with full TypeScript inference from Zod schemas
3. Support complex form patterns: field arrays, conditional fields, multi-step wizards
4. Integrate seamlessly with @web-loom/storage-core for draft persistence
5. Handle file uploads with progress tracking and resumable uploads

### Success Metrics

| Metric                     | Target              | Measurement Method              |
| -------------------------- | ------------------- | ------------------------------- |
| Bundle size (core)         | < 10KB gzipped      | Build output analysis           |
| Time to first validation   | < 16ms (one frame)  | Performance benchmarks          |
| TypeScript inference depth | Full path inference | Type tests with complex schemas |
| Field array operations     | < 5ms for 100 items | Stress tests                    |
| Framework adapter size     | < 3KB each          | Build output per adapter        |

---

## User Personas

### Application Developer (Primary)

David builds a multi-step onboarding flow for a SaaS product. He needs conditional fields based on user type, validation that checks username availability, and the ability to save progress if users navigate away.

**Needs**: Declarative API, async validation, draft persistence, clear error handling
**Pain Points**: Formik re-render performance, react-hook-form's ref complexity, losing data on refresh

### Design System Engineer (Secondary)

Elena maintains her company's component library. She needs to build form components that work with any form library developers choose, without coupling the design system to a specific solution.

**Needs**: Headless approach, clear field state interface, accessible defaults
**Pain Points**: Wrapper components for each form library, inconsistent state shapes

### Full-Stack Developer (Secondary)

Kofi shares Zod schemas between his Next.js frontend and Express backend. He wants client-side validation that uses the same schemas as his API, with error messages that make sense to users.

**Needs**: Zod-first design, schema transformation, server error integration
**Pain Points**: Duplicate validation logic, translating server errors to field errors

---

## Feature Specifications

### 1. Field Registry with Validation Pipelines

**Description**: A central registry that tracks all form fields, their values, metadata, and validation state.

**Requirements**:

- Register fields with name, default value, and validation rules
- Support nested field paths using dot notation
- Track field metadata: touched, dirty, validating, disabled
- Validation pipeline with multiple validators per field
- Dependencies between field validations
- Unregister fields cleanly when removed from DOM

**API Example**:

```typescript
import { createForm } from '@web-loom/forms-core';
import { z } from 'zod';

const form = createForm({
  schema: z
    .object({
      email: z.string().email('Please enter a valid email'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords must match',
      path: ['confirmPassword'],
    }),
  defaultValues: {
    email: '',
    password: '',
    confirmPassword: '',
  },
});

// Register a field (typically called by framework adapter)
form.registerField('email', {
  onBlur: () => form.validateField('email'),
  onChange: (value) => form.setFieldValue('email', value),
});

// Get field state
const emailState = form.getFieldState('email');
// { value: '', touched: false, dirty: false, error: null, validating: false }
```

**Acceptance Criteria**:

- Fields can be registered and unregistered dynamically
- Nested paths like `address.city` work correctly
- Field state updates are synchronous and predictable
- Validation pipelines run in defined order

---

### 2. Async Validation with Debouncing

**Description**: Support for validation rules that require server round-trips, with intelligent debouncing to prevent excessive requests.

**Requirements**:

- Async validators return Promises
- Configurable debounce delay per field
- Cancel pending validations when value changes
- Show validating state during async checks
- Cache validation results to avoid redundant requests
- Concurrent async validations for multiple fields

**API Example**:

```typescript
const form = createForm({
  schema: z.object({
    username: z.string().min(3),
  }),
  asyncValidators: {
    username: {
      validator: async (value, { signal }) => {
        const response = await fetch(`/api/check-username?q=${value}`, { signal });
        const { available } = await response.json();
        return available ? null : 'Username is already taken';
      },
      debounce: 300,
      cache: true,
      cacheTTL: 60000,
    },
  },
});

// Subscribe to field validation state
form.subscribe('username', (state) => {
  if (state.validating) {
    showSpinner();
  } else if (state.error) {
    showError(state.error);
  } else {
    showSuccess();
  }
});
```

**Acceptance Criteria**:

- Debouncing prevents excessive API calls
- AbortSignal cancels in-flight requests on new input
- Cached results return immediately without network
- Validating state is true during async validation
- Multiple async validators can run concurrently

---

### 3. Field Arrays

**Description**: First-class support for dynamic lists of fields that can be added, removed, reordered, and validated as a group.

**Requirements**:

- Add items at any position
- Remove items by index
- Move/swap items for reordering
- Unique keys for stable identity across operations
- Per-item validation and array-level validation
- Minimum and maximum item constraints

**API Example**:

```typescript
const form = createForm({
  schema: z.object({
    attendees: z
      .array(
        z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().email(),
          dietaryRestrictions: z.string().optional(),
        }),
      )
      .min(1, 'At least one attendee required')
      .max(10, 'Maximum 10 attendees'),
  }),
  defaultValues: {
    attendees: [{ name: '', email: '', dietaryRestrictions: '' }],
  },
});

const attendees = form.getFieldArray('attendees');

// Add a new attendee
attendees.append({ name: '', email: '', dietaryRestrictions: '' });

// Insert at specific position
attendees.insert(1, { name: 'Jane', email: 'jane@example.com' });

// Remove by index
attendees.remove(0);

// Swap positions
attendees.swap(0, 1);

// Move item
attendees.move(2, 0);

// Get all items with their keys
const items = attendees.fields;
// [{ key: 'abc123', value: {...}, error: null }, ...]
```

**Acceptance Criteria**:

- Keys remain stable across add/remove operations
- Array-level errors display when constraints violated
- Individual item errors show on correct items
- Performance stays consistent with 100+ items
- Empty arrays are handled correctly

---

### 4. Conditional Field Rendering

**Description**: Declarative system for showing, hiding, and modifying fields based on other field values.

**Requirements**:

- Conditions based on single field values
- Complex conditions with AND/OR logic
- Conditional validation (only validate when visible)
- Conditional default values
- Field value cleanup when hidden (optional)
- Nested conditions

**API Example**:

```typescript
const form = createForm({
  schema: z.object({
    employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'student']),
    employer: z.string().optional(),
    businessName: z.string().optional(),
    university: z.string().optional(),
  }),
  conditionalFields: {
    employer: {
      when: { employmentStatus: 'employed' },
      schema: z.string().min(1, 'Employer name is required'),
      clearOnHide: true,
    },
    businessName: {
      when: { employmentStatus: 'self-employed' },
      schema: z.string().min(1, 'Business name is required'),
      clearOnHide: true,
    },
    university: {
      when: { employmentStatus: 'student' },
      schema: z.string().min(1, 'University is required'),
      clearOnHide: true,
    },
  },
});

// Check if field should be visible
const showEmployer = form.isFieldVisible('employer'); // true if employed

// Complex conditions
const form2 = createForm({
  conditionalFields: {
    spouseInfo: {
      when: (values) => values.maritalStatus === 'married' && values.filingJointly,
      schema: SpouseSchema,
    },
  },
});
```

**Acceptance Criteria**:

- Hidden fields are excluded from validation
- Hidden fields are excluded from submission (configurable)
- Visibility updates synchronously with value changes
- Circular dependencies are detected and throw
- Complex conditions with functions work correctly

---

### 5. Form-Level and Field-Level Errors

**Description**: Comprehensive error handling that distinguishes between field-specific errors and form-wide issues.

**Requirements**:

- Field errors from validation
- Form-level errors (cross-field validation, server errors)
- Error priorities (show most relevant error)
- Error clearing on value change (configurable)
- Server error integration with field mapping
- Custom error formatting

**API Example**:

```typescript
const form = createForm({
  schema: FormSchema,
  errorBehavior: {
    clearOnChange: true,
    showFirstError: false, // Show all errors or just first
    formatError: (error) => ({
      message: error.message,
      code: error.code,
      severity: 'error',
    }),
  },
});

// Get all errors
const errors = form.getErrors();
// {
//   fieldErrors: { email: 'Invalid email', password: 'Too short' },
//   formErrors: ['Passwords must match']
// }

// Set server errors after submission
form.setErrors({
  fieldErrors: {
    email: 'This email is already registered',
  },
  formErrors: ['Unable to create account. Please try again.'],
});

// Clear specific field error
form.clearFieldError('email');

// Clear all errors
form.clearErrors();
```

**Acceptance Criteria**:

- Field errors are accessible by field path
- Form errors are separate from field errors
- Server errors integrate without losing client errors
- Error clearing behavior is configurable
- Errors support structured data, not just strings

---

### 6. Integration with Zod Schemas

**Description**: Deep integration with Zod for schema definition, validation, and type inference.

**Requirements**:

- Full TypeScript inference from Zod schemas
- Support all Zod types: objects, arrays, unions, discriminated unions
- Transform support (parse, not just validate)
- Custom error messages from schema
- Partial validation for drafts
- Schema composition and extension

**API Example**:

```typescript
import { z } from 'zod';
import { createForm, inferFormValues } from '@web-loom/forms-core';

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().regex(/^\d{5}$/, 'Invalid postal code'),
  country: z.string(),
});

const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  age: z.coerce.number().min(18, 'Must be 18 or older'),
  address: AddressSchema,
  tags: z.array(z.string()).default([]),
});

type UserFormValues = inferFormValues<typeof UserSchema>;
// Fully typed: { name: string, email: string, age: number, address: {...}, tags: string[] }

const form = createForm({
  schema: UserSchema,
  defaultValues: {
    name: '',
    email: '',
    age: undefined,
    address: { street: '', city: '', postalCode: '', country: '' },
    tags: [],
  },
});

// Typed access
form.setFieldValue('address.city', 'New York'); // OK
form.setFieldValue('address.city', 123); // Type error

// Validation with transforms
const result = await form.submit();
if (result.success) {
  result.data.email; // Lowercase transformed
}
```

**Acceptance Criteria**:

- TypeScript catches invalid field paths at compile time
- TypeScript infers correct value types for each field
- Zod transforms apply during submission
- Zod refinements work for cross-field validation
- Partial schemas work for draft saving

---

### 7. File Upload with Progress Tracking

**Description**: Built-in support for file inputs with upload progress, validation, and preview generation.

**Requirements**:

- File type and size validation
- Upload progress percentage
- Multiple file support
- Image preview generation
- Drag-and-drop integration helpers
- Chunked upload support for large files
- Upload cancellation

**API Example**:

```typescript
const form = createForm({
  schema: z.object({
    documents: z.array(z.instanceof(File)).min(1, 'At least one document required').max(5, 'Maximum 5 documents'),
    avatar: z.instanceof(File).optional(),
  }),
  fileConfig: {
    documents: {
      accept: ['application/pdf', 'image/*'],
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    },
    avatar: {
      accept: ['image/jpeg', 'image/png'],
      maxSize: 2 * 1024 * 1024, // 2MB
      generatePreview: true,
    },
  },
});

// Add files (from input or drag-drop)
form.addFiles('documents', fileList);

// Get file state
const docState = form.getFileFieldState('documents');
// {
//   files: [
//     { file: File, preview: null, progress: 45, status: 'uploading' },
//     { file: File, preview: null, progress: 100, status: 'complete' }
//   ],
//   error: null
// }

// Remove a file
form.removeFile('documents', 0);

// Get preview URL for images
const avatarState = form.getFileFieldState('avatar');
avatarState.files[0].preview; // 'blob:...' or data URL

// Cancel upload
form.cancelUpload('documents', 0);

// Custom upload handler
const form2 = createForm({
  fileConfig: {
    documents: {
      upload: async (file, { onProgress, signal }) => {
        // Custom upload logic
        return { url: 'https://...', id: '123' };
      },
    },
  },
});
```

**Acceptance Criteria**:

- Progress updates fire at reasonable intervals (not every byte)
- Previews are generated without blocking main thread
- Large files use chunked upload when configured
- Cancelled uploads clean up properly
- File validation runs before upload starts

---

### 8. Form Serialization and Hydration

**Description**: Save and restore form state for draft persistence, multi-step wizards, and page reloads.

**Requirements**:

- Serialize complete form state to JSON
- Hydrate form from serialized state
- Partial hydration (merge with defaults)
- File references in serialized state (not file content)
- Integration with storage-core
- Auto-save with debouncing

**API Example**:

```typescript
import { createForm } from '@web-loom/forms-core';
import { createStorage } from '@web-loom/storage-core';

const storage = createStorage({
  backend: 'indexeddb',
  name: 'form-drafts',
});

const form = createForm({
  schema: ApplicationSchema,
  defaultValues: applicationDefaults,
  persistence: {
    storage,
    key: 'job-application-draft',
    autoSave: true,
    autoSaveDebounce: 1000,
    exclude: ['password', 'ssn'], // Never persist sensitive fields
    onRestored: (state) => {
      console.log(`Restored draft from ${state.savedAt}`);
    },
  },
});

// Manual save
await form.saveDraft();

// Manual restore
await form.restoreDraft();

// Clear saved draft
await form.clearDraft();

// Serialize without storage integration
const serialized = form.serialize();
// { values: {...}, touched: {...}, savedAt: '2024-01-15T...' }

// Hydrate from serialized state
form.hydrate(serialized);

// Check if draft exists
const hasDraft = await form.hasDraft();
```

**Acceptance Criteria**:

- Serialized state is JSON-compatible
- Files are referenced by ID, not serialized content
- Auto-save doesn't block user interaction
- Excluded fields are never persisted
- Hydration merges with defaults for missing fields

---

## Technical Architecture

### Core Design Principles

**Subscription-Based State**: All state changes emit to subscribers, enabling reactive updates without framework-specific bindings.

**Immutable Updates**: State changes produce new objects, enabling efficient change detection and time-travel debugging.

**Lazy Validation**: Validation only runs when triggered (blur, change, submit), not on every keystroke by default.

**Plugin Architecture**: Core functionality is extensible via plugins for logging, analytics, and custom behaviors.

### Package Structure

```
@web-loom/forms-core/
├── src/
│   ├── index.ts                 # Public API exports
│   ├── form.ts                  # Main createForm factory
│   ├── field.ts                 # Field state management
│   ├── field-array.ts           # Field array operations
│   ├── validation/
│   │   ├── pipeline.ts          # Validation orchestration
│   │   ├── async.ts             # Async validation handling
│   │   ├── zod-adapter.ts       # Zod integration
│   │   └── cache.ts             # Validation result caching
│   ├── files/
│   │   ├── manager.ts           # File state management
│   │   ├── upload.ts            # Upload progress tracking
│   │   ├── preview.ts           # Image preview generation
│   │   └── chunked.ts           # Chunked upload support
│   ├── persistence/
│   │   ├── serializer.ts        # State serialization
│   │   └── storage-adapter.ts   # storage-core integration
│   ├── conditions/
│   │   └── evaluator.ts         # Conditional field logic
│   ├── plugins/
│   │   ├── interface.ts         # Plugin API definition
│   │   └── devtools.ts          # Development tools plugin
│   └── utils/
│       ├── path.ts              # Dot-notation path utilities
│       ├── clone.ts             # Immutable state updates
│       └── events.ts            # Subscription management
├── adapters/                    # Framework adapters (separate packages)
│   ├── react/
│   ├── vue/
│   └── svelte/
└── tests/
```

### State Shape

```typescript
interface FormState<T> {
  // Values
  values: T;
  defaultValues: T;

  // Metadata per field
  fields: Record<string, FieldMeta>;

  // Errors
  fieldErrors: Record<string, string | null>;
  formErrors: string[];

  // Form status
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;

  // File uploads
  files: Record<string, FileFieldState>;
}

interface FieldMeta {
  touched: boolean;
  dirty: boolean;
  validating: boolean;
  disabled: boolean;
  visible: boolean;
}

interface FileFieldState {
  files: Array<{
    id: string;
    file: File;
    preview: string | null;
    progress: number;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    error: string | null;
    result: unknown;
  }>;
}
```

### Dependencies

| Dependency             | Type          | Purpose                              |
| ---------------------- | ------------- | ------------------------------------ |
| zod                    | Peer          | Schema validation and type inference |
| @web-loom/storage-core | Optional Peer | Draft persistence                    |

---

## Framework Adapters

The core library is framework-agnostic. Thin adapters provide idiomatic APIs for each framework.

### React Adapter (@web-loom/forms-react)

```typescript
import { useForm, useField, useFieldArray } from '@web-loom/forms-react';

function SignupForm() {
  const form = useForm({
    schema: SignupSchema,
    defaultValues: { email: '', password: '' },
    onSubmit: async (data) => {
      await api.signup(data);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <EmailField form={form} />
      <PasswordField form={form} />
      <button type="submit" disabled={form.isSubmitting}>
        Sign Up
      </button>
    </form>
  );
}

function EmailField({ form }) {
  const field = useField(form, 'email');

  return (
    <div>
      <input
        value={field.value}
        onChange={e => field.onChange(e.target.value)}
        onBlur={field.onBlur}
      />
      {field.error && <span className="error">{field.error}</span>}
    </div>
  );
}
```

### Vue Adapter (@web-loom/forms-vue)

```typescript
import { useForm, useField } from '@web-loom/forms-vue';

const form = useForm({
  schema: SignupSchema,
  defaultValues: { email: '', password: '' },
});

const email = useField(form, 'email');
// email.value is a ref
// email.error is a computed
```

---

## Integration with Ecosystem

### With @web-loom/storage-core

```typescript
import { createForm } from '@web-loom/forms-core';
import { createStorage } from '@web-loom/storage-core';

const storage = createStorage({
  backend: 'indexeddb',
  name: 'app-drafts',
  encryption: { enabled: true, password: userSecret },
});

const form = createForm({
  schema: SensitiveFormSchema,
  persistence: { storage, key: 'medical-form' },
});
```

### With Future @web-loom/auth-core

```typescript
const form = createForm({
  schema: LoginSchema,
  onSubmit: async (data) => {
    const result = await auth.login(data);
    if (!result.success) {
      form.setErrors({ formErrors: [result.error] });
    }
  },
});
```

---

## Edge Cases and Error Handling

### Race Conditions

**Scenario**: User types quickly, triggering multiple async validations.
**Solution**: AbortController cancels previous requests. Only the latest validation result is applied.

### Circular Dependencies

**Scenario**: Field A's visibility depends on Field B, which depends on Field A.
**Solution**: Detect cycles during form creation and throw descriptive error.

### Orphaned Field Arrays

**Scenario**: User removes all items from a required array.
**Solution**: Array-level validation shows error. Optional minimum item count enforcement.

### Stale Closure in Callbacks

**Scenario**: Submit handler captures stale form values.
**Solution**: Submit handler receives current values as argument, not closure.

### File Upload Failures

**Scenario**: Network fails mid-upload.
**Solution**: Retry with exponential backoff. Resume from last successful chunk for chunked uploads.

---

## Risks and Mitigations

| Risk                                       | Likelihood | Impact | Mitigation                                                    |
| ------------------------------------------ | ---------- | ------ | ------------------------------------------------------------- |
| Performance with large forms (100+ fields) | Medium     | High   | Virtual field registry, lazy validation, benchmark suite      |
| Zod bundle size concerns                   | Medium     | Medium | Document tree-shaking, provide minimal validation alternative |
| Complex TypeScript inference slows IDE     | Medium     | Medium | Optimize type definitions, provide escape hatches             |
| Breaking changes in Zod 4                  | Low        | High   | Abstract validation layer, version compatibility tests        |
| File API differences across browsers       | Medium     | Low    | Polyfills, feature detection, graceful degradation            |

---

## Release Plan

### Phase 1: Core Foundation (v0.1.0)

- Field registry and state management
- Zod schema integration
- Synchronous validation
- Basic error handling
- TypeScript inference

### Phase 2: Advanced Validation (v0.2.0)

- Async validation with debouncing
- Validation caching
- Cross-field validation
- Server error integration

### Phase 3: Dynamic Forms (v0.3.0)

- Field arrays
- Conditional fields
- Dynamic schema modification

### Phase 4: Files and Persistence (v0.4.0)

- File upload with progress
- Image preview generation
- storage-core integration
- Auto-save drafts

### Phase 5: Framework Adapters (v0.5.0)

- React adapter
- Vue adapter
- Svelte adapter

### Phase 6: Production Ready (v1.0.0)

- Performance optimization
- DevTools plugin
- Documentation site
- Migration guides from Formik/react-hook-form

---

## Success Criteria for v1.0

1. **Type Safety**: Zero `any` types in public API. Full inference from Zod schemas.
2. **Performance**: Handle 100-field forms without perceptible lag.
3. **Bundle Size**: Core under 10KB, React adapter under 3KB.
4. **Test Coverage**: 95%+ coverage with unit and integration tests.
5. **Documentation**: Complete API reference, guides for common patterns, migration docs.
6. **Ecosystem Fit**: Seamless integration with storage-core, used by 2+ web-loom packages.

---

## Open Questions

1. **Wizard/Multi-Step Forms**: Should multi-step orchestration be in core or a separate package? Leaning toward separate `@web-loom/forms-wizard` to keep core focused.

2. **Server Actions Integration**: With React Server Actions and similar patterns emerging, should we provide first-class integration? Need to research patterns.

3. **Form Builder**: Should we provide a declarative JSON schema for generating forms? This would enable no-code form building but adds complexity.

4. **Accessibility**: Should the core library emit ARIA attributes, or leave that entirely to adapters? Current thinking: provide recommended attributes, adapters apply them.

5. **Validation Libraries**: While Zod is primary, should we support Yup, Valibot, or Arktype via adapters? Could define a `ValidationAdapter` interface.

---

## Appendix: Competitive Analysis

| Feature              | forms-core               | React Hook Form | Formik    | Vue Formulate |
| -------------------- | ------------------------ | --------------- | --------- | ------------- |
| Framework-agnostic   | ✓                        | ✗ (React)       | ✗ (React) | ✗ (Vue)       |
| TypeScript inference | Full                     | Full            | Partial   | Partial       |
| Bundle size          | ~10KB                    | ~9KB            | ~15KB     | ~20KB         |
| Async validation     | Debounced + cached       | Basic           | Basic     | Basic         |
| Field arrays         | First-class              | ✓               | ✓         | Limited       |
| File uploads         | Built-in + progress      | Manual          | Manual    | ✓             |
| Persistence          | storage-core integration | Manual          | Manual    | ✗             |
| Conditional fields   | Declarative              | Manual          | Manual    | ✓             |
| Zod integration      | Native                   | Plugin          | Plugin    | ✗             |

---

_Document Version: 1.0_  
_Last Updated: November 2025_  
_Author: Claude_  
_Status: Draft for Review_
