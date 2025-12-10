import { Subject, Subscription } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ZodError } from 'zod';
/**
 * @class BaseViewModel
 * A base class for ViewModels in an MVVM architecture.
 * It connects to a BaseModel and exposes its properties as observables.
 * It also handles validation errors and provides a mechanism for subscription disposal.
 * @template TModel The type of the BaseModel instance this ViewModel is connected to.
 */
export class BaseViewModel {
    _subscriptions = new Subscription();
    _destroy$ = new Subject(); // Used with takeUntil for disposal
    // Expose observables directly from the injected model
    //    TODO: check for reason why we need to use @ts-ignore here
    //   @ts-ignore
    data$;
    isLoading$;
    error$;
    // New: Observable for detailed Zod validation errors
    validationErrors$;
    model;
    constructor(model) {
        this.model = model;
        if (!model) {
            throw new Error('BaseViewModel requires an instance of BaseModel in its constructor.');
        }
        this.data$ = this.model.data$.pipe(takeUntil(this._destroy$));
        this.isLoading$ = this.model.isLoading$.pipe(takeUntil(this._destroy$));
        this.error$ = this.model.error$.pipe(takeUntil(this._destroy$));
        // Implement validationErrors$
        // This assumes the model's error$ could emit ZodError, or that
        // validation is triggered by the ViewModel or Model's internal logic.
        // For now, we'll derive it from the model's error$ if it's a ZodError instance.
        this.validationErrors$ = this.model.error$.pipe(map((err) => (err instanceof ZodError ? err : null)), startWith(null), // Ensure it always starts with null
        takeUntil(this._destroy$));
        // If the ViewModel needs to trigger validation based on changes to its own internal state,
        // or a specific field, that logic would be added here or in derived ViewModels.
        // For simplicity, this implementation assumes ZodError might come from the model's error$ directly.
        // A more advanced setup might have a dedicated validateAndGetErrors() method on ViewModel.
    }
    /**
     * Adds an RxJS subscription to the ViewModel's internal subscription management.
     * This subscription will be automatically unsubscribed when `dispose()` is called.
     * @param subscription The subscription to add.
     */
    addSubscription(subscription) {
        this._subscriptions.add(subscription);
    }
    /**
     * Disposes of all RxJS subscriptions managed by this ViewModel.
     * This method should be called when the ViewModel is no longer needed
     * to prevent memory leaks.
     */
    dispose() {
        this._destroy$.next();
        this._destroy$.complete();
        this._subscriptions.unsubscribe();
        // console.log('BaseViewModel disposed.'); // For debugging
    }
}
