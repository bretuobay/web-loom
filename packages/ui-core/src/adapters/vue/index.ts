/**
 * Vue Framework Adapters
 * 
 * This module provides Vue composables for all UI Core behaviors.
 * These composables handle behavior lifecycle, state reactivity, and cleanup.
 */

import { ref, computed, onUnmounted } from 'vue';
import type {
  DialogState,
  DialogBehaviorOptions,
  RovingFocusState,
  RovingFocusOptions,
  ListSelectionState,
  ListSelectionOptions,
  DisclosureState,
  DisclosureBehaviorOptions,
  FormState,
  FormBehaviorOptions,
} from '../../behaviors';
import {
  createDialogBehavior,
  createRovingFocus,
  createListSelection,
  createDisclosureBehavior,
  createFormBehavior,
} from '../../behaviors';

// Export new behavior composables
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useUndoRedoStack } from './useUndoRedoStack';
export { useDragDropBehavior } from './useDragDropBehavior';

/**
 * Vue composable for dialog behavior.
 * 
 * Creates and manages a dialog behavior instance, automatically handling
 * subscriptions and cleanup with Vue's reactivity system.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useDialogBehavior } from '@web-loom/ui-core/vue';
 * 
 * const dialog = useDialogBehavior({
 *   id: 'my-dialog',
 *   onOpen: (content) => console.log('Opened:', content),
 * });
 * </script>
 * 
 * <template>
 *   <div>
 *     <button @click="dialog.actions.open({ title: 'Hello' })">
 *       Open Dialog
 *     </button>
 *     <div v-if="dialog.isOpen.value" class="dialog">
 *       <h2>{{ dialog.content.value?.title }}</h2>
 *       <button @click="dialog.actions.close">Close</button>
 *     </div>
 *   </div>
 * </template>
 * ```
 * 
 * @param options Configuration options for the dialog behavior.
 * @returns Reactive dialog state properties and actions.
 */
export function useDialogBehavior(options?: DialogBehaviorOptions) {
  const behavior = createDialogBehavior(options);
  const state = ref<DialogState>(behavior.getState());

  // Subscribe to state changes
  const unsubscribe = behavior.subscribe((newState) => {
    state.value = newState;
  });

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe();
    behavior.destroy();
  });

  return {
    // Computed properties for state
    isOpen: computed(() => state.value.isOpen),
    content: computed(() => state.value.content),
    id: computed(() => state.value.id),
    // Direct action references
    actions: behavior.actions,
  };
}

/**
 * Vue composable for roving focus behavior.
 * 
 * Creates and manages a roving focus behavior instance for keyboard navigation
 * through lists, menus, and other collections.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useRovingFocus } from '@web-loom/ui-core/vue';
 * 
 * const focus = useRovingFocus({
 *   items: ['item-1', 'item-2', 'item-3'],
 *   orientation: 'vertical',
 * });
 * 
 * const handleKeyDown = (e) => {
 *   if (e.key === 'ArrowDown') focus.actions.moveNext();
 *   if (e.key === 'ArrowUp') focus.actions.movePrevious();
 * };
 * </script>
 * 
 * <template>
 *   <ul @keydown="handleKeyDown">
 *     <li
 *       v-for="(item, index) in focus.items.value"
 *       :key="item"
 *       :tabindex="focus.currentIndex.value === index ? 0 : -1"
 *     >
 *       {{ item }}
 *     </li>
 *   </ul>
 * </template>
 * ```
 * 
 * @param options Configuration options for the roving focus behavior.
 * @returns Reactive roving focus state properties and actions.
 */
export function useRovingFocus(options?: RovingFocusOptions) {
  const behavior = createRovingFocus(options);
  const state = ref<RovingFocusState>(behavior.getState());

  const unsubscribe = behavior.subscribe((newState) => {
    state.value = newState;
  });

  onUnmounted(() => {
    unsubscribe();
    behavior.destroy();
  });

  return {
    currentIndex: computed(() => state.value.currentIndex),
    items: computed(() => state.value.items),
    orientation: computed(() => state.value.orientation),
    wrap: computed(() => state.value.wrap),
    actions: behavior.actions,
  };
}

/**
 * Vue composable for list selection behavior.
 * 
 * Creates and manages a list selection behavior instance with support for
 * single, multi, and range selection modes.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useListSelection } from '@web-loom/ui-core/vue';
 * 
 * const selection = useListSelection({
 *   items: ['file-1', 'file-2', 'file-3'],
 *   mode: 'multi',
 * });
 * </script>
 * 
 * <template>
 *   <ul>
 *     <li
 *       v-for="item in selection.items.value"
 *       :key="item"
 *       @click="selection.actions.toggleSelection(item)"
 *       :class="{ selected: selection.selectedIds.value.includes(item) }"
 *     >
 *       {{ item }}
 *     </li>
 *   </ul>
 * </template>
 * ```
 * 
 * @param options Configuration options for the list selection behavior.
 * @returns Reactive list selection state properties and actions.
 */
export function useListSelection(options?: ListSelectionOptions) {
  const behavior = createListSelection(options);
  const state = ref<ListSelectionState>(behavior.getState());

  const unsubscribe = behavior.subscribe((newState) => {
    state.value = newState;
  });

  onUnmounted(() => {
    unsubscribe();
    behavior.destroy();
  });

  return {
    selectedIds: computed(() => state.value.selectedIds),
    lastSelectedId: computed(() => state.value.lastSelectedId),
    mode: computed(() => state.value.mode),
    items: computed(() => state.value.items),
    actions: behavior.actions,
  };
}

/**
 * Vue composable for disclosure behavior.
 * 
 * Creates and manages a disclosure behavior instance for expandable/collapsible
 * content like accordions and collapsible sections.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useDisclosureBehavior } from '@web-loom/ui-core/vue';
 * 
 * const disclosure = useDisclosureBehavior({
 *   id: 'section-1',
 * });
 * </script>
 * 
 * <template>
 *   <div>
 *     <button @click="disclosure.actions.toggle">
 *       {{ disclosure.isExpanded.value ? 'Collapse' : 'Expand' }}
 *     </button>
 *     <div v-if="disclosure.isExpanded.value" class="content">
 *       Expandable content here
 *     </div>
 *   </div>
 * </template>
 * ```
 * 
 * @param options Configuration options for the disclosure behavior.
 * @returns Reactive disclosure state properties and actions.
 */
export function useDisclosureBehavior(options?: DisclosureBehaviorOptions) {
  const behavior = createDisclosureBehavior(options);
  const state = ref<DisclosureState>(behavior.getState());

  const unsubscribe = behavior.subscribe((newState) => {
    state.value = newState;
  });

  onUnmounted(() => {
    unsubscribe();
    behavior.destroy();
  });

  return {
    isExpanded: computed(() => state.value.isExpanded),
    id: computed(() => state.value.id),
    actions: behavior.actions,
  };
}

/**
 * Vue composable for form behavior.
 * 
 * Creates and manages a form behavior instance with validation support.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useFormBehavior } from '@web-loom/ui-core/vue';
 * 
 * const form = useFormBehavior({
 *   initialValues: { email: '', password: '' },
 *   fields: {
 *     email: {
 *       validate: (value) => {
 *         if (!value) return 'Email is required';
 *         if (!value.includes('@')) return 'Invalid email';
 *         return null;
 *       },
 *     },
 *     password: {
 *       validate: (value) => {
 *         if (!value) return 'Password is required';
 *         if (value.length < 8) return 'Password must be at least 8 characters';
 *         return null;
 *       },
 *     },
 *   },
 *   onSubmit: async (values) => {
 *     await login(values);
 *   },
 * });
 * 
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   form.actions.submitForm();
 * };
 * </script>
 * 
 * <template>
 *   <form @submit="handleSubmit">
 *     <input
 *       type="email"
 *       :value="form.values.value.email"
 *       @input="form.actions.setFieldValue('email', $event.target.value)"
 *       @blur="form.actions.setFieldTouched('email', true)"
 *     />
 *     <span v-if="form.touched.value.email && form.errors.value.email" class="error">
 *       {{ form.errors.value.email }}
 *     </span>
 *     
 *     <input
 *       type="password"
 *       :value="form.values.value.password"
 *       @input="form.actions.setFieldValue('password', $event.target.value)"
 *       @blur="form.actions.setFieldTouched('password', true)"
 *     />
 *     <span v-if="form.touched.value.password && form.errors.value.password" class="error">
 *       {{ form.errors.value.password }}
 *     </span>
 *     
 *     <button type="submit" :disabled="!form.isValid.value || form.isSubmitting.value">
 *       {{ form.isSubmitting.value ? 'Submitting...' : 'Login' }}
 *     </button>
 *   </form>
 * </template>
 * ```
 * 
 * @param options Configuration options for the form behavior.
 * @returns Reactive form state properties and actions.
 */
export function useFormBehavior<T extends Record<string, any>>(
  options: FormBehaviorOptions<T>
) {
  const behavior = createFormBehavior<T>(options);
  const state = ref<FormState<T>>(behavior.getState());

  const unsubscribe = behavior.subscribe((newState) => {
    state.value = newState;
  });

  onUnmounted(() => {
    unsubscribe();
    behavior.destroy();
  });

  return {
    values: computed(() => state.value.values),
    errors: computed(() => state.value.errors),
    touched: computed(() => state.value.touched),
    dirty: computed(() => state.value.dirty),
    isValidating: computed(() => state.value.isValidating),
    isValid: computed(() => state.value.isValid),
    isSubmitting: computed(() => state.value.isSubmitting),
    submitCount: computed(() => state.value.submitCount),
    actions: behavior.actions,
  };
}
