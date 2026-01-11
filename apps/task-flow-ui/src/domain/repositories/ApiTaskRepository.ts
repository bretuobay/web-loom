import { TaskEntity, TaskApiResponse } from '../entities/task';
import { ITaskRepository } from './interfaces';
import { TaskFlowApiClient } from '../services/apiClient';

export class ApiTaskRepository implements ITaskRepository {
  constructor(private client = new TaskFlowApiClient()) {}

  async fetchAll() {
    const payload = await this.client.fetchTasks();
    return payload.map((task) => TaskEntity.fromApi(task as TaskApiResponse));
  }

  async getById(id: string) {
    const tasks = await this.fetchAll();
    return tasks.find((task) => task.id === id) ?? null;
  }
}
