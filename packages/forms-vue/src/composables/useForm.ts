import { ref, computed, onUnmounted, getCurrentInstance } from 'vue';
import { FormFactory } from '@web-loom/forms-core';
import type { ZodSchema } from 'zod';
import type { UseFormConfig, UseFormReturn, FormSubmitHandler } from '../types';
import type { InferFormValues, InferFormOutput } from '@web-loom/forms-core';

/**
 * Vue composable for form management
 */
export function useForm<TSchema extends ZodSchema>(config: UseFormConfig<TSchema>): UseFormReturn<TSchema> {
  // Create form instance
  const form = FormFactory.create(config);

  // Ensure default fields are registered so value updates stay reactive
  const registerFieldPath = (path: string) => {
    if (!path || form.hasField(path)) {
      return;
    }
    form.registerField(path);
  };

  const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return Object.prototype.toString.call(value) === '[object Object]';
  };

  const registerDefaultFields = (values: unknown, prefix?: string) => {
    if (values === null || values === undefined) {
      if (prefix) {
        registerFieldPath(prefix);
      }
      return;
    }

    if (Array.isArray(values) || !isPlainObject(values)) {
      if (prefix) {
        registerFieldPath(prefix);
      }
      return;
    }

    const entries = Object.entries(values);
    if (entries.length === 0 && prefix) {
      registerFieldPath(prefix);
      return;
    }

    for (const [key, value] of entries) {
      const path = prefix ? `${prefix}.${key}` : key;
      registerDefaultFields(value, path);
    }
  };

  registerDefaultFields(config.defaultValues ?? {});

  // Reactive form state
  const formState = ref(form.getState());

  // Subscribe to form state changes
  const unsubscribe = form.subscribe('stateChange', (newState) => {
    formState.value = newState;
  });

  const cleanup = () => {
    unsubscribe();
  };

  if (getCurrentInstance()) {
    onUnmounted(cleanup);
  }

  // Computed values
  const values = computed(() => formState.value.values as InferFormValues<TSchema>);

  const errors = computed(() => {
    const fieldErrors: Record<string, string> = {};
    Object.entries(formState.value.fieldErrors).forEach(([path, error]) => {
      if (error) {
        fieldErrors[path] = error;
      }
    });
    return fieldErrors;
  });

  const isSubmitting = computed(() => formState.value.isSubmitting);
  const isValid = computed(() => formState.value.isValid);
  const isDirty = computed(() => formState.value.isDirty);

  // Form methods
  const handleSubmit = (onSubmit: FormSubmitHandler<TSchema>) => {
    return async (event?: Event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      try {
        const isValidResult = await form.validate();

        if (isValidResult) {
          const submittedValues = form.getValues() as InferFormOutput<TSchema>;
          await onSubmit(submittedValues, form);
        }
      } catch (error) {
        console.error('Form submission error:', error);

        if (error instanceof Error) {
          form.setErrors({ formErrors: [error.message] });
        }
      }
    };
  };

  const reset = (resetValues?: Partial<InferFormValues<TSchema>>) => {
    form.reset(resetValues);
  };

  const setValues = (newValues: Partial<InferFormValues<TSchema>>) => {
    form.setValues(newValues);
  };

  const validate = () => {
    return form.validate();
  };

  return {
    form,
    formState,
    values,
    errors,
    isSubmitting,
    isValid,
    isDirty,
    handleSubmit,
    reset,
    setValues,
    validate,
  };
}
