import { computed } from 'vue';
import { useFormContext } from '../components/FormProvider';
import { useFormSubscription } from './useFormSubscription';

/**
 * Composable to access form errors
 */
export function useFormErrors() {
  const { form } = useFormContext();

  const fieldErrors = useFormSubscription(form, (state) => state.fieldErrors);

  const formErrors = useFormSubscription(form, (state) => state.formErrors);

  const errors = computed(() => {
    const allErrors: Record<string, string> = {};

    // Add field errors
    Object.entries(fieldErrors.value).forEach(([path, error]) => {
      if (error) {
        allErrors[path] = error;
      }
    });

    return allErrors;
  });

  const hasErrors = computed(() => {
    return Object.keys(errors.value).length > 0 || formErrors.value.length > 0;
  });

  const getFieldError = (fieldName: string): string | null => {
    return errors.value[fieldName] || null;
  };

  const hasFieldError = (fieldName: string): boolean => {
    return Boolean(errors.value[fieldName]);
  };

  return {
    /** All field errors as a computed object */
    errors,
    /** Form-level errors as a computed array */
    formErrors,
    /** Whether there are any errors */
    hasErrors,
    /** Get error for specific field */
    getFieldError,
    /** Check if field has error */
    hasFieldError,
    /** Get error message for field or empty string */
    getErrorMessage: (fieldName: string) => getFieldError(fieldName) || '',
  };
}
