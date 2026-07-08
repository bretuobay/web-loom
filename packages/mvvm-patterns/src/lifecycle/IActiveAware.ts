import type { ReadonlySignal } from '@web-loom/signals-core';

/**
 * Interface for objects that need to know if they are currently active.
 * "Active" typically means visible and receiving user interaction.
 *
 * Use cases:
 * - Pause polling when tab is inactive
 * - Stop animations when view is hidden
 * - Filter CompositeCommand execution to active views only
 */
export interface IActiveAware {
  /**
   * Gets or sets whether the object is currently active.
   * Setting this value triggers onIsActiveChanged if implemented.
   */
  isActive: boolean;

  /**
   * Reactive signal of the active state. Read the current value with
   * .get(); subscribe for change notifications.
   */
  readonly isActive$: ReadonlySignal<boolean>;
}

/**
 * Type guard to check if an object implements IActiveAware
 */
export function isActiveAware(obj: any): obj is IActiveAware {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.isActive === 'boolean' &&
    obj.isActive$ !== undefined &&
    typeof obj.isActive$.subscribe === 'function'
  );
}
