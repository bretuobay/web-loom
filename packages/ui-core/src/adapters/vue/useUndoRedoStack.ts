/**
 * Vue adapter for undo/redo stack behavior.
 */

import { ref, computed, onUnmounted } from 'vue';
import type { UndoRedoStackState, UndoRedoStackOptions } from '../../behaviors/undo-redo-stack';
import { createUndoRedoStack } from '../../behaviors/undo-redo-stack';

/**
 * Vue composable for undo/redo stack behavior.
 *
 * Creates and manages an undo/redo stack behavior instance, automatically handling
 * subscriptions and cleanup with Vue's reactivity system. This composable provides
 * state history management with undo/redo operations, supporting time-travel
 * debugging and state persistence.
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue';
 * import { useUndoRedoStack } from '@web-loom/ui-core/vue';
 *
 * interface EditorState {
 *   content: string;
 *   cursor: number;
 * }
 *
 * const content = ref('');
 *
 * const undoRedo = useUndoRedoStack<EditorState>({
 *   initialState: { content: '', cursor: 0 },
 *   maxLength: 100,
 *   onStateChange: (state) => {
 *     content.value = state.content;
 *   },
 * });
 *
 * const handleChange = (newContent: string) => {
 *   content.value = newContent;
 *   undoRedo.actions.pushState({
 *     content: newContent,
 *     cursor: newContent.length,
 *   });
 * };
 * </script>
 *
 * <template>
 *   <div>
 *     <div>
 *       <button
 *         @click="undoRedo.actions.undo"
 *         :disabled="!undoRedo.canUndo.value"
 *       >
 *         Undo
 *       </button>
 *       <button
 *         @click="undoRedo.actions.redo"
 *         :disabled="!undoRedo.canRedo.value"
 *       >
 *         Redo
 *       </button>
 *     </div>
 *     <textarea
 *       :value="content"
 *       @input="handleChange($event.target.value)"
 *     />
 *     <p>History: {{ undoRedo.past.value.length }} past, {{ undoRedo.future.value.length }} future</p>
 *   </div>
 * </template>
 * ```
 *
 * @template T The type of state being tracked in the history.
 * @param options Configuration options for the undo/redo stack behavior.
 * @returns Reactive undo/redo stack state properties and actions.
 */
export function useUndoRedoStack<T>(options: UndoRedoStackOptions<T>) {
  const behavior = createUndoRedoStack<T>(options);
  const state = ref<UndoRedoStackState<T>>(behavior.getState());

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
    past: computed(() => state.value.past),
    present: computed(() => state.value.present),
    future: computed(() => state.value.future),
    canUndo: computed(() => state.value.canUndo),
    canRedo: computed(() => state.value.canRedo),
    maxLength: computed(() => state.value.maxLength),
    // Direct action references
    actions: behavior.actions,
  };
}
