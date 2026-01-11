import { ProjectEntity } from '../entities/project';
import { ProjectApiResponse } from '../entities/project';
import { IProjectRepository } from './interfaces';
import { TaskFlowApiClient } from '../services/apiClient';

export class ApiProjectRepository implements IProjectRepository {
  constructor(private client = new TaskFlowApiClient()) {}

  async fetchAll() {
    const payload = await this.client.fetchProjects();
    return payload.map((project) =>
      ProjectEntity.fromApi(project as ProjectApiResponse)
    );
  }

  async getById(id: string) {
    const projects = await this.fetchAll();
    return projects.find((project) => project.id === id) ?? null;
  }
}
