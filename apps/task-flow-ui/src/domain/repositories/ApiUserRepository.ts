import { UserEntity, type UserApiResponse } from '../entities/user';
import type { IUserRepository } from './interfaces';
import { taskFlowApiClient } from '../services/apiClient';

export class ApiUserRepository implements IUserRepository {
  private client: typeof taskFlowApiClient;

  constructor(client = taskFlowApiClient) {
    this.client = client;
  }

  async fetchAll() {
    const payload = await this.client.fetchUsers();
    return payload.map((user) => UserEntity.fromApi(user as UserApiResponse));
  }

  async getById(id: string) {
    const users = await this.fetchAll();
    return users.find((user) => user.id === id) ?? null;
  }
}
