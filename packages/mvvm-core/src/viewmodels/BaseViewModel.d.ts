import { Observable, Subject, Subscription } from 'rxjs';
import { ZodError } from 'zod';
import { BaseModel } from '../models/BaseModel';
/**
 * @class BaseViewModel
 * A base class for ViewModels in an MVVM architecture.
 * It connects to a BaseModel and exposes its properties as observables.
 * It also handles validation errors and provides a mechanism for subscription disposal.
 * @template TModel The type of the BaseModel instance this ViewModel is connected to.
 */
export declare class BaseViewModel<TModel extends BaseModel<any, any>> {
  protected readonly _subscriptions: Subscription;
  protected readonly _destroy$: Subject<void>;
  readonly data$: Observable<TModel['data']>;
  readonly isLoading$: Observable<boolean>;
  readonly error$: Observable<any>;
  readonly validationErrors$: Observable<ZodError | null>;
  protected readonly model: TModel;
  constructor(model: TModel);
  /**
   * Adds an RxJS subscription to the ViewModel's internal subscription management.
   * This subscription will be automatically unsubscribed when `dispose()` is called.
   * @param subscription The subscription to add.
   */
  protected addSubscription(subscription: Subscription): void;
  /**
   * Disposes of all RxJS subscriptions managed by this ViewModel.
   * This method should be called when the ViewModel is no longer needed
   * to prevent memory leaks.
   */
  dispose(): void;
}
//# sourceMappingURL=BaseViewModel.d.ts.map
