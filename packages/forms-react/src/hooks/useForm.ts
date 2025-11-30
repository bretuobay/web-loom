import { useRef, useCallback, useMemo } from 'react';
import { FormFactory, type FormInstance } from '@web-loom/forms-core';
import type { ZodSchema } from 'zod';
import { useFormState } from './useFormState';
import type { UseFormConfig, UseFormReturn, FormSubmitHandler } from '../types';
import type { InferFormValues, InferFormOutput } from '@web-loom/forms-core';

/**
 * React hook for form management
 */
export function useForm<TSchema extends ZodSchema>(config: UseFormConfig<TSchema>): UseFormReturn<TSchema> {
  // Create form instance only once
  const formRef = useRef<FormInstance<InferFormValues<TSchema>> | null>(null);

  const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return Object.prototype.toString.call(value) === '[object Object]';
  };

  const registerFieldPath = (form: FormInstance, path: string) => {
    if (!path || form.hasField(path)) {
      return;
    }
    form.registerField(path);
  };

  const registerDefaultFields = (form: FormInstance, values: unknown, prefix?: string) => {
    if (values === null || values === undefined) {
      if (prefix) {
        registerFieldPath(form, prefix);
      }
      return;
    }

    if (Array.isArray(values) || !isPlainObject(values)) {
      if (prefix) {
        registerFieldPath(form, prefix);
      }
      return;
    }

    const entries = Object.entries(values);
    if (entries.length === 0 && prefix) {
      registerFieldPath(form, prefix);
      return;
    }

    for (const [key, value] of entries) {
      const path = prefix ? `${prefix}.${key}` : key;
      registerDefaultFields(form, value, path);
    }
  };

  if (!formRef.current) {
    const createdForm = FormFactory.create(config);
    registerDefaultFields(createdForm, config.defaultValues ?? {});
    formRef.current = createdForm;
  }

  const form = formRef.current;

  // Subscribe to form state changes
  const formState = useFormState(form);

  // Memoized handlers
  const handleSubmit = useCallback(
    (onSubmit: FormSubmitHandler<TSchema>) => {
      return async (event?: React.FormEvent) => {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        // Set submitting state
        // Note: forms-core doesn't have setSubmitting, using state tracking instead

        try {
          // Validate form
          const isValid = await form.validate();

          if (isValid) {
            // Get transformed values
            const values = form.getValues() as InferFormOutput<TSchema>;
            await onSubmit(values, form);
          }
        } catch (error) {
          // Handle submission error
          console.error('Form submission error:', error);

          // Set form-level error if needed
          if (error instanceof Error) {
            form.setErrors({ formErrors: [error.message] });
          }
        }
      };
    },
    [form],
  );

  const reset = useCallback(
    (values?: Partial<InferFormValues<TSchema>>) => {
      form.reset(values);
    },
    [form],
  );

  const setValues = useCallback(
    (values: Partial<InferFormValues<TSchema>>) => {
      form.setValues(values);
    },
    [form],
  );

  const validate = useCallback(() => {
    return form.validate();
  }, [form]);

  // Derived state
  const values = useMemo(() => form.getValues(), [formState]);
  const errors = useMemo(() => {
    const fieldErrors: Record<string, string> = {};
    Object.entries(formState.fieldErrors).forEach(([path, error]) => {
      if (typeof error === 'string') {
        fieldErrors[path] = error;
      }
    });
    return fieldErrors;
  }, [formState]);

  return {
    form,
    formState,
    values,
    errors,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    handleSubmit,
    reset,
    setValues,
    validate,
  };
}
