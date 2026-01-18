import { useEffect, useRef, useState } from 'react';
import { combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { todoViewModel, type TodoListItem } from '../view-models/TodoViewModel';

interface TodoState {
  todos: TodoListItem[];
  isLoading: boolean;
  error: unknown;
}

const INITIAL_STATE: TodoState = {
  todos: [],
  isLoading: true,
  error: null,
};

// Deep comparison for todo state
const stateEqual = (a: TodoState, b: TodoState): boolean => {
  if (a === b) return true;
  if (a.isLoading !== b.isLoading) return false;
  if (a.error !== b.error) return false;
  if (a.todos === b.todos) return true;
  if (a.todos.length !== b.todos.length) return false;
  // Compare by ID and updated timestamp to detect actual changes
  return a.todos.every((todo, index) => {
    const other = b.todos[index];
    return todo.id === other.id && todo.updatedAt === other.updatedAt && todo.completed === other.completed;
  });
};

/**
 * Combined hook for TodoPanel that batches all observable updates into a single state.
 * This prevents multiple re-renders when the ViewModel emits rapid successive changes.
 */
export function useTodoState(): TodoState {
  const stateRef = useRef<TodoState>(INITIAL_STATE);

  const [state, setState] = useState<TodoState>(() => {
    // Synchronously read current values from BehaviorSubjects
    let syncState = INITIAL_STATE;
    const sub = combineLatest([todoViewModel.data$, todoViewModel.isLoading$, todoViewModel.error$]).subscribe(
      ([todos, isLoading, error]) => {
        syncState = {
          todos: (todos ?? []) as TodoListItem[],
          isLoading,
          error,
        };
      },
    );
    sub.unsubscribe();
    stateRef.current = syncState;
    return syncState;
  });

  useEffect(() => {
    const subscription = combineLatest([todoViewModel.data$, todoViewModel.isLoading$, todoViewModel.error$])
      .pipe(
        // Map to state shape
        map(
          ([todos, isLoading, error]): TodoState => ({
            todos: (todos ?? []) as TodoListItem[],
            isLoading,
            error,
          }),
        ),
        // Debounce rapid successive emissions (batches within 16ms - one frame)
        debounceTime(16),
        // Only emit if state actually changed
        distinctUntilChanged(stateEqual),
      )
      .subscribe((newState) => {
        // Additional guard
        if (!stateEqual(stateRef.current, newState)) {
          stateRef.current = newState;
          setState(newState);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
