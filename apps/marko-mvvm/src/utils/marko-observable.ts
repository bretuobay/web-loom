import { Observable, firstValueFrom, skip } from 'rxjs';

/**
 * Convert an Observable to a Promise for initial SSR rendering
 * This allows us to use Marko's <await> tag for progressive rendering
 */
export function observableToPromise<T>(observable: Observable<T>): Promise<T> {
  return firstValueFrom(observable);
}

/**
 * Subscribe to an Observable and update a Marko state variable
 * Returns cleanup function for effect
 */
export function subscribeToObservable<T>(observable: Observable<T>, updateFn: (value: T) => void, skipFirst = false) {
  const source = skipFirst ? observable.pipe(skip(1)) : observable;
  const subscription = source.subscribe({
    next: updateFn,
    error: (err) => console.error('Observable error:', err),
  });

  return () => subscription.unsubscribe();
}
