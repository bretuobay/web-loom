import { ProjectEntity } from '../entities/project';
import { TaskEntity } from '../entities/task';
import { UserEntity } from '../entities/user';

export interface IProjectRepository {
  fetchAll(): Promise<ProjectEntity[]>;
  getById(id: string): Promise<ProjectEntity | null>;
}

export interface ITaskRepository {
  fetchAll(): Promise<TaskEntity[]>;
  getById(id: string): Promise<TaskEntity | null>;
}

export interface IUserRepository {
  fetchAll(): Promise<UserEntity[]>;
  getById(id: string): Promise<UserEntity | null>;
}
