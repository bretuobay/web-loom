import { provide, inject, defineComponent } from 'vue';
import type { ZodSchema } from 'zod';
import type { FormContextValue, FormProviderProps } from '../types';
import { useFormState } from '../composables/useFormState';

// Context key
const FormContextKey = Symbol('FormContext');

/**
 * Form provider component for sharing form instance across components
 */
export const FormProvider = defineComponent<FormProviderProps>({
  name: 'FormProvider',
  props: {
    form: {
      type: Object,
      required: true,
    },
  },
  setup(props, { slots }) {
    const formState = useFormState(props.form);

    const contextValue: FormContextValue = {
      form: props.form,
      formState,
    };

    provide(FormContextKey, contextValue);

    return () => slots.default?.();
  },
});

/**
 * Composable to access form context
 */
export function useFormContext<TSchema extends ZodSchema = ZodSchema>(): FormContextValue<TSchema> {
  const context = inject<FormContextValue>(FormContextKey);

  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }

  return context as FormContextValue<TSchema>;
}
