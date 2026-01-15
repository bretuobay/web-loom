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
}

export function ProjectDetailPanel({
  project,
  tasks,
  onClose,
  onUploadAttachment,
  isTaskFormOpen,
  onToggleTaskForm,
  onCreateTask
}: ProjectDetailPanelProps) {
  const completed = tasks.filter((task) => task.isDone).length;
  const total = tasks.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const activeTasks = tasks.filter((task) => task.status !== 'done');
  const visibleTasks = activeTasks.length ? activeTasks : tasks;
  const [activeTaskId, setActiveTaskId] = useState<string | null>(visibleTasks[0]?.id ?? null);
  const commentsViewModel = useMemo(() => new TaskCommentsViewModel(), []);

  useEffect(() => {
    if (visibleTasks.length && !visibleTasks.some((task) => task.id === activeTaskId)) {
      setActiveTaskId(visibleTasks[0].id);
    }
    if (!visibleTasks.length) {
      setActiveTaskId(null);
    }
  }, [visibleTasks, activeTaskId]);

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
              <TaskForm
                title="Quick task"
                submitLabel="Create task"
                onSubmit={onCreateTask}
              />
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
                  onSelect={(taskId) => setActiveTaskId(taskId)}
                  isSelected={activeTaskId === task.id}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No tasks are currently active for this project.</p>
        )}
      </section>

      {activeTaskId && (
        <TaskComments taskId={activeTaskId} viewModel={commentsViewModel} />
      )}
    </div>
  );
}
