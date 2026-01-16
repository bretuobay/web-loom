import { TASK_PRIORITIES, type TaskPriority } from '../values/taskPriority';
import { TASK_STATUSES, type TaskStatus } from '../values/taskStatus';
import { AttachmentEntity, type AttachmentApiResponse } from './attachment';
import { UserEntity, type UserApiResponse } from './user';

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
  attachments?: AttachmentApiResponse[];
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

export type TaskUpdatePayload = Partial<TaskCreationPayload>;

export type TaskFormValues = Pick<TaskCreationPayload, 'title' | 'description' | 'status' | 'priority' | 'dueDate'>;

export class TaskEntity {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate: Date | null;
  readonly projectId: string;
  readonly assigneeId: string | null;
  readonly assignee: UserEntity | null;
  readonly attachments: AttachmentEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    title: string,
    description: string,
    status: TaskStatus,
    priority: TaskPriority,
    dueDate: Date | null,
    projectId: string,
    assigneeId: string | null,
    assignee: UserEntity | null,
    attachments: AttachmentEntity[],
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.dueDate = dueDate;
    this.projectId = projectId;
    this.assigneeId = assigneeId;
    this.assignee = assignee;
    this.attachments = attachments;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromApi(payload: TaskApiResponse) {
    const status = TASK_STATUSES.includes(payload.status as TaskStatus)
      ? (payload.status as TaskStatus)
      : 'backlog';
    const priority = TASK_PRIORITIES.includes(payload.priority as TaskPriority)
      ? (payload.priority as TaskPriority)
      : 'medium';

    const assignee = payload.assignee ? UserEntity.fromApi(payload.assignee) : null;
    const attachments = payload.attachments?.map((attachment) => AttachmentEntity.fromApi(attachment)) ?? [];

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
      attachments,
      new Date(payload.createdAt),
      new Date(payload.updatedAt)
    );
  }

  get isDone() {
    return this.status === 'done';
  }

  withAttachments(attachments: AttachmentEntity[]) {
    return new TaskEntity(
      this.id,
      this.title,
      this.description,
      this.status,
      this.priority,
      this.dueDate,
      this.projectId,
      this.assigneeId,
      this.assignee,
      attachments,
      this.createdAt,
      this.updatedAt
    );
  }
}
