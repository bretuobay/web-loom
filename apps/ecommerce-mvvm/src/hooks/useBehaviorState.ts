import { useEffect, useState } from 'react';

interface BehaviorLike<TState> {
  getState: () => TState;
  subscribe: (listener: (state: TState) => void) => () => void;
}

export function useBehaviorState<TState>(behavior: BehaviorLike<TState>): TState {
  const [state, setState] = useState<TState>(() => behavior.getState());

  useEffect(() => {
    const unsubscribe = behavior.subscribe((nextState) => {
      setState(nextState);
    });

    return unsubscribe;
  }, [behavior]);

  return state;
}
