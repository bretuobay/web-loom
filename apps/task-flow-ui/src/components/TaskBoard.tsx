import { useMemo } from 'react';
import { TaskBoardViewModel } from '../view-models/TaskBoardViewModel';
import { useObservable } from '../hooks/useObservable';
import { TaskCard } from './TaskCard';
import { TaskForm, type TaskFormValues } from './TaskForm';
import { SkeletonList } from './Skeleton';
import { TASK_STATUSES, formatTaskStatus } from '../domain/values/taskStatus';
import styles from './TaskBoard.module.css';

interface Props {
  viewModel?: TaskBoardViewModel;
}

export function TaskBoard({ viewModel }: Props) {
  const viewModelInstance = useMemo(() => viewModel ?? new TaskBoardViewModel(), [viewModel]);
  const tasks = useObservable(viewModelInstance.filtered$, []);
  const allTasks = useObservable(viewModelInstance.tasks$, []);
  const isLoading = useObservable(viewModelInstance.isLoading$, true);
  const errorMessage = useObservable(viewModelInstance.errorMessage$, null);

  const statusBuckets = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        status,
        count: allTasks.filter((task) => task.status === status).length,
      })),
    [allTasks]
  );

  const handleSubmit = async (values: TaskFormValues) => {
    await viewModelInstance.createTask(values);
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Task Board</h2>
          <p className={styles.subtitle}>Filtered tasks and lightweight creation form.</p>
        </div>
        <div className={styles.filters}>
          {TASK_STATUSES.map((status) => {
            const bucket = statusBuckets.find((entry) => entry.status === status);
            return (
              <button
                key={status}
                type="button"
                className={`${styles.filterButton} ${
                  viewModelInstance.currentFilter === status ? styles.active : ''
                }`}
                onClick={() => viewModelInstance.setStatusFilter(status)}
              >
                {formatTaskStatus(status)} ({bucket?.count ?? 0})
              </button>
            );
          })}
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => viewModelInstance.setStatusFilter(null)}
          >
            Show all
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className={styles.error}>
          <p>{errorMessage}</p>
          <button type="button" onClick={() => viewModelInstance.refresh()} className={styles.button}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className={styles.layout}>
          <div className={styles.list}>
            <SkeletonList type="task" count={4} />
          </div>
          <div className={styles.form}>
            <TaskForm onSubmit={handleSubmit} submitLabel="Schedule work" />
          </div>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.list}>
            {tasks.length ? (
              <div className={`${styles.grid} stagger-container`}>
                {tasks.map((task) => (
                  <div key={task.id} className="stagger-item">
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${styles.empty} animate-fadeIn`}>No tasks match the current filter.</p>
            )}
          </div>
          <div className={styles.form}>
            <TaskForm onSubmit={handleSubmit} submitLabel="Schedule work" />
          </div>
        </div>
      )}
    </section>
  );
}
