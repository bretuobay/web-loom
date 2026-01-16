import type { ProjectEntity, ProjectApiResponse, ProjectCreationPayload } from '../entities/project';
import type { TaskCreationPayload, TaskEntity } from '../entities/task';
import type { AttachmentEntity } from '../entities/attachment';
import type { UserEntity } from '../entities/user';
import { CommentEntity } from '../entities/comment';

export interface IProjectRepository {
  fetchAll(): Promise<ProjectEntity[]>;
  getById(id: string): Promise<ProjectEntity | null>;
  update(id: string, payload: Partial<ProjectApiResponse>): Promise<ProjectEntity>;
  create(payload: ProjectCreationPayload): Promise<ProjectEntity>;
}

export interface ITaskRepository {
  fetchAll(): Promise<TaskEntity[]>;
  getById(id: string): Promise<TaskEntity | null>;
  create(payload: TaskCreationPayload): Promise<TaskEntity>;
  uploadAttachment(taskId: string, file: File): Promise<AttachmentEntity>;
}

export interface ICommentRepository {
  fetchForTask(taskId: string): Promise<CommentEntity[]>;
  create(taskId: string, content: string): Promise<CommentEntity>;
}

export interface IUserRepository {
  fetchAll(): Promise<UserEntity[]>;
  getById(id: string): Promise<UserEntity | null>;
}
