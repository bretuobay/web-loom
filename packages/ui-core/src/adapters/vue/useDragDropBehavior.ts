/**
 * Vue adapter for drag-and-drop behavior.
 */

import { ref, computed, onUnmounted } from 'vue';
import type {
  DragDropState,
  DragDropOptions,
} from '../../behaviors/drag-drop';
import { createDragDropBehavior } from '../../behaviors/drag-drop';

/**
 * Vue composable for drag-and-drop behavior.
 * 
 * Creates and manages a drag-and-drop behavior instance, automatically handling
 * subscriptions and cleanup with Vue's reactivity system. This composable provides
 * drag-and-drop interaction state management including drag source, drop target,
 * drag data, and validation logic.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { ref, onMounted } from 'vue';
 * import { useDragDropBehavior } from '@web-loom/ui-core/vue';
 * 
 * interface CardData {
 *   id: string;
 *   title: string;
 *   column: string;
 * }
 * 
 * const cards = ref<CardData[]>([...]);
 * 
 * const dragDrop = useDragDropBehavior({
 *   onDragStart: (itemId, data) => {
 *     console.log('Started dragging:', itemId);
 *   },
 *   onDrop: (draggedItem, dropTarget, data) => {
 *     // Move card to new column
 *     cards.value = cards.value.map(card =>
 *       card.id === draggedItem
 *         ? { ...card, column: dropTarget }
 *         : card
 *     );
 *   },
 *   validateDrop: (draggedItem, dropTarget) => {
 *     // Custom validation logic
 *     return dropTarget !== 'locked-column';
 *   },
 * });
 * 
 * onMounted(() => {
 *   // Register drop zones
 *   dragDrop.actions.registerDropZone('todo');
 *   dragDrop.actions.registerDropZone('in-progress');
 *   dragDrop.actions.registerDropZone('done');
 * });
 * 
 * const handleDragStart = (card: CardData) => {
 *   dragDrop.actions.startDrag(card.id, card);
 * };
 * 
 * const handleDragEnd = () => {
 *   dragDrop.actions.endDrag();
 * };
 * 
 * const handleDragOver = (column: string, e: DragEvent) => {
 *   e.preventDefault();
 *   dragDrop.actions.setDragOver(column);
 * };
 * 
 * const handleDragLeave = () => {
 *   dragDrop.actions.setDragOver(null);
 * };
 * 
 * const handleDrop = (column: string) => {
 *   dragDrop.actions.drop(column);
 * };
 * </script>
 * 
 * <template>
 *   <div class="kanban">
 *     <div
 *       v-for="column in ['todo', 'in-progress', 'done']"
 *       :key="column"
 *       class="column"
 *       @dragover="handleDragOver(column, $event)"
 *       @dragleave="handleDragLeave"
 *       @drop="handleDrop(column)"
 *     >
 *       <div
 *         v-for="card in cards.filter(c => c.column === column)"
 *         :key="card.id"
 *         draggable="true"
 *         @dragstart="handleDragStart(card)"
 *         @dragend="handleDragEnd"
 *       >
 *         {{ card.title }}
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 * 
 * @param options Configuration options for the drag-and-drop behavior.
 * @returns Reactive drag-and-drop state properties and actions.
 */
export function useDragDropBehavior(options?: DragDropOptions) {
  const behavior = createDragDropBehavior(options);
  const state = ref<DragDropState>(behavior.getState());

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
    draggedItem: computed(() => state.value.draggedItem),
    dropTarget: computed(() => state.value.dropTarget),
    isDragging: computed(() => state.value.isDragging),
    dragData: computed(() => state.value.dragData),
    dropZones: computed(() => state.value.dropZones),
    dragOverZone: computed(() => state.value.dragOverZone),
    // Direct action references
    actions: behavior.actions,
  };
}
