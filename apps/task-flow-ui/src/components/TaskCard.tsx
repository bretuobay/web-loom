import { TaskEntity } from '../domain/entities/task';
import { TASK_STATUSES, type TaskStatus, formatTaskStatus } from '../domain/values/taskStatus';
import { TASK_PRIORITIES, formatTaskPriority } from '../domain/values/taskPriority';

interface Props {
  task: TaskEntity;
  onStatusChange?: (taskId: string, nextStatus: TaskStatus) => void;
  onSelect?: (taskId: string) => void;
}

const statusTone: Record<TaskStatus, string> = {
  backlog: 'task-card__status--muted',
  'in-progress': 'task-card__status--accent',
  review: 'task-card__status--warning',
  done: 'task-card__status--success',
};

const priorityTone: Record<(typeof TASK_PRIORITIES)[number], string> = {
  low: 'task-card__priority--muted',
  medium: 'task-card__priority--accent',
  high: 'task-card__priority--warning',
};

export function TaskCard({ task, onStatusChange, onSelect }: Props) {
  const currentIndex = TASK_STATUSES.indexOf(task.status);
  const nextStatus = TASK_STATUSES[(currentIndex + 1) % TASK_STATUSES.length];
  const dueDateLabel = task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date';

  const handleStatusCycle = () => {
    if (!onStatusChange) return;
    onStatusChange(task.id, nextStatus);
  };

  return (
    <article className="task-card">
      <header className="task-card__header">
        <div>
          <h3>{task.title}</h3>
          <p>{task.description}</p>
        </div>
        <span className={`task-card__status ${statusTone[task.status]}`}>{formatTaskStatus(task.status)}</span>
      </header>

      <div className="task-card__meta">
        <div>
          <strong>Priority</strong>
          <span className={`task-card__priority ${priorityTone[task.priority]}`}>
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

      <footer className="task-card__actions">
        {onStatusChange && (
          <button type="button" onClick={handleStatusCycle}>
            Move to {formatTaskStatus(nextStatus)}
          </button>
        )}
        {onSelect && (
          <button type="button" className="task-card__details" onClick={() => onSelect(task.id)}>
            View task
          </button>
        )}
      </footer>
    </article>
  );
}
