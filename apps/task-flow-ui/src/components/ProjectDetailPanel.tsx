import type { TaskEntity } from '../domain/entities/task';
import type { ProjectEntity } from '../domain/entities/project';
import { formatProjectStatus } from '../domain/values/projectStatus';
import { TaskCard } from './TaskCard';
import styles from './ProjectDetailPanel.module.css';

interface ProjectDetailPanelProps {
  project: ProjectEntity;
  tasks: TaskEntity[];
  onClose: () => void;
  onUploadAttachment: (taskId: string, file: File) => Promise<void>;
}

export function ProjectDetailPanel({
  project,
  tasks,
  onClose,
  onUploadAttachment
}: ProjectDetailPanelProps) {
  const completed = tasks.filter((task) => task.isDone).length;
  const total = tasks.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const activeTasks = tasks.filter((task) => task.status !== 'done');
  const visibleTasks = activeTasks.length ? activeTasks : tasks;

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

        {visibleTasks.length ? (
          <div className={styles.taskList}>
            {visibleTasks.map((task) => (
              <div key={task.id} className={styles.taskCardWrapper}>
                <TaskCard task={task} onUploadAttachment={onUploadAttachment} />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No tasks are currently active for this project.</p>
        )}
      </section>
    </div>
  );
}
