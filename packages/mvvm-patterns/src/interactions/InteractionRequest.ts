import { Observable, Subject } from 'rxjs';
import { INotification, InteractionRequestedEvent } from './types';

/**
 * Enables ViewModels to request interactions from Views
 * without direct coupling to UI components.
 *
 * The ViewModel raises a request, the View subscribes and handles it,
 * then calls the callback with the response.
 *
 * @template T The type of interaction data (must extend INotification)
 *
 * @example
 * // In ViewModel
 * class OrderViewModel {
 *   readonly confirmDelete = new InteractionRequest<IConfirmation>();
 *
 *   async deleteOrder() {
 *     const response = await this.confirmDelete.raiseAsync({
 *       title: 'Delete Order',
 *       content: 'Are you sure?'
 *     });
 *     if (response.confirmed) {
 *       await this.performDelete();
 *     }
 *   }
 * }
 *
 * // In View (React)
 * useEffect(() => {
 *   const sub = vm.confirmDelete.requested$.subscribe(event => {
 *     showDialog(event.context, (confirmed) => {
 *       event.callback({ ...event.context, confirmed });
 *     });
 *   });
 *   return () => sub.unsubscribe();
 * }, []);
 */
export class InteractionRequest<T extends INotification> {
  private readonly _requested$ = new Subject<InteractionRequestedEvent<T>>();

  /**
   * Observable that Views subscribe to for handling interaction requests.
   * Each emission contains the context and a callback for the response.
   */
  public readonly requested$: Observable<InteractionRequestedEvent<T>> = this._requested$.asObservable();

  /**
   * Raise an interaction request with a callback.
   *
   * @param context The interaction context/data
   * @param callback Optional callback for the response
   */
  raise(context: T, callback?: (response: T) => void): void {
    this._requested$.next({
      context,
      callback: callback || (() => {}),
    });
  }

  /**
   * Raise an interaction request and return a Promise.
   * Useful for async/await style code.
   *
   * @param context The interaction context/data
   * @returns Promise that resolves with the response
   *
   * @example
   * const response = await confirmRequest.raiseAsync({
   *   title: 'Confirm',
   *   content: 'Proceed?'
   * });
   * if (response.confirmed) { ... }
   */
  raiseAsync(context: T): Promise<T> {
    return new Promise<T>((resolve) => {
      this.raise(context, resolve);
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this._requested$.complete();
  }
}
