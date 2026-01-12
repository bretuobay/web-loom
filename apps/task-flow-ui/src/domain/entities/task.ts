import { TASK_PRIORITIES, TaskPriority } from '../values/taskPriority';
import { TASK_STATUSES, TaskStatus } from '../values/taskStatus';
import { UserEntity, UserApiResponse } from './user';

export interface TaskApiResponse {
  id: string;
  title: string;
  description: string;
  status: TaskStatus | (string & {});
  priority: TaskPriority | (string & {});
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  assignee?: UserApiResponse;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreationPayload {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  assigneeName?: string;
}

export type TaskFormValues = Pick<TaskCreationPayload, 'title' | 'description' | 'status' | 'priority' | 'dueDate'>;

export class TaskEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly status: TaskStatus,
    public readonly priority: TaskPriority,
    public readonly dueDate: Date | null,
    public readonly projectId: string,
    public readonly assigneeId: string | null,
    public readonly assignee: UserEntity | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromApi(payload: TaskApiResponse) {
    const status = TASK_STATUSES.includes(payload.status as TaskStatus)
      ? (payload.status as TaskStatus)
      : 'backlog';
    const priority = TASK_PRIORITIES.includes(payload.priority as TaskPriority)
      ? (payload.priority as TaskPriority)
      : 'medium';

    const assignee = payload.assignee ? UserEntity.fromApi(payload.assignee) : null;

    return new TaskEntity(
      payload.id,
      payload.title,
      payload.description,
      status,
      priority,
      payload.dueDate ? new Date(payload.dueDate) : null,
      payload.projectId,
      payload.assigneeId,
      assignee,
      new Date(payload.createdAt),
      new Date(payload.updatedAt)
    );
  }

  get isDone() {
    return this.status === 'done';
  }
}
