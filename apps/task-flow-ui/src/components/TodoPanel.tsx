import { useEffect, useMemo, useState, useCallback, type FormEvent } from 'react';
import { todoViewModel, type TodoListItem } from '../view-models/TodoViewModel';

import { useTodoState } from '../hooks/useTodoState';
import styles from './TodoPanel.module.css';

type NormalizedTodo = TodoListItem & {
  dueDateObj: Date;
};

const startOfDay = (value: Date) => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isSameDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const describeDateGroup = (date: Date, today: Date, tomorrow: Date) => {
  if (isSameDay(date, today)) {
    return 'Today';
  }
  if (isSameDay(date, tomorrow)) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const describeError = (value: unknown) => {
  if (!value) {
    return null;
  }
  if (value instanceof Error) {
    return value.message;
  }
  return String(value);
};

const ensureDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
};

// Stable date references - computed once per day (page load)
const createStableDates = () => {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayKey = today.toISOString().split('T')[0];
  return { today, tomorrow, todayKey, todayTimestamp: today.getTime() };
};

const STABLE_DATES = createStableDates();

export function TodoPanel() {
  // Use combined hook to batch all observable updates into single state change
  const { todos, isLoading, error: viewModelError } = useTodoState();
  const [hidePast, setHidePast] = useState(false);

  // Use stable date references to prevent useMemo invalidation
  const { today, tomorrow, todayKey, todayTimestamp } = STABLE_DATES;
  const defaultDue = todayKey;

  const [formState, setFormState] = useState(() => ({
    title: '',
    details: '',
    dueDate: defaultDue
  }));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    void todoViewModel.fetchCommand.execute();
  }, []);

  const normalizedTodos = useMemo(() => {
    if (!todos) return [];
    return todos.map((todo) => ({
      ...todo,
      dueDateObj: ensureDate(todo.dueDate)
    }));
  }, [todos]);

  const groupedEntries = useMemo(() => {
    const map: Record<string, { iso: string; date: Date; todos: NormalizedTodo[] }> = {};
    normalizedTodos.forEach((todo) => {
      const bucket = startOfDay(todo.dueDateObj);
      const iso = bucket.toISOString().split('T')[0];
      if (!map[iso]) {
        map[iso] = { iso, date: bucket, todos: [] };
      }
      map[iso].todos.push(todo);
    });

    let entries = Object.values(map);
    if (hidePast) {
      // Use stable timestamp for comparison
      entries = entries.filter((group) => group.date.getTime() >= todayTimestamp);
    }

    entries.sort((a, b) => a.date.getTime() - b.date.getTime());

    const todayIndex = entries.findIndex((group) => group.iso === todayKey);
    if (todayIndex > 0) {
      const [todayGroup] = entries.splice(todayIndex, 1);
      entries.unshift(todayGroup);
    }

    return entries;
  }, [normalizedTodos, hidePast, todayTimestamp, todayKey]);

  const totals = useMemo(
    () => ({
      total: normalizedTodos.length,
      completed: normalizedTodos.filter((todo) => todo.completed).length,
      upcoming: normalizedTodos.filter(
        (todo) => startOfDay(todo.dueDateObj).getTime() >= todayTimestamp
      ).length
    }),
    [normalizedTodos, todayTimestamp]
  );

  const todaysGroup = groupedEntries.find((group) => group.iso === todayKey);
  const todaysCount = todaysGroup?.todos.length ?? 0;
  const errorMessage = describeError(viewModelError);

  const handleTogglePast = useCallback(() => {
    setHidePast((current) => !current);
  }, []);

  const handleFormChange = useCallback((field: 'title' | 'details' | 'dueDate', value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Read current form values via ref-like access in the callback
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = (formData.get('title') as string)?.trim() || '';
    const details = (formData.get('details') as string)?.trim() || '';
    const dueDate = (formData.get('dueDate') as string) || '';

    if (!title) {
      setFormError('Give this todo a short title.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    todoViewModel.createCommand.execute({
      title,
      details: details || undefined,
      dueDate: dueDate || undefined
    }).then(() => {
      setFormState({ title: '', details: '', dueDate: defaultDue });
    }).catch((error) => {
      const message = describeError(error);
      setFormError(message ?? 'Unable to save todo');
    }).finally(() => {
      setSubmitting(false);
    });
  }, [defaultDue]);

  const handleToggleComplete = useCallback(async (todo: NormalizedTodo) => {
    try {
      await todoViewModel.updateCommand.execute({
        id: todo.id,
        payload: { completed: !todo.completed }
      });
    } catch {
      // Handled via shared error stream
    }
  }, []);

  const handleDelete = useCallback(async (todoId: string) => {
    try {
      await todoViewModel.deleteCommand.execute(todoId);
    } catch {
      // ViewModel error observable surfaces this
    }
  }, []);

  const handleRetry = useCallback(() => {
    void todoViewModel.fetchCommand.execute();
  }, []);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Top of mind</p>
          <h2>Daily TODOs</h2>
          <p className={styles.lede}>
            Today’s checklist stays on top so you never lose focus on the most important dev work.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Total</span>
              <strong>{totals.total}</strong>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Completed</span>
              <strong>{totals.completed}</strong>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Upcoming</span>
              <strong>{totals.upcoming}</strong>
            </div>
          </div>
          <button
            type="button"
            className={`${styles.toggleButton} ${hidePast ? styles.toggleButtonActive : ''}`}
            onClick={handleTogglePast}
          >
            {hidePast ? 'Show past days' : 'Hide past days'}
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className={styles.error}>
          <p>{errorMessage}</p>
          <button type="button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.metaRow}>
        <div>
          <p className={styles.metaLabel}>Today</p>
          <strong>{todaysCount} check-ins</strong>
        </div>
        <div className={styles.metaLabel}>Drag or tap cards to update details.</div>
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          {isLoading ? (
            <div className={styles.loading}>Syncing todos…</div>
          ) : groupedEntries.length ? (
            groupedEntries.map((group) => (
              <article key={group.iso} className={styles.group}>
                <header className={styles.groupHeader}>
                  <div>
                    <p className={styles.groupTitle}>{describeDateGroup(group.date, today, tomorrow)}</p>
                    <span className={styles.groupCount}>{group.todos.length} items</span>
                  </div>
                  <span className={styles.groupDate}>
                    {group.date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </header>
                <div className={styles.groupList}>
                  {group.todos.map((todo) => (
                    <div key={todo.id} className={styles.todoCard}>
                      <div className={styles.todoCardHeader}>
                        <div>
                          <h3>{todo.title}</h3>
                          {todo.details && <p>{todo.details}</p>}
                        </div>
                        <span
                          className={`${styles.badge} ${
                            todo.completed ? styles.badgeSuccess : styles.badgePending
                          }`}
                        >
                          {todo.completed ? 'Done' : 'Open'}
                        </span>
                      </div>
                      <div className={styles.todoCardFooter}>
                        <span className={styles.pill}>
                          Due {todo.dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <div className={styles.todoActions}>
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(todo)}
                          >
                            {todo.completed ? 'Reopen' : 'Complete'}
                          </button>
                          <button type="button" className={styles.danger} onClick={() => handleDelete(todo.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <p className={styles.empty}>No todos yet. Start writing one from the form.</p>
          )}
        </div>

        <aside className={styles.formPanel}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
              <h3>Plan a new todo</h3>
              <p className={styles.formHint}>Leave due date blank and it will land on today.</p>
            </div>
            <label className={styles.control}>
              <span>Title</span>
              <input
                type="text"
                name="title"
                value={formState.title}
                onChange={(event) => handleFormChange('title', event.target.value)}
                placeholder="What needs your attention?"
              />
            </label>
            <label className={styles.control}>
              <span>Details (optional)</span>
              <textarea
                name="details"
                value={formState.details}
                onChange={(event) => handleFormChange('details', event.target.value)}
                placeholder="Add context or links"
                rows={3}
              />
            </label>
            <label className={styles.control}>
              <span>Due</span>
              <input
                type="date"
                name="dueDate"
                value={formState.dueDate}
                onChange={(event) => handleFormChange('dueDate', event.target.value)}
                max="2099-12-31"
              />
            </label>
            {formError && <p className={styles.formError}>{formError}</p>}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add todo'}
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
