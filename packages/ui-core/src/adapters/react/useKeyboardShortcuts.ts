/**
 * React adapter for keyboard shortcuts behavior.
 */

import { useState, useEffect, useRef } from 'react';
import type {
  KeyboardShortcutsBehavior,
  KeyboardShortcutsState,
  KeyboardShortcutsActions,
  KeyboardShortcutsOptions,
} from '../../behaviors/keyboard-shortcuts';
import { createKeyboardShortcuts } from '../../behaviors/keyboard-shortcuts';

/**
 * React hook for keyboard shortcuts behavior.
 * 
 * Creates and manages a keyboard shortcuts behavior instance, automatically handling
 * subscriptions and cleanup. This hook provides a centralized way to manage keyboard
 * shortcuts with support for key combination parsing, platform normalization, and
 * conflict resolution.
 * 
 * @example
 * ```tsx
 * function CommandPalette() {
 *   const shortcuts = useKeyboardShortcuts({
 *     scope: 'global',
 *     onShortcutExecuted: (key) => console.log(`Executed: ${key}`),
 *   });
 * 
 *   useEffect(() => {
 *     // Register shortcuts
 *     shortcuts.actions.registerShortcut({
 *       key: 'Ctrl+K',
 *       handler: () => setIsOpen(true),
 *       description: 'Open command palette',
 *       preventDefault: true,
 *     });
 * 
 *     shortcuts.actions.registerShortcut({
 *       key: 'Escape',
 *       handler: () => setIsOpen(false),
 *       description: 'Close command palette',
 *     });
 *   }, []);
 * 
 *   return (
 *     <div>
 *       <p>Press Ctrl+K to open command palette</p>
 *       <p>Active shortcuts: {shortcuts.activeShortcuts.join(', ')}</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @param options Configuration options for the keyboard shortcuts behavior.
 * @returns Keyboard shortcuts state and actions.
 */
export function useKeyboardShortcuts(
  options?: KeyboardShortcutsOptions
): KeyboardShortcutsState & { actions: KeyboardShortcutsActions } {
  const behaviorRef = useRef<KeyboardShortcutsBehavior | null>(null);
  
  // Initialize behavior only once
  if (behaviorRef.current === null) {
    behaviorRef.current = createKeyboardShortcuts(options);
  }

  const [state, setState] = useState<KeyboardShortcutsState>(() => 
    behaviorRef.current!.getState()
  );

  useEffect(() => {
    const behavior = behaviorRef.current!;
    
    // Subscribe to state changes
    const unsubscribe = behavior.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, []);

  return {
    ...state,
    actions: behaviorRef.current.actions,
  };
}
