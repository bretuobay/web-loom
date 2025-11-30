import { useMemo } from 'react';
import { useFormContext } from '../components/FormProvider';
import { useFormSubscription } from './useFormSubscription';

/**
 * Hook to access form errors
 */
export function useFormErrors() {
  const { form } = useFormContext();

  const fieldErrors = useFormSubscription(form, (state) => state.fieldErrors);

  const formErrors = useFormSubscription(form, (state) => state.formErrors);

  const errors = useMemo(() => {
    const allErrors: Record<string, string> = {};

    // Add field errors
    Object.entries(fieldErrors).forEach(([path, error]) => {
      if (typeof error === 'string') {
        allErrors[path] = error;
      }
    });

    return allErrors;
  }, [fieldErrors]);
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0 || formErrors.length > 0;
  }, [errors, formErrors]);

  const getFieldError = (fieldName: string): string | null => {
    return errors[fieldName] || null;
  };

  const hasFieldError = (fieldName: string): boolean => {
    return Boolean(errors[fieldName]);
  };

  return {
    /** All field errors as an object */
    errors,
    /** Form-level errors */
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
