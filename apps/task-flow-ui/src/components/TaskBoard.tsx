import { useMemo } from 'react';
import { TaskBoardViewModel } from '../view-models/TaskBoardViewModel';
import { useObservable } from '../hooks/useObservable';
import { TaskCard } from './TaskCard';
import { TaskForm, type TaskFormValues } from './TaskForm';
import { TASK_STATUSES, formatTaskStatus } from '../domain/values/taskStatus';

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
        count: allTasks.filter((task) => task.status === status).length
      })),
    [allTasks]
  );

  const handleSubmit = async (values: TaskFormValues) => {
    await viewModelInstance.createTask(values);
  };

  return (
    <section className="task-board">
      <header className="task-board__header">
        <div>
          <h2>Task Board</h2>
          <p className="project-list__subhead">Filtered tasks and lightweight creation form.</p>
        </div>
        <div className="task-board__filters">
          {TASK_STATUSES.map((status) => {
            const bucket = statusBuckets.find((entry) => entry.status === status);
            return (
              <button
                key={status}
                type="button"
                className={viewModelInstance.currentFilter === status ? 'is-active' : ''}
                onClick={() => viewModelInstance.setStatusFilter(status)}
              >
                {formatTaskStatus(status)} ({bucket?.count ?? 0})
              </button>
            );
          })}
          <button
            type="button"
            className="task-board__filters-clear"
            onClick={() => viewModelInstance.setStatusFilter(null)}
          >
            Show all
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="task-board__error">
          <p>{errorMessage}</p>
          <button type="button" onClick={() => viewModelInstance.refresh()}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="panel__empty">Loading tasks…</p>
      ) : (
        <div className="task-board__layout">
          <div className="task-board__list">
            {tasks.length ? (
              <div className="task-board__grid">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <p className="project-list__empty">No tasks match the current filter.</p>
            )}
          </div>
          <div className="task-board__form">
            <TaskForm onSubmit={handleSubmit} submitLabel="Schedule work" />
          </div>
        </div>
      )}
    </section>
  );
}
