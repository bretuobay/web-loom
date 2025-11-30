import { ref, computed, onUnmounted } from 'vue';
import { FormFactory, type FormInstance } from '../../../forms-core/src';
import type { ZodSchema } from 'zod';
import type { UseFormConfig, UseFormReturn, FormSubmitHandler } from '../types';
import type { InferFormValues, InferFormOutput } from '../../../forms-core/src';

/**
 * Vue composable for form management
 */
export function useForm<TSchema extends ZodSchema>(config: UseFormConfig<TSchema>): UseFormReturn<TSchema> {
  // Create form instance
  const form = FormFactory.create(config);

  // Reactive form state
  const formState = ref(form.getState());

  // Subscribe to form state changes
  const unsubscribe = form.subscribe('stateChange', (newState) => {
    formState.value = newState;
  });

  // Cleanup subscription on unmount
  onUnmounted(() => {
    unsubscribe();
  });

  // Computed values
  const values = computed(() => form.getValues());

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

      // Set submitting state
      form.setSubmitting(true);

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
          form.setFormErrors([error.message]);
        }
      } finally {
        form.setSubmitting(false);
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
