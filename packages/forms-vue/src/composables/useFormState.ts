import { ref, onUnmounted } from 'vue';
import type { FormInstance, FormState } from '../../../forms-core/src';

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
  onUnmounted(() => {
    unsubscribe();
  });

  return state;
}
