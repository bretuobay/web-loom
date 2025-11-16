/**
 * @web-loom/ui-patterns
 * 
 * Composed UI patterns built on Web Loom UI Core behaviors.
 * 
 * This package provides higher-level UI patterns that compose atomic behaviors
 * from @web-loom/ui-core into complete interaction patterns like master-detail,
 * wizard flows, modal stacks, command palettes, and more.
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * // Import a pattern
 * import { createMasterDetail } from '@web-loom/ui-patterns';
 * 
 * // Create a pattern instance
 * const masterDetail = createMasterDetail({
 *   items: [
 *     { id: '1', name: 'Item 1' },
 *     { id: '2', name: 'Item 2' },
 *   ],
 *   getId: (item) => item.id,
 *   onSelectionChange: (item) => {
 *     console.log('Selected:', item);
 *   },
 * });
 * 
 * // Use the pattern
 * masterDetail.actions.selectItem(items[0]);
 * 
 * // Listen to events
 * masterDetail.eventBus.on('item:selected', (item) => {
 *   console.log('Item selected:', item);
 * });
 * 
 * // Clean up
 * masterDetail.destroy();
 * ```
 * 
 * @example
 * ```typescript
 * // Import wizard pattern
 * import { createWizard } from '@web-loom/ui-patterns';
 * 
 * const wizard = createWizard({
 *   steps: [
 *     { id: 'step1', label: 'Step 1' },
 *     { id: 'step2', label: 'Step 2' },
 *   ],
 *   onComplete: (data) => {
 *     console.log('Wizard completed:', data);
 *   },
 * });
 * ```
 */

// Patterns
export * from './patterns';

// Type definitions
export * from './types';

/**
 * Package version
 */
export const version = '1.0.0';
