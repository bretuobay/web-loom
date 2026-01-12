import type { ProjectEntity } from '../entities/project';
import type { TaskCreationPayload, TaskEntity } from '../entities/task';
import type { UserEntity } from '../entities/user';

export interface IProjectRepository {
  fetchAll(): Promise<ProjectEntity[]>;
  getById(id: string): Promise<ProjectEntity | null>;
}

export interface ITaskRepository {
  fetchAll(): Promise<TaskEntity[]>;
  getById(id: string): Promise<TaskEntity | null>;
  create(payload: TaskCreationPayload): Promise<TaskEntity>;
}

export interface IUserRepository {
  fetchAll(): Promise<UserEntity[]>;
  getById(id: string): Promise<UserEntity | null>;
}
