/**
 * @web-loom/ui-core
 * 
 * Framework-agnostic headless UI behaviors for modern web applications.
 * 
 * This package provides atomic UI interaction behaviors that can be used
 * across different frameworks (React, Vue, Angular) or with vanilla JavaScript.
 * All behaviors are built on top of @web-loom/store-core for state management.
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * // Import a behavior
 * import { createDialogBehavior } from '@web-loom/ui-core';
 * 
 * // Create a behavior instance
 * const dialog = createDialogBehavior({
 *   id: 'my-dialog',
 *   onOpen: () => console.log('Dialog opened'),
 * });
 * 
 * // Use the behavior
 * dialog.actions.open({ title: 'Hello' });
 * 
 * // Subscribe to changes
 * const unsubscribe = dialog.subscribe((state) => {
 *   console.log('Dialog state:', state);
 * });
 * 
 * // Clean up
 * unsubscribe();
 * dialog.destroy();
 * ```
 * 
 * @example
 * ```typescript
 * // Import React hooks
 * import { useDialogBehavior } from '@web-loom/ui-core/react';
 * 
 * function MyComponent() {
 *   const dialog = useDialogBehavior();
 *   
 *   return (
 *     <button onClick={() => dialog.open({ title: 'Hello' })}>
 *       Open Dialog
 *     </button>
 *   );
 * }
 * ```
 */

// Behaviors
export * from './behaviors';

// Framework adapters
export * from './adapters/react';
// export * from './adapters/vue';
// export * from './adapters/angular';

// Type definitions
export * from './types';

/**
 * Package version
 */
export const version = '1.0.0';
