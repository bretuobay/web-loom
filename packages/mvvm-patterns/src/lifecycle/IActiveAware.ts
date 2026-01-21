import { Observable } from 'rxjs';

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
   * Observable that emits when active state changes.
   * Emits current value to new subscribers.
   */
  readonly isActive$: Observable<boolean>;
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
