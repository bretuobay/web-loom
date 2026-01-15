import { combineLatest, BehaviorSubject } from 'rxjs';
import { ProjectEntity } from '../domain/entities/project';
import { ProjectListViewModel } from './ProjectListViewModel';
import type { ProjectStatus } from '../domain/values/projectStatus';

export class ProjectDetailViewModel {
  private readonly project$ = new BehaviorSubject<ProjectEntity | null>(null);
  private readonly isOpen$ = new BehaviorSubject(false);
  private readonly listViewModel: ProjectListViewModel;

  constructor(listViewModel: ProjectListViewModel) {
    this.listViewModel = listViewModel;
    combineLatest([this.listViewModel.projects$, this.listViewModel.selectedProject$]).subscribe(
      ([projects, selectedId]) => {
        const project = projects.find((item) => item.id === selectedId) ?? null;
        this.project$.next(project);
      }
    );
    this.listViewModel.isDetailPanelOpen$.subscribe((isOpen) => this.isOpen$.next(isOpen));
  }

  get details$() {
    return this.project$.asObservable();
  }

  get isOpenPanel$() {
    return this.isOpen$.asObservable();
  }

  public open(projectId: string) {
    this.listViewModel.selectProject(projectId);
    this.listViewModel.toggleDetailPanel();
  }

  public close() {
    this.listViewModel.toggleDetailPanel();
  }

  public updateStatus(status: ProjectStatus) {
    const project = this.project$.getValue();
    if (!project) {
      return;
    }
    this.listViewModel.updateProject(project.id, (existing) => existing.withStatus(status));
  }

  public refresh() {
    return this.listViewModel.refresh();
  }
}
