import { combineLatest, BehaviorSubject } from 'rxjs';
import { createStore } from '@web-loom/store-core';
import type { IProjectRepository, ITaskRepository } from '../domain/repositories/interfaces';
import { CachingProjectRepository } from '../domain/repositories/CachingProjectRepository';
import { CachingTaskRepository } from '../domain/repositories/CachingTaskRepository';
import { ProjectStore } from '../domain/stores/projectStore';
import { TaskStore } from '../domain/stores/taskStore';
import { ProjectEntity } from '../domain/entities/project';
import { TaskEntity } from '../domain/entities/task';
import { PROJECT_STATUSES, type ProjectStatus } from '../domain/values/projectStatus';

interface ProjectListState {
  selectedProjectId?: string;
  isDetailOpen: boolean;
  searchTerm: string;
}

interface ProjectListActions {
  selectProject: (id?: string) => void;
  toggleDetail: () => void;
  setSearchTerm: (term: string) => void;
}

export class ProjectListViewModel {
  private readonly projectStore: ProjectStore;
  private readonly uiStore = createStore<ProjectListState, ProjectListActions>(
    { selectedProjectId: undefined, isDetailOpen: false, searchTerm: '' },
    (set) => ({
      selectProject: (id) => set((state) => ({ ...state, selectedProjectId: id })),
      toggleDetail: () => set((state) => ({ ...state, isDetailOpen: !state.isDetailOpen })),
      setSearchTerm: (term) => set((state) => ({ ...state, searchTerm: term }))
    })
  );
  private readonly selectedProjectId$ = new BehaviorSubject<string | undefined>(undefined);
  private readonly isDetailOpen$ = new BehaviorSubject(false);
  private readonly searchTerm$ = new BehaviorSubject('');
  private readonly loading$ = new BehaviorSubject(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  private readonly taskStore: TaskStore;
  private readonly projectTasksSubject = new BehaviorSubject<TaskEntity[]>([]);
  public readonly filteredProjects$ = new BehaviorSubject<ProjectEntity[]>([]);
  public readonly isLoading$ = this.loading$.asObservable();
  public readonly errorMessage$ = this.error$.asObservable();
  private readonly statusSequence: readonly ProjectStatus[] = PROJECT_STATUSES;

  constructor(
    repository: IProjectRepository = new CachingProjectRepository(),
    taskRepository: ITaskRepository = new CachingTaskRepository()
  ) {
    this.projectStore = new ProjectStore(repository);
    this.taskStore = new TaskStore(taskRepository);
    this.uiStore.subscribe((state) => {
      this.selectedProjectId$.next(state.selectedProjectId);
      this.isDetailOpen$.next(state.isDetailOpen);
      this.searchTerm$.next(state.searchTerm);
    });
    combineLatest([this.taskStore.data$, this.selectedProjectId$]).subscribe(([tasks, projectId]) => {
      if (!projectId) {
        this.projectTasksSubject.next([]);
        return;
      }
      this.projectTasksSubject.next(tasks.filter((task) => task.projectId === projectId));
    });
    combineLatest([this.projectStore.data$, this.searchTerm$]).subscribe(([projects, term]) => {
      const normalized = term.trim().toLowerCase();
      const filtered = normalized
        ? projects.filter(
            (project) =>
              project.name.toLowerCase().includes(normalized) ||
              project.description.toLowerCase().includes(normalized)
          )
        : projects;
      this.filteredProjects$.next(filtered);
    });
    void this.refresh();
    void this.taskStore.refresh();
  }

  get projects$() {
    return this.projectStore.data$;
  }

  get selectedProject$() {
    return this.selectedProjectId$.asObservable();
  }

  get isDetailPanelOpen$() {
    return this.isDetailOpen$.asObservable();
  }

  get searchTerm() {
    return this.uiStore.getState().searchTerm;
  }

  public selectProject(id: string) {
    this.uiStore.actions.selectProject(id);
  }

  public toggleDetailPanel() {
    this.uiStore.actions.toggleDetail();
  }

  public setSearchTerm(term: string) {
    this.uiStore.actions.setSearchTerm(term);
  }

  public async refresh() {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      await this.projectStore.refresh();
    } catch (error) {
      this.error$.next(error instanceof Error ? error.message : 'Failed to load projects');
    } finally {
      this.loading$.next(false);
    }
  }

  public get projectTasks$() {
    return this.projectTasksSubject.asObservable();
  }

  public async uploadAttachment(taskId: string, file: File) {
    this.error$.next(null);
    try {
      await this.taskStore.uploadAttachment(taskId, file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Attachment upload failed';
      this.error$.next(message);
      throw error;
    }
  }

  public updateProject(projectId: string, updater: (project: ProjectEntity) => ProjectEntity) {
    this.projectStore.mutate(projectId, updater);
  }

  public cycleProjectStatus(projectId: string) {
    const snapshot = this.projectStore.snapshot;
    const project = snapshot.find((item) => item.id === projectId);
    if (!project) {
      return;
    }
    const index = this.statusSequence.indexOf(project.status);
    if (index === -1) {
      return;
    }
    const nextStatus = this.statusSequence[(index + 1) % this.statusSequence.length];
    this.projectStore.mutate(projectId, (existing) => existing.withStatus(nextStatus));
  }
}
