import { BehaviorSubject, type Observable } from 'rxjs';
import type { IProjectRepository } from '../repositories/interfaces';
import { ProjectEntity } from '../entities/project';

export class ProjectStore {
  private readonly _projects$ = new BehaviorSubject<ProjectEntity[]>([]);
  private readonly repository: IProjectRepository;

  constructor(repository: IProjectRepository) {
    this.repository = repository;
  }

  get data$(): Observable<ProjectEntity[]> {
    return this._projects$.asObservable();
  }

  get snapshot(): ProjectEntity[] {
    return this._projects$.getValue();
  }

  async refresh() {
    const projects = await this.repository.fetchAll();
    this._projects$.next(projects);
  }

  mutate(projectId: string, updater: (project: ProjectEntity) => ProjectEntity) {
    const updated = this.snapshot.map((project) => (project.id === projectId ? updater(project) : project));
    this._projects$.next(updated);
  }

  append(project: ProjectEntity) {
    this._projects$.next([...this.snapshot, project]);
  }

  remove(projectId: string) {
    this._projects$.next(this.snapshot.filter((project) => project.id !== projectId));
  }
}
