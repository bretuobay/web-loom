import { BehaviorSubject, combineLatest } from 'rxjs';
import { createStore } from '@web-loom/store-core';
import { TaskEntity } from '../domain/entities/task';
import { TaskStore } from '../domain/stores/taskStore';
import { ApiTaskRepository } from '../domain/repositories/ApiTaskRepository';
import { ITaskRepository } from '../domain/repositories/interfaces';
import { TaskStatus } from '../domain/values/taskStatus';

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
    clearFilter: () => set((state) => ({ ...state, statusFilter: null }))
  }));

export class TaskBoardViewModel {
  private readonly taskStore: TaskStore;
  private readonly store = createTaskBoardStore();
  private readonly filter$ = new BehaviorSubject<TaskStatus | null>(null);
  private readonly loading$ = new BehaviorSubject(true);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  public readonly isLoading$ = this.loading$.asObservable();
  public readonly errorMessage$ = this.error$.asObservable();
  public readonly tasks$ = new BehaviorSubject<TaskEntity[]>([]);
  public readonly filtered$ = new BehaviorSubject<TaskEntity[]>([]);

  constructor(repository?: ITaskRepository) {
    this.taskStore = new TaskStore(repository ?? new ApiTaskRepository());
    this.store.subscribe((state) => {
      this.filter$.next(state.statusFilter);
    });
    combineLatest([this.taskStore.data$, this.filter$]).subscribe(([tasks, filter]) => {
      this.tasks$.next(tasks);
      const filtered = filter ? tasks.filter((task) => task.status === filter) : tasks;
      this.filtered$.next(filtered);
    });
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
