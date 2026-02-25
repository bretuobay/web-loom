import { useEffect, useState } from 'react';
import type { Observable } from 'rxjs';

export function useObservable<T>(observable: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const subscription = observable.subscribe((nextValue) => {
      setValue(nextValue);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [observable]);

  return value;
}
