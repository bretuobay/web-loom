import { useEffect, useMemo, useState } from 'react';
import type { TaskEntity } from '../domain/entities/task';
import type { ProjectEntity } from '../domain/entities/project';
import { formatProjectStatus } from '../domain/values/projectStatus';
import { TaskCard } from './TaskCard';
import { TaskComments } from './TaskComments';
import { TaskForm, type TaskFormValues } from './TaskForm';
import { TaskCommentsViewModel } from '../view-models/TaskCommentsViewModel';
import styles from './ProjectDetailPanel.module.css';

interface ProjectDetailPanelProps {
  project: ProjectEntity;
  tasks: TaskEntity[];
  onClose: () => void;
  onUploadAttachment: (taskId: string, file: File) => Promise<void>;
  isTaskFormOpen: boolean;
  onToggleTaskForm: () => void;
  onCreateTask: (values: TaskFormValues) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function ProjectDetailPanel({
  project,
  tasks,
  onClose,
  onUploadAttachment,
  isTaskFormOpen,
  onToggleTaskForm,
  onCreateTask,
  onDeleteTask,
}: ProjectDetailPanelProps) {
  const completed = tasks.filter((task) => task.isDone).length;
  const total = tasks.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const activeTasks = tasks.filter((task) => task.status !== 'done');
  const visibleTasks = activeTasks.length ? activeTasks : tasks;
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const commentsViewModel = useMemo(() => new TaskCommentsViewModel(), []);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedTask = visibleTasks.find((task) => task.id === selectedTaskId) ?? null;

  useEffect(() => {
    if (selectedTaskId && !visibleTasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [visibleTasks, selectedTaskId]);

  const handleDeleteSelectedTask = async () => {
    if (!selectedTask) {
      return;
    }

    const confirmed = window.confirm(`Delete “${selectedTask.title}” from ${project.name}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteTask(selectedTask.id);
    } catch {
      // Keep the task selected so the user can retry if something fails.
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.root}>
      <header className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>{project.name}</h3>
          <p className={styles.description}>{project.description}</p>
        </div>
        <button type="button" onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </header>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Status</span>
          <p className={styles.summaryValue}>{formatProjectStatus(project.status)}</p>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Project color</span>
          <p className={styles.summaryValue}>{project.color}</p>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Tasks complete</span>
          <p className={styles.summaryValue}>
            {completed} / {total}
          </p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>

      <section className={styles.taskSection}>
        <div className={styles.taskHeader}>
          <h4>Active tasks</h4>
          <p>
            Showing {visibleTasks.length} task{visibleTasks.length === 1 ? '' : 's'}
          </p>
        </div>

        <section className={styles.formSection}>
          <div className={styles.formHeader}>
            <h4 className={styles.formTitle}>Add a task</h4>
            <button type="button" className={styles.formToggle} onClick={onToggleTaskForm}>
              {isTaskFormOpen ? 'Hide form' : 'Add task'}
            </button>
          </div>
          {isTaskFormOpen && (
            <div className={styles.formWrapper}>
              <TaskForm title="Quick task" submitLabel="Create task" onSubmit={onCreateTask} />
            </div>
          )}
        </section>

        {visibleTasks.length ? (
          <div className={styles.taskList}>
            {visibleTasks.map((task) => (
              <div key={task.id} className={styles.taskCardWrapper}>
                <TaskCard
                  task={task}
                  onUploadAttachment={onUploadAttachment}
                  onSelect={(taskId) => setSelectedTaskId(taskId)}
                  isSelected={selectedTaskId === task.id}
                  viewLabel="Select task"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No tasks are currently active for this project.</p>
        )}
        {selectedTask && (
          <div className={styles.taskActions}>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDeleteSelectedTask}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting task…' : 'Delete selected task'}
            </button>
          </div>
        )}
      </section>

      {selectedTaskId && <TaskComments taskId={selectedTaskId} viewModel={commentsViewModel} />}
    </div>
  );
}
