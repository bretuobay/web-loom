/**
 * Vue adapter for keyboard shortcuts behavior.
 */

import { ref, computed, onUnmounted } from 'vue';
import type {
  KeyboardShortcutsState,
  KeyboardShortcutsActions,
} from '../../behaviors/keyboard-shortcuts';
import { createKeyboardShortcuts } from '../../behaviors/keyboard-shortcuts';

/**
 * Options for configuring the keyboard shortcuts behavior.
 */
export interface KeyboardShortcutsOptions {
  /**
   * The scope of shortcuts ('global' or 'scoped').
   * @default 'global'
   */
  scope?: 'global' | 'scoped';

  /**
   * Optional callback invoked when a shortcut is executed.
   * @param key The key combination that was executed.
   */
  onShortcutExecuted?: (key: string) => void;
}

/**
 * Vue composable for keyboard shortcuts behavior.
 * 
 * Creates and manages a keyboard shortcuts behavior instance, automatically handling
 * subscriptions and cleanup with Vue's reactivity system. This composable provides
 * a centralized way to manage keyboard shortcuts with support for key combination
 * parsing, platform normalization, and conflict resolution.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useKeyboardShortcuts } from '@web-loom/ui-core/vue';
 * import { onMounted } from 'vue';
 * 
 * const shortcuts = useKeyboardShortcuts({
 *   scope: 'global',
 *   onShortcutExecuted: (key) => console.log(`Executed: ${key}`),
 * });
 * 
 * onMounted(() => {
 *   // Register shortcuts
 *   shortcuts.actions.registerShortcut({
 *     key: 'Ctrl+K',
 *     handler: () => {
 *       isOpen.value = true;
 *     },
 *     description: 'Open command palette',
 *     preventDefault: true,
 *   });
 * 
 *   shortcuts.actions.registerShortcut({
 *     key: 'Escape',
 *     handler: () => {
 *       isOpen.value = false;
 *     },
 *     description: 'Close command palette',
 *   });
 * });
 * </script>
 * 
 * <template>
 *   <div>
 *     <p>Press Ctrl+K to open command palette</p>
 *     <p>Active shortcuts: {{ shortcuts.activeShortcuts.value.join(', ') }}</p>
 *     <p>Enabled: {{ shortcuts.enabled.value }}</p>
 *   </div>
 * </template>
 * ```
 * 
 * @param options Configuration options for the keyboard shortcuts behavior.
 * @returns Reactive keyboard shortcuts state properties and actions.
 */
export function useKeyboardShortcuts(options?: KeyboardShortcutsOptions) {
  const behavior = createKeyboardShortcuts(options);
  const state = ref<KeyboardShortcutsState>(behavior.getState());

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
    shortcuts: computed(() => state.value.shortcuts),
    scope: computed(() => state.value.scope),
    activeShortcuts: computed(() => state.value.activeShortcuts),
    enabled: computed(() => state.value.enabled),
    // Direct action references
    actions: behavior.actions,
  };
}
