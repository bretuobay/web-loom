import type { ZodSchema } from 'zod';

// =============================================================================
// Core Form State Types
// =============================================================================

export interface FormState<T = Record<string, unknown>> {
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

// =============================================================================
// Field Types
// =============================================================================

export interface FieldMeta {
  touched: boolean;
  dirty: boolean;
  validating: boolean;
  disabled: boolean;
  visible: boolean;
  registered: boolean;
  focused: boolean;
  blurred: boolean;
  hasError: boolean;
  lastValidated: number | null;
  validationCount: number;
  dependsOn: string[];
  dependents: string[];
  config?: FieldConfig;
}

export interface FieldState {
  value: unknown;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
  disabled: boolean;
  visible: boolean;
  focused: boolean;
  hasError: boolean;
}

export interface FieldConfig {
  validateOn?: 'change' | 'blur' | 'submit';
  debounceValidation?: number;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  transform?: (value: unknown) => unknown;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface FormConfig<TSchema extends ZodSchema, TValues = unknown> {
  schema: TSchema;
  defaultValues: TValues;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: TValues) => Promise<void> | void;
}

// =============================================================================
// Validation Types
// =============================================================================

export interface FormErrors {
  fieldErrors: Record<string, string | null>;
  formErrors: string[];
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data: T | null;
  errors: FormErrors;
}

export interface AsyncValidatorConfig {
  validator: (value: unknown, context?: { signal: AbortSignal; values: unknown }) => Promise<string | null>;
  debounce?: number;
  cache?: boolean;
  cacheTTL?: number;
}

// =============================================================================
// Event Types
// =============================================================================

export type EventCallback = (...args: unknown[]) => void;

export interface FormEventMap<T> extends Record<string, unknown[]> {
  stateChange: [FormState<T>];
  fieldChange: [{ path: string; value: unknown; fieldState: FieldState }];
  fieldFocus: [{ path: string; fieldState: FieldState }];
  fieldBlur: [{ path: string; fieldState: FieldState }];
  fieldTouch: [{ path: string; fieldState: FieldState }];
  fieldReset: [{ path: string; fieldState: FieldState }];
  validationStart: [{ path?: string }];
  validationEnd: [{ path?: string; success: boolean }];
  submit: [{ values: T; success: boolean }];
  error: [{ error: Error; path?: string }];
}

// =============================================================================
// Form Instance Types
// =============================================================================

export interface FormInstance<T = Record<string, unknown>> {
  // Field management
  registerField(path: string, config?: FieldConfig): () => void;
  unregisterField(path: string): void;
  getFieldState(path: string): FieldState | null;
  setFieldValue(path: string, value: unknown): boolean;
  getFieldValue(path: string): unknown;
  hasField(path: string): boolean;

  // Field metadata
  setFieldTouched(path: string, touched?: boolean): void;
  setFieldError(path: string, error: string | null): void;
  clearFieldError(path: string): void;
  setFieldDisabled(path: string, disabled: boolean): void;
  setFieldVisible(path: string, visible: boolean): void;

  // Form state
  getState(): FormState<T>;
  getValues(): T;
  setValues(values: Partial<T>): void;
  isDirty(): boolean;
  isValid(): boolean;
  isSubmitting(): boolean;

  // Form operations
  reset(values?: Partial<T>): void;
  clear(): void;
  submit(): Promise<void>;

  // Validation
  validate(): Promise<boolean>;
  validateField(path: string): Promise<boolean>;
  clearErrors(): void;
  setErrors(errors: { fieldErrors?: Record<string, string>; formErrors?: string[] }): void;

  // Subscriptions
  subscribe<K extends keyof FormEventMap<T>>(event: K, callback: (...args: FormEventMap<T>[K]) => void): () => void;
  subscribeToField(path: string, callback: (fieldState: FieldState) => void): () => void;
  subscribeToErrors(callback: (errors: FormErrors) => void): () => void;

  // Utilities
  destroy(): void;
}

// =============================================================================
// Type Inference Utilities
// =============================================================================

// Extract input type from Zod schema
export type InferFormValues<T extends ZodSchema> = T['_input'];

// Extract output type (with transforms) from Zod schema
export type InferFormOutput<T extends ZodSchema> = T['_output'];

// Generate type-safe paths for nested objects
export type FormPaths<T> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: T[K] extends Record<string, any>
          ? K extends string
            ? `${K}` | `${K}.${FormPaths<T[K]>}`
            : never
          : K extends string
            ? K
            : never;
      }[keyof T]
    : never;

// Field value type from path
export type FieldValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? FieldValue<T[K], Rest>
      : never
    : never;

// =============================================================================
// Utility Types
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, any> ? DeepPartial<T[P]> : T[P];
};

export type PathValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? PathValue<T[K], Rest>
      : never
    : never;

export type SetFieldValue<T, P extends FormPaths<T>, V> = T & {
  [K in keyof T]: K extends P ? V : T[K];
};
