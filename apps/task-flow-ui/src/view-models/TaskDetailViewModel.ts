import { BehaviorSubject, combineLatest } from 'rxjs';
import { createStore } from '@web-loom/store-core';
import type { TaskEntity } from '../domain/entities/task';
import { TaskStore } from '../domain/stores/taskStore';
import { ApiTaskRepository } from '../domain/repositories/ApiTaskRepository';
import type { ITaskRepository } from '../domain/repositories/interfaces';

interface TaskDetailState {
  selectedTaskId?: string;
  isOpen: boolean;
  notes: string;
}

interface TaskDetailActions {
  openTask: (id: string) => void;
  closeTask: () => void;
  setNotes: (notes: string) => void;
}

const createTaskDetailStore = () =>
  createStore<TaskDetailState, TaskDetailActions>({ selectedTaskId: undefined, isOpen: false, notes: '' }, (set) => ({
    openTask: (id) => set((state) => ({ ...state, selectedTaskId: id, isOpen: true })),
    closeTask: () => set((state) => ({ ...state, selectedTaskId: undefined, isOpen: false })),
    setNotes: (notes) => set((state) => ({ ...state, notes })),
  }));

export class TaskDetailViewModel {
  private readonly taskStore: TaskStore;
  private readonly store = createTaskDetailStore();
  private readonly selectedTask$ = new BehaviorSubject<TaskEntity | null>(null);
  private readonly notes$ = new BehaviorSubject<string>('');
  private readonly isOpen$ = new BehaviorSubject(false);

  constructor(repository?: ITaskRepository) {
    this.taskStore = new TaskStore(repository ?? new ApiTaskRepository());
    this.store.subscribe((state) => {
      this.notes$.next(state.notes);
      this.isOpen$.next(state.isOpen);
      const task = state.selectedTaskId ? this.taskStore.findById(state.selectedTaskId) : null;
      this.selectedTask$.next(task);
    });
    combineLatest([this.taskStore.data$, this.selectedTask$]).subscribe(([tasks, task]) => {
      if (task) {
        const refreshed = tasks.find((item) => item.id === task.id);
        if (refreshed) {
          this.selectedTask$.next(refreshed);
        }
      }
    });
  }

  get task$() {
    return this.selectedTask$.asObservable();
  }

  get notes() {
    return this.notes$.asObservable();
  }

  get isOpen() {
    return this.isOpen$.asObservable();
  }

  public open(taskId: string) {
    this.store.actions.openTask(taskId);
  }

  public close() {
    this.store.actions.closeTask();
  }

  public setNotes(notes: string) {
    this.store.actions.setNotes(notes);
  }

  public refresh() {
    return this.taskStore.refresh();
  }

  public updateTask(taskId: string, updater: (task: TaskEntity) => TaskEntity) {
    return this.taskStore.update(taskId, updater);
  }
}
