import { UserEntity, UserApiResponse } from '../entities/user';
import { IUserRepository } from './interfaces';
import { TaskFlowApiClient } from '../services/apiClient';

export class ApiUserRepository implements IUserRepository {
  constructor(private client = new TaskFlowApiClient()) {}

  async fetchAll() {
    const payload = await this.client.fetchUsers();
    return payload.map((user) => UserEntity.fromApi(user as UserApiResponse));
  }

  async getById(id: string) {
    const users = await this.fetchAll();
    return users.find((user) => user.id === id) ?? null;
  }
}
