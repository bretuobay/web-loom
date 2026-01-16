import { combineLatest, BehaviorSubject } from 'rxjs';
import { createStore } from '@web-loom/store-core';
import type { IProjectRepository, ITaskRepository } from '../domain/repositories/interfaces';
import { CachingProjectRepository } from '../domain/repositories/CachingProjectRepository';
import { CachingTaskRepository } from '../domain/repositories/CachingTaskRepository';
import { ProjectStore } from '../domain/stores/projectStore';
import { TaskStore } from '../domain/stores/taskStore';
import { ProjectEntity, type ProjectFormValues } from '../domain/entities/project';
import { TaskEntity, type TaskFormValues } from '../domain/entities/task';
import { PROJECT_STATUSES, type ProjectStatus } from '../domain/values/projectStatus';

interface ProjectListState {
  selectedProjectId?: string;
  isDetailOpen: boolean;
  searchTerm: string;
  isTaskFormOpen: boolean;
  isProjectFormOpen: boolean;
}

interface ProjectListActions {
  selectProject: (id?: string) => void;
  toggleDetail: () => void;
  setSearchTerm: (term: string) => void;
  toggleTaskForm: () => void;
  setTaskFormOpen: (isOpen: boolean) => void;
  toggleProjectForm: () => void;
  setProjectFormOpen: (isOpen: boolean) => void;
}

export class ProjectListViewModel {
  private readonly projectStore: ProjectStore;
  private readonly uiStore = createStore<ProjectListState, ProjectListActions>(
    {
      selectedProjectId: undefined,
      isDetailOpen: false,
      searchTerm: '',
      isTaskFormOpen: false,
      isProjectFormOpen: false
    },
    (set) => ({
      selectProject: (id) => set((state) => ({ ...state, selectedProjectId: id })),
      toggleDetail: () => set((state) => ({ ...state, isDetailOpen: !state.isDetailOpen })),
      setSearchTerm: (term) => set((state) => ({ ...state, searchTerm: term })),
      toggleTaskForm: () => set((state) => ({ ...state, isTaskFormOpen: !state.isTaskFormOpen })),
      setTaskFormOpen: (isOpen) => set((state) => ({ ...state, isTaskFormOpen: isOpen })),
      toggleProjectForm: () => set((state) => ({ ...state, isProjectFormOpen: !state.isProjectFormOpen })),
      setProjectFormOpen: (isOpen) => set((state) => ({ ...state, isProjectFormOpen: isOpen }))
    })
  );
  private readonly selectedProjectId$ = new BehaviorSubject<string | undefined>(undefined);
  private readonly isDetailOpen$ = new BehaviorSubject(false);
  private readonly searchTerm$ = new BehaviorSubject('');
  private readonly loading$ = new BehaviorSubject(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  private readonly _isTaskFormOpen$ = new BehaviorSubject(false);
  private readonly projectFormOpen$ = new BehaviorSubject(false);
  private readonly projectFormLoading$ = new BehaviorSubject(false);
  private readonly _projectFormError$ = new BehaviorSubject<string | null>(null);
  private readonly projectFormMode$ = new BehaviorSubject<'create' | 'edit'>('create');
  private readonly editingProject$ = new BehaviorSubject<ProjectEntity | null>(null);
  private readonly taskStore: TaskStore;
  private readonly projectTasksSubject = new BehaviorSubject<TaskEntity[]>([]);
  public readonly filteredProjects$ = new BehaviorSubject<ProjectEntity[]>([]);
  public readonly isLoading$ = this.loading$.asObservable();
  public readonly errorMessage$ = this.error$.asObservable();
  public readonly isProjectFormOpen$ = this.projectFormOpen$.asObservable();
  public readonly isProjectFormSubmitting$ = this.projectFormLoading$.asObservable();
  public readonly projectFormError$ = this._projectFormError$.asObservable();
  public readonly projectFormModeObservable$ = this.projectFormMode$.asObservable();
  public readonly editingProjectObservable$ = this.editingProject$.asObservable();
  private readonly statusSequence: readonly ProjectStatus[] = PROJECT_STATUSES;
  private readonly repository: IProjectRepository;

  constructor(
    repository: IProjectRepository = new CachingProjectRepository(),
    taskRepository: ITaskRepository = new CachingTaskRepository()
  ) {
    this.repository = repository;
    this.projectStore = new ProjectStore(repository);
    this.taskStore = new TaskStore(taskRepository);
    this.uiStore.subscribe((state) => {
      this.selectedProjectId$.next(state.selectedProjectId);
      this.isDetailOpen$.next(state.isDetailOpen);
      this.searchTerm$.next(state.searchTerm);
      this._isTaskFormOpen$.next(state.isTaskFormOpen);
      this.projectFormOpen$.next(state.isProjectFormOpen);
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

  get isTaskFormOpen() {
    return this.uiStore.getState().isTaskFormOpen;
  }

  get isProjectFormOpen() {
    return this.uiStore.getState().isProjectFormOpen;
  }

  public selectProject(id: string) {
    this.uiStore.actions.selectProject(id);
    this.uiStore.actions.setTaskFormOpen(false);
  }

  public toggleDetailPanel() {
    this.uiStore.actions.toggleDetail();
  }

  public toggleTaskForm() {
    this.uiStore.actions.toggleTaskForm();
  }

  public toggleProjectForm() {
    if (this.isProjectFormOpen) {
      this.closeProjectForm();
      return;
    }
    this.openProjectFormForCreate();
  }

  public openProjectFormForCreate() {
    this.projectFormMode$.next('create');
    this.editingProject$.next(null);
    this._projectFormError$.next(null);
    this.uiStore.actions.setProjectFormOpen(true);
  }

  public openProjectFormForEdit(project: ProjectEntity) {
    this.projectFormMode$.next('edit');
    this.editingProject$.next(project);
    this._projectFormError$.next(null);
    this.uiStore.actions.setProjectFormOpen(true);
  }

  public closeProjectForm() {
    this.uiStore.actions.setProjectFormOpen(false);
    this.editingProject$.next(null);
    this.projectFormMode$.next('create');
    this._projectFormError$.next(null);
  }

  public get isTaskFormOpen$() {
    return this._isTaskFormOpen$.asObservable();
  }

  public async submitProjectForm(values: ProjectFormValues) {
    this._projectFormError$.next(null);
    this.projectFormLoading$.next(true);
    try {
      const description = values.description?.trim();
      const payload = {
        name: values.name.trim(),
        description: description && description.length > 0 ? description : undefined,
        color: values.color,
        status: values.status
      };

      if (this.projectFormMode$.getValue() === 'edit') {
        const editing = this.editingProject$.getValue();
        if (!editing) {
          throw new Error('No project selected for editing');
        }
        const updated = await this.repository.update(editing.id, payload);
        this.projectStore.mutate(editing.id, () => updated);
      } else {
        const created = await this.repository.create(payload);
        this.projectStore.append(created);
      }
      this.closeProjectForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save project';
      this._projectFormError$.next(message);
      throw error;
    } finally {
      this.projectFormLoading$.next(false);
    }
  }

  public async deleteProject(projectId: string) {
    this.error$.next(null);
    try {
      await this.repository.delete(projectId);
      this.projectStore.remove(projectId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      this.error$.next(message);
      throw error;
    }
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

  public async createTaskForProject(projectId: string, values: TaskFormValues) {
    this.error$.next(null);
    try {
      await this.taskStore.create({
        ...values,
        projectId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      this.error$.next(message);
      throw error;
    }
  }

  public updateProject(projectId: string, updater: (project: ProjectEntity) => ProjectEntity) {
    this.projectStore.mutate(projectId, updater);
  }

  public async cycleProjectStatus(projectId: string) {
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
    this.error$.next(null);

    try {
      const updated = await this.repository.update(projectId, { status: nextStatus });
      this.projectStore.mutate(projectId, () => updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update project status';
      this.error$.next(message);
      this.projectStore.mutate(projectId, () => project);
    }
  }
}
