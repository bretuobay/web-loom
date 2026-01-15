import { TaskEntity } from '../entities/task';
import type { TaskCreationPayload, TaskApiResponse } from '../entities/task';
import { AttachmentEntity } from '../entities/attachment';
import { taskFlowApiClient } from '../services/apiClient';
import type { ITaskRepository } from './interfaces';

export class ApiTaskRepository implements ITaskRepository {
  private client;

  constructor(client = taskFlowApiClient) {
    this.client = client;
  }

  async fetchAll() {
    const payload = await this.client.fetchTasks();
    return payload.map((task) => TaskEntity.fromApi(task as TaskApiResponse));
  }

  async getById(id: string) {
    const tasks = await this.fetchAll();
    return tasks.find((task) => task.id === id) ?? null;
  }

  async create(payload: TaskCreationPayload) {
    const response = await this.client.createTask(payload);
    return TaskEntity.fromApi(response);
  }

  async uploadAttachment(taskId: string, file: File) {
    const response = await this.client.uploadTaskAttachment(taskId, file);
    return AttachmentEntity.fromApi(response);
  }
}
