import { ProjectEntity } from '../entities/project';
import type { ProjectApiResponse, ProjectCreationPayload } from '../entities/project';
import type { IProjectRepository } from './interfaces';
import { taskFlowApiClient } from '../services/apiClient';

export class ApiProjectRepository implements IProjectRepository {
  private client: typeof taskFlowApiClient;

  constructor(client = taskFlowApiClient) {
    this.client = client;
  }

  async fetchAll() {
    const payload = await this.client.fetchProjects();
    return payload.map((project) => ProjectEntity.fromApi(project as ProjectApiResponse));
  }

  async getById(id: string) {
    const projects = await this.fetchAll();
    return projects.find((project) => project.id === id) ?? null;
  }

  async update(id: string, payload: Partial<ProjectApiResponse>) {
    const project = await this.client.updateProject(id, payload);
    return ProjectEntity.fromApi(project);
  }

  async create(payload: ProjectCreationPayload) {
    const project = await this.client.createProject(payload);
    return ProjectEntity.fromApi(project);
  }
}
