import { signal, type ReadonlySignal } from '@web-loom/signals-core';
import { BaseViewModel, BaseModel } from '@web-loom/mvvm-core';
import { IActiveAware } from '../lifecycle/IActiveAware';

/**
 * Base ViewModel that implements IActiveAware.
 * Extend this class for ViewModels that need to respond to active state changes.
 *
 * @example
 * class TabViewModel extends ActiveAwareViewModel<TabModel> {
 *   private pollingSubscription?: Subscription;
 *
 *   protected onIsActiveChanged(isActive: boolean): void {
 *     if (isActive) {
 *       this.startPolling();
 *     } else {
 *       this.stopPolling();
 *     }
 *   }
 * }
 */
export abstract class ActiveAwareViewModel<TModel extends BaseModel<any, any>>
  extends BaseViewModel<TModel>
  implements IActiveAware
{
  private readonly _isActive = signal<boolean>(false);
  private _isDisposed = false;

  /**
   * Reactive signal of the active state. Signals only notify on actual
   * changes, so no distinct-until-changed handling is needed.
   */
  public readonly isActive$: ReadonlySignal<boolean> = this._isActive.asReadonly();

  /**
   * Gets the current active state
   */
  get isActive(): boolean {
    return this._isActive.peek();
  }

  /**
   * Sets the active state.
   * Triggers onIsActiveChanged() when value changes.
   */
  set isActive(value: boolean) {
    if (this._isDisposed) return;
    if (this._isActive.peek() !== value) {
      const previousValue = this._isActive.peek();
      this._isActive.set(value);
      this.onIsActiveChanged(value, previousValue);
    }
  }

  /**
   * Override this method to react to active state changes.
   * Called when isActive changes from true to false or vice versa.
   *
   * @param _isActive The new active state
   * @param _wasActive The previous active state
   *
   * @example
   * protected onIsActiveChanged(isActive: boolean, wasActive: boolean): void {
   *   if (isActive) {
   *     console.log('View became active');
   *     this.refreshData();
   *   } else {
   *     console.log('View became inactive');
   *     this.pauseUpdates();
   *   }
   * }
   */
  protected onIsActiveChanged(_isActive: boolean, _wasActive: boolean): void {
    // Default: no-op. Override in derived classes.
  }

  /**
   * Convenience method to activate the ViewModel
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Convenience method to deactivate the ViewModel
   */
  deactivate(): void {
    this.isActive = false;
  }

  public dispose(): void {
    this._isDisposed = true;
    super.dispose();
  }
}
