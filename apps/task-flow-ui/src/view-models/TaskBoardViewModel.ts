import { BehaviorSubject, combineLatest } from 'rxjs';
import { createStore } from '@web-loom/store-core';
import type { TaskEntity } from '../domain/entities/task';
import type { TaskCreationPayload, TaskFormValues } from '../domain/entities/task';
import { TaskStore } from '../domain/stores/taskStore';
import { CachingProjectRepository } from '../domain/repositories/CachingProjectRepository';
import { CachingTaskRepository } from '../domain/repositories/CachingTaskRepository';
import type { ITaskRepository } from '../domain/repositories/interfaces';
import { ProjectStore } from '../domain/stores/projectStore';
import type { TaskStatus } from '../domain/values/taskStatus';

interface TaskBoardState {
  statusFilter: TaskStatus | null;
}

interface TaskBoardActions {
  setStatusFilter: (status: TaskStatus | null) => void;
  clearFilter: () => void;
}

const createTaskBoardStore = () =>
  createStore<TaskBoardState, TaskBoardActions>({ statusFilter: null }, (set) => ({
    setStatusFilter: (status) => set((state) => ({ ...state, statusFilter: status })),
    clearFilter: () => set((state) => ({ ...state, statusFilter: null })),
  }));

export class TaskBoardViewModel {
  private readonly repository: ITaskRepository;
  private readonly taskStore: TaskStore;
  private readonly store = createTaskBoardStore();
  private readonly filter$ = new BehaviorSubject<TaskStatus | null>(null);
  private readonly loading$ = new BehaviorSubject(true);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  public readonly isLoading$ = this.loading$.asObservable();
  public readonly errorMessage$ = this.error$.asObservable();
  public readonly tasks$ = new BehaviorSubject<TaskEntity[]>([]);
  public readonly filtered$ = new BehaviorSubject<TaskEntity[]>([]);
  private readonly projectStore = new ProjectStore(new CachingProjectRepository());
  private projectLoadPromise: Promise<void> | null = null;

  constructor(repository?: ITaskRepository) {
    this.repository = repository ?? new CachingTaskRepository();
    this.taskStore = new TaskStore(this.repository);
    this.store.subscribe((state) => {
      this.filter$.next(state.statusFilter);
    });
    combineLatest([this.taskStore.data$, this.filter$]).subscribe(([tasks, filter]) => {
      this.tasks$.next(tasks);
      const filtered = filter ? tasks.filter((task) => task.status === filter) : tasks;
      this.filtered$.next(filtered);
    });
    void this.projectStore.refresh();
    void this.refresh();
  }

  public async refresh() {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      await this.taskStore.refresh();
    } catch (error) {
      this.error$.next(error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      this.loading$.next(false);
    }
  }

  private async ensureProjectsLoaded() {
    if (this.projectStore.snapshot.length > 0) {
      return;
    }

    if (!this.projectLoadPromise) {
      this.projectLoadPromise = this.projectStore.refresh().finally(() => {
        this.projectLoadPromise = null;
      });
    }

    await this.projectLoadPromise;
  }

  public async createTask(values: TaskFormValues) {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      await this.ensureProjectsLoaded();
      const projectId = this.projectStore.snapshot[0]?.id;
      if (!projectId) {
        throw new Error('No project available to assign tasks to');
      }

      const payload: TaskCreationPayload = {
        ...values,
        projectId,
      };

      await this.taskStore.create(payload);
    } catch (error) {
      this.error$.next(error instanceof Error ? error.message : 'Failed to create task');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  public async uploadAttachment(taskId: string, file: File) {
    try {
      await this.taskStore.uploadAttachment(taskId, file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Attachment upload failed';
      this.error$.next(message);
      throw error;
    }
  }

  public async updateTask(taskId: string, values: TaskFormValues) {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      await this.taskStore.updateTask(taskId, values);
    } catch (error) {
      this.error$.next(error instanceof Error ? error.message : 'Failed to update task');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  public async deleteTask(taskId: string) {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      await this.taskStore.deleteTask(taskId);
    } catch (error) {
      this.error$.next(error instanceof Error ? error.message : 'Failed to delete task');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  public setStatusFilter(status: TaskStatus | null) {
    if (status) {
      this.store.actions.setStatusFilter(status);
    } else {
      this.store.actions.clearFilter();
    }
  }

  public get currentFilter() {
    return this.store.getState().statusFilter;
  }

  public findTask(id: string) {
    return this.taskStore.findById(id);
  }
}
