import { useState, useEffect } from 'react';
import type { FormInstance, FormState } from '../../../forms-core/src';

/**
 * Hook to subscribe to form state changes
 */
export function useFormState<TValues extends Record<string, unknown>>(form: FormInstance<TValues>): FormState<TValues> {
  const [state, setState] = useState<FormState<TValues>>(() => form.getState());

  useEffect(() => {
    // Subscribe to form state changes
    const unsubscribe = form.subscribe('stateChange', (newState: FormState<TValues>) => {
      setState(newState);
    });

    // Update to current state on mount
    setState(form.getState());

    return unsubscribe;
  }, [form]);

  return state;
}
