import { BehaviorSubject } from 'rxjs';
import { ProjectStore } from '../domain/stores/projectStore';
import { ApiProjectRepository } from '../domain/repositories/ApiProjectRepository';
import { ProjectEntity } from '../domain/entities/project';
import { PROJECT_STATUSES } from '../domain/values/projectStatus';
import { type IProjectRepository } from '../domain/repositories/interfaces';

export class ProjectBoardViewModel {
  private readonly statusSequence = PROJECT_STATUSES;
  private readonly store: ProjectStore;
  public readonly data$;
  public readonly isLoading$ = new BehaviorSubject(true);

  constructor(repository?: IProjectRepository) {
    this.store = new ProjectStore(repository ?? new ApiProjectRepository());
    this.data$ = this.store.data$;
    void this.loadProjects();
  }

  private async loadProjects() {
    this.isLoading$.next(true);
    try {
      await this.store.refresh();
    } finally {
      this.isLoading$.next(false);
    }
  }

  public async refresh() {
    await this.loadProjects();
  }

  public getStatusSummary() {
    return this.statusSequence.map((status) => ({
      status,
      count: this.store.snapshot.filter((project) => project.status === status).length,
    }));
  }

  public getProjects() {
    return this.store.snapshot;
  }

  public cycleProjectStatus(projectId: string) {
    const projects = this.store.snapshot;
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }
    const currentIndex = this.statusSequence.indexOf(project.status);
    const nextStatus = this.statusSequence[(currentIndex + 1) % this.statusSequence.length];
    this.store.mutate(projectId, (existing) => existing.withStatus(nextStatus));
  }

  public addProject() {
    const draft = ProjectEntity.createDraft();
    this.store.append(draft);
  }
}
