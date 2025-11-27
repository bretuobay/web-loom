import { createStore, type Store } from '@web-loom/store-core';

/**
 * Validation function that can be synchronous or asynchronous.
 * Returns an error message string if validation fails, or null/undefined if valid.
 */
export type ValidationFunction<T = any> = (value: T) => string | null | undefined | Promise<string | null | undefined>;

/**
 * Field configuration for form validation.
 */
export interface FieldConfig<T = any> {
  /**
   * Validation function for this field.
   */
  validate?: ValidationFunction<T>;

  /**
   * Initial value for the field.
   */
  initialValue?: T;
}

/**
 * Represents the state of a form behavior.
 */
export interface FormState<T extends Record<string, any> = Record<string, any>> {
  /**
   * Current values of all form fields.
   */
  values: T;

  /**
   * Error messages for each field.
   * A field with no error will not be present in this object.
   * This includes both validation errors and manual errors.
   */
  errors: Partial<Record<keyof T, string>>;

  /**
   * Manual error messages set via setFieldError.
   * These are merged with validation errors.
   */
  manualErrors: Partial<Record<keyof T, string>>;

  /**
   * Tracks which fields have been touched (focused and blurred).
   */
  touched: Partial<Record<keyof T, boolean>>;

  /**
   * Tracks which fields have been modified from their initial values.
   */
  dirty: Partial<Record<keyof T, boolean>>;

  /**
   * Whether any field is currently being validated.
   */
  isValidating: boolean;

  /**
   * Whether the entire form is valid (no errors).
   */
  isValid: boolean;

  /**
   * Whether the form is currently being submitted.
   */
  isSubmitting: boolean;

  /**
   * Number of times the form has been submitted.
   */
  submitCount: number;
}

/**
 * Actions available for controlling the form behavior.
 */
export interface FormActions<T extends Record<string, any> = Record<string, any>> {
  /**
   * Sets the value of a specific field.
   * Marks the field as dirty and optionally triggers validation.
   * @param field The field name.
   * @param value The new value for the field.
   */
  setFieldValue: (field: keyof T, value: any) => void;

  /**
   * Sets the touched state of a specific field.
   * @param field The field name.
   * @param touched Whether the field has been touched.
   */
  setFieldTouched: (field: keyof T, touched: boolean) => void;

  /**
   * Sets a manual error message for a specific field.
   * This allows setting server-side validation errors without triggering validation.
   * Manual errors are merged with validation errors.
   * @param field The field name.
   * @param error The error message, or null to clear the manual error.
   */
  setFieldError: (field: keyof T, error: string | null) => void;

  /**
   * Validates a specific field.
   * @param field The field name.
   * @returns Promise that resolves when validation is complete.
   */
  validateField: (field: keyof T) => Promise<void>;

  /**
   * Validates all fields in the form.
   * @returns Promise that resolves to true if form is valid, false otherwise.
   */
  validateForm: () => Promise<boolean>;

  /**
   * Resets the form to its initial state.
   */
  resetForm: () => void;

  /**
   * Submits the form.
   * Validates all fields before calling the onSubmit callback.
   * @returns Promise that resolves when submission is complete.
   */
  submitForm: () => Promise<void>;
}

/**
 * Options for configuring the form behavior.
 */
export interface FormBehaviorOptions<T extends Record<string, any> = Record<string, any>> {
  /**
   * Initial values for form fields.
   */
  initialValues: T;

  /**
   * Field configurations including validation functions.
   */
  fields?: Partial<Record<keyof T, FieldConfig>>;

  /**
   * Whether to validate fields on change.
   * @default false
   */
  validateOnChange?: boolean;

  /**
   * Whether to validate fields on blur (when touched).
   * @default true
   */
  validateOnBlur?: boolean;

  /**
   * Optional callback invoked when the form is submitted and valid.
   * @param values The current form values.
   */
  onSubmit?: (values: T) => void | Promise<void>;

  /**
   * Optional callback invoked when form values change.
   * @param values The current form values.
   */
  onValuesChange?: (values: T) => void;
}

/**
 * The form behavior interface returned by createFormBehavior.
 */
export interface FormBehavior<T extends Record<string, any> = Record<string, any>> {
  /**
   * Gets the current state of the form.
   */
  getState: () => FormState<T>;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: FormState<T>) => void) => () => void;

  /**
   * Actions for controlling the form.
   */
  actions: FormActions<T>;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a form behavior for managing form state, validation, and submission.
 * 
 * Supports both synchronous and asynchronous validation functions.
 * Tracks field-level state including values, errors, touched, and dirty status.
 * 
 * @example
 * ```typescript
 * const form = createFormBehavior({
 *   initialValues: {
 *     email: '',
 *     password: '',
 *   },
 *   fields: {
 *     email: {
 *       validate: (value) => {
 *         if (!value) return 'Email is required';
 *         if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
 *         return null;
 *       },
 *     },
 *     password: {
 *       validate: async (value) => {
 *         if (!value) return 'Password is required';
 *         if (value.length < 8) return 'Password must be at least 8 characters';
 *         return null;
 *       },
 *     },
 *   },
 *   onSubmit: async (values) => {
 *     console.log('Submitting:', values);
 *     // Handle form submission
 *   },
 * });
 * 
 * // Set field value
 * form.actions.setFieldValue('email', 'user@example.com');
 * 
 * // Mark field as touched
 * form.actions.setFieldTouched('email', true);
 * 
 * // Validate a field
 * await form.actions.validateField('email');
 * 
 * // Set a manual error (e.g., from server-side validation)
 * form.actions.setFieldError('email', 'Email already exists');
 * 
 * // Clear a manual error
 * form.actions.setFieldError('email', null);
 * 
 * // Submit the form
 * await form.actions.submitForm();
 * 
 * // Clean up
 * form.destroy();
 * ```
 * 
 * @param options Configuration options for the form behavior.
 * @returns A form behavior instance.
 */
export function createFormBehavior<T extends Record<string, any> = Record<string, any>>(
  options: FormBehaviorOptions<T>
): FormBehavior<T> {
  const initialState: FormState<T> = {
    values: { ...options.initialValues },
    errors: {},
    manualErrors: {},
    touched: {},
    dirty: {},
    isValidating: false,
    isValid: true,
    isSubmitting: false,
    submitCount: 0,
  };

  // Store initial values for reset functionality
  const initialValues = { ...options.initialValues };

  // Store validation errors separately from manual errors
  const validationErrors: Partial<Record<keyof T, string>> = {};

  // Helper function to merge manual and validation errors
  const mergeErrors = (manualErrors: Partial<Record<keyof T, string>>): Partial<Record<keyof T, string>> => {
    const merged: Partial<Record<keyof T, string>> = {};
    
    // Add validation errors
    for (const field in validationErrors) {
      merged[field] = validationErrors[field];
    }
    
    // Manual errors take precedence over validation errors
    for (const field in manualErrors) {
      if (manualErrors[field]) {
        merged[field] = manualErrors[field];
      }
    }
    
    return merged;
  };

  const store: Store<FormState<T>, FormActions<T>> = createStore<FormState<T>, FormActions<T>>(
    initialState,
    (set, get, actions) => ({
      setFieldValue: (field: keyof T, value: any) => {
        const currentState = get();
        const newValues = {
          ...currentState.values,
          [field]: value,
        };

        // Check if field is dirty (different from initial value)
        const isDirty = initialValues[field] !== value;

        set((state) => ({
          ...state,
          values: newValues,
          dirty: {
            ...state.dirty,
            [field]: isDirty,
          },
        }));

        // Invoke onValuesChange callback if provided
        if (options.onValuesChange) {
          options.onValuesChange(newValues);
        }

        // Validate on change if enabled
        if (options.validateOnChange) {
          actions.validateField(field);
        }
      },

      setFieldTouched: (field: keyof T, touched: boolean) => {
        set((state) => ({
          ...state,
          touched: {
            ...state.touched,
            [field]: touched,
          },
        }));

        // Validate on blur if enabled and field is being touched
        if (touched && options.validateOnBlur !== false) {
          actions.validateField(field);
        }
      },

      setFieldError: (field: keyof T, error: string | null) => {
        set((state) => {
          const newManualErrors = { ...state.manualErrors };
          
          if (error === null) {
            delete newManualErrors[field];
          } else {
            newManualErrors[field] = error;
          }
          
          const mergedErrors = mergeErrors(newManualErrors);
          const isValid = Object.keys(mergedErrors).length === 0;
          
          return {
            ...state,
            manualErrors: newManualErrors,
            errors: mergedErrors,
            isValid,
          };
        });
      },

      validateField: async (field: keyof T) => {
        const fieldConfig = options.fields?.[field];
        const validator = fieldConfig?.validate;

        if (!validator) {
          // No validator for this field, clear any existing validation error
          delete validationErrors[field];
          
          set((state) => {
            const mergedErrors = mergeErrors(state.manualErrors);
            const isValid = Object.keys(mergedErrors).length === 0;
            return {
              ...state,
              errors: mergedErrors,
              isValid,
            };
          });
          return;
        }

        set((state) => ({ ...state, isValidating: true }));

        try {
          const currentValue = get().values[field];
          const error = await Promise.resolve(validator(currentValue));

          // Update validation errors
          if (error) {
            validationErrors[field] = error;
          } else {
            delete validationErrors[field];
          }

          set((state) => {
            const mergedErrors = mergeErrors(state.manualErrors);
            const isValid = Object.keys(mergedErrors).length === 0;
            return {
              ...state,
              errors: mergedErrors,
              isValid,
              isValidating: false,
            };
          });
        } catch (err) {
          console.error(`Validation error for field ${String(field)}:`, err);
          validationErrors[field] = 'Validation failed';
          
          set((state) => {
            const mergedErrors = mergeErrors(state.manualErrors);
            return {
              ...state,
              errors: mergedErrors,
              isValid: false,
              isValidating: false,
            };
          });
        }
      },

      validateForm: async () => {
        const fields = Object.keys(options.fields || {}) as Array<keyof T>;
        
        // If no fields configured, validate all fields that have values
        const fieldsToValidate = fields.length > 0 
          ? fields 
          : Object.keys(get().values) as Array<keyof T>;

        set((state) => ({ ...state, isValidating: true }));

        try {
          // Validate all fields in parallel
          await Promise.all(
            fieldsToValidate.map((field) => actions.validateField(field))
          );

          const finalState = get();
          const isValid = Object.keys(finalState.errors).length === 0;

          set((state) => ({
            ...state,
            isValid,
            isValidating: false,
          }));

          return isValid;
        } catch (err) {
          console.error('Form validation error:', err);
          set((state) => ({
            ...state,
            isValidating: false,
          }));
          return false;
        }
      },

      resetForm: () => {
        // Clear validation errors
        for (const field in validationErrors) {
          delete validationErrors[field];
        }
        
        set((state) => ({
          ...state,
          values: { ...initialValues },
          errors: {},
          manualErrors: {},
          touched: {},
          dirty: {},
          isValidating: false,
          isValid: true,
          isSubmitting: false,
          submitCount: 0,
        }));
      },

      submitForm: async () => {
        set((state) => ({ ...state, isSubmitting: true }));

        try {
          // Validate the form before submission
          const isValid = await actions.validateForm();

          if (!isValid) {
            set((state) => ({
              ...state,
              isSubmitting: false,
              submitCount: state.submitCount + 1,
            }));
            return;
          }

          // Call onSubmit callback if provided
          if (options.onSubmit) {
            await Promise.resolve(options.onSubmit(get().values));
          }

          set((state) => ({
            ...state,
            isSubmitting: false,
            submitCount: state.submitCount + 1,
          }));
        } catch (err) {
          console.error('Form submission error:', err);
          set((state) => ({
            ...state,
            isSubmitting: false,
            submitCount: state.submitCount + 1,
          }));
        }
      },
    })
  );

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: store.destroy,
  };
}
