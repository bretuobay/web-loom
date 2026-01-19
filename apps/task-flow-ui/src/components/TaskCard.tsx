import type { TaskEntity } from '../domain/entities/task';
import { TASK_STATUSES, type TaskStatus, formatTaskStatus } from '../domain/values/taskStatus';
import type { TASK_PRIORITIES} from '../domain/values/taskPriority';
import { formatTaskPriority } from '../domain/values/taskPriority';
import { TaskAttachments } from './TaskAttachments';
import { FileUploadDropzone } from './FileUploadDropzone';
import styles from './TaskCard.module.css';

interface Props {
  task: TaskEntity;
  onStatusChange?: (taskId: string, nextStatus: TaskStatus) => void;
  onSelect?: (taskId: string) => void;
  onUploadAttachment?: (taskId: string, file: File) => Promise<void>;
  isSelected?: boolean;
}

const statusTone: Record<TaskStatus, string> = {
  backlog: styles.statusMuted,
  'in-progress': styles.statusAccent,
  review: styles.statusWarning,
  done: styles.statusSuccess,
};

const priorityTone: Record<(typeof TASK_PRIORITIES)[number], string> = {
  low: styles.priorityMuted,
  medium: styles.priorityAccent,
  high: styles.priorityWarning,
};

export function TaskCard({ task, onStatusChange, onSelect, onUploadAttachment, isSelected }: Props) {
  const currentIndex = TASK_STATUSES.indexOf(task.status);
  const nextStatus = TASK_STATUSES[(currentIndex + 1) % TASK_STATUSES.length];
  const dueDateLabel = task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date';

  const handleStatusCycle = () => {
    if (!onStatusChange) return;
    onStatusChange(task.id, nextStatus);
  };

  const handleAttachmentUpload = async (file: File) => {
    if (!onUploadAttachment) {
      return;
    }
    await onUploadAttachment(task.id, file);
  };

  return (
    <article className={`${styles.card} ${isSelected ? styles.selected : ''}`}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>{task.title}</h3>
          <p className={styles.description}>{task.description}</p>
        </div>
        <span className={`${styles.status} ${statusTone[task.status]}`}>{formatTaskStatus(task.status)}</span>
      </header>

      <div className={styles.meta}>
        <div>
          <strong>Priority</strong>
          <span className={`${styles.priority} ${priorityTone[task.priority]}`}>
            {formatTaskPriority(task.priority)}
          </span>
        </div>
        <div>
          <strong>Due</strong>
          <span>{dueDateLabel}</span>
        </div>
        <div>
          <strong>Assignee</strong>
          <span>{task.assignee?.displayName ?? 'Unassigned'}</span>
        </div>
      </div>

      <div className={styles.attachmentSection}>
        <TaskAttachments attachments={task.attachments} />
        {onUploadAttachment && (
          <div className={styles.uploadWrapper}>
            <FileUploadDropzone onFileSelected={handleAttachmentUpload} />
          </div>
        )}
      </div>

      <footer className={styles.actions}>
        {onStatusChange && (
          <button type="button" onClick={handleStatusCycle} className={styles.button}>
            Move to {formatTaskStatus(nextStatus)}
          </button>
        )}
        {onSelect && (
          <button type="button" className={styles.detailsButton} onClick={() => onSelect(task.id)}>
            View task
          </button>
        )}
      </footer>
    </article>
  );
}
