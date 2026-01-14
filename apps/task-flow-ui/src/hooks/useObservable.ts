import { useEffect, useState } from 'react';
import type { Observable } from 'rxjs';

export function useObservable<T>(observable: Observable<T>, initialValue: T) {
  const [value, setValue] = useState(() => {
    // Synchronously read the current value from BehaviorSubject
    // This prevents the flash of initialValue when the observable already has a value
    let syncValue = initialValue;
    const sub = observable.subscribe((v) => {
      syncValue = v;
    });
    sub.unsubscribe();
    return syncValue;
  });

  useEffect(() => {
    const subscription = observable.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}
