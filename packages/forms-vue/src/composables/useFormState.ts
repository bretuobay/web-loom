import { ref, onUnmounted, getCurrentInstance } from 'vue';
import type { FormInstance, FormState } from '@web-loom/forms-core';

/**
 * Composable to subscribe to form state changes
 */
export function useFormState<TValues extends Record<string, unknown>>(form: FormInstance<TValues>) {
  const state = ref<FormState<TValues>>(form.getState());

  // Subscribe to form state changes
  const unsubscribe = form.subscribe('stateChange', (newState) => {
    state.value = newState;
  });

  // Cleanup subscription on unmount
  const cleanup = () => {
    unsubscribe();
  };

  if (getCurrentInstance()) {
    onUnmounted(cleanup);
  }

  return state;
}
