import { useEffect, useMemo, useState } from 'react';
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return allTasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [allTasks, selectedTaskId]);

  useEffect(() => {
    if (selectedTaskId && !allTasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [allTasks, selectedTaskId]);

  const selectedInitialValues = useMemo(() => {
    if (!selectedTask) {
      return undefined;
    }

    return {
      title: selectedTask.title,
      description: selectedTask.description,
      status: selectedTask.status,
      priority: selectedTask.priority,
      dueDate: selectedTask.dueDate ? selectedTask.dueDate.toISOString().split('T')[0] : null,
    };
  }, [selectedTask]);

  const statusBuckets = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        status,
        count: allTasks.filter((task) => task.status === status).length,
      })),
    [allTasks],
  );

  const handleSubmit = async (values: TaskFormValues) => {
    await viewModelInstance.createTask(values);
  };

  const handleAttachmentUpload = async (taskId: string, file: File) => {
    try {
      await viewModelInstance.uploadAttachment(taskId, file);
    } catch {
      // Errors are surfaced through the view model observable.
    }
  };

  const handleUpdate = async (values: TaskFormValues) => {
    if (!selectedTask) return;
    try {
      await viewModelInstance.updateTask(selectedTask.id, values);
      setSelectedTaskId(null);
    } catch {
      // Keep the form open so the user can retry.
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    try {
      await viewModelInstance.deleteTask(selectedTask.id);
      setSelectedTaskId(null);
    } catch {
      // Keep selection to allow retry.
    }
  };

  const handleDeleteCard = async (taskId: string) => {
    const confirmed = window.confirm('Delete this task? This cannot be undone.');
    if (!confirmed) return;

    try {
      await viewModelInstance.deleteTask(taskId);
      setSelectedTaskId((current) => (current === taskId ? null : current));
    } catch {
      // Failures surface through the view model; keep the card selected so the user can retry.
    }
  };

  const handleSelect = (taskId: string) => {
    setSelectedTaskId((current) => (current === taskId ? null : taskId));
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
                className={`${styles.filterButton} ${viewModelInstance.currentFilter === status ? styles.active : ''}`}
                onClick={() => viewModelInstance.setStatusFilter(status)}
              >
                {formatTaskStatus(status)} ({bucket?.count ?? 0})
              </button>
            );
          })}
          <button type="button" className={styles.clearButton} onClick={() => viewModelInstance.setStatusFilter(null)}>
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
                    <TaskCard
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      onSelect={handleSelect}
                      onUploadAttachment={handleAttachmentUpload}
                      onDelete={handleDeleteCard}
                      deleteLabel="Delete task"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${styles.empty} animate-fadeIn`}>No tasks match the current filter.</p>
            )}
          </div>
          <div className={styles.form}>
            {selectedTask ? (
              <>
                <p className={styles.editingLabel}>Editing &ldquo;{selectedTask.title}&rdquo;</p>
                <TaskForm
                  onSubmit={handleUpdate}
                  initialValues={selectedInitialValues}
                  title="Edit task"
                  submitLabel="Update task"
                  onCancel={() => setSelectedTaskId(null)}
                />
                <div className={styles.editActions}>
                  <button type="button" className={styles.deleteButton} onClick={handleDelete} disabled={isLoading}>
                    Delete task
                  </button>
                </div>
              </>
            ) : (
              <TaskForm onSubmit={handleSubmit} submitLabel="Schedule work" />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
