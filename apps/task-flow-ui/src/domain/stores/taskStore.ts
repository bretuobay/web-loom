import { BehaviorSubject } from 'rxjs';
import { TaskEntity } from '../entities/task';
import type { TaskCreationPayload } from '../entities/task';
import { ApiTaskRepository } from '../repositories/ApiTaskRepository';
import type { ITaskRepository } from '../repositories/interfaces';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  tempId?: string;
}

export interface OptimisticCreateResult {
  success: boolean;
  task: TaskEntity | null;
  error?: Error;
}

export class TaskStore {
  private readonly _tasks$ = new BehaviorSubject<TaskEntity[]>([]);
  private readonly _pendingOperations$ = new BehaviorSubject<PendingOperation[]>([]);
  private readonly repository: ITaskRepository;

  constructor(repository: ITaskRepository = new ApiTaskRepository()) {
    this.repository = repository;
  }

  get data$() {
    return this._tasks$.asObservable();
  }

  get pendingOperations$() {
    return this._pendingOperations$.asObservable();
  }

  get snapshot(): TaskEntity[] {
    return this._tasks$.getValue();
  }

  async refresh() {
    const tasks = await this.repository.fetchAll();
    this._tasks$.next(tasks);
  }

  async create(payload: TaskCreationPayload) {
    const task = await this.repository.create(payload);
    this._tasks$.next([...this.snapshot, task]);
    return task;
  }

  /**
   * Creates a task with optimistic update - immediately shows in UI,
   * then confirms or rolls back based on server response.
   */
  async createOptimistic(payload: TaskCreationPayload): Promise<OptimisticCreateResult> {
    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create optimistic task entity
    const now = new Date();
    const optimisticTask = new TaskEntity(
      tempId,
      payload.title,
      payload.description ?? '',
      payload.status,
      payload.priority,
      payload.dueDate ? new Date(payload.dueDate) : null,
      payload.projectId,
      payload.assigneeId ?? null,
      null, // No assignee entity for optimistic task
      now,
      now
    );

    // Apply optimistic update immediately
    this._tasks$.next([...this.snapshot, optimisticTask]);

    // Track pending operation
    this._pendingOperations$.next([
      ...this._pendingOperations$.getValue(),
      { id: tempId, type: 'create', tempId }
    ]);

    try {
      // Make the actual API call
      const serverTask = await this.repository.create(payload);

      // Replace temp task with server response
      const currentTasks = this.snapshot;
      const updatedTasks = currentTasks.map((task) =>
        task.id === tempId ? serverTask : task
      );
      this._tasks$.next(updatedTasks);

      // Remove pending operation
      this._pendingOperations$.next(
        this._pendingOperations$.getValue().filter((op) => op.tempId !== tempId)
      );

      return { success: true, task: serverTask };
    } catch (error) {
      // Rollback on failure - remove the optimistic task
      this._tasks$.next(this.snapshot.filter((task) => task.id !== tempId));

      // Remove pending operation
      this._pendingOperations$.next(
        this._pendingOperations$.getValue().filter((op) => op.tempId !== tempId)
      );

      const err = error instanceof Error ? error : new Error('Failed to create task');
      return { success: false, task: null, error: err };
    }
  }

  findById(id: string) {
    return this.snapshot.find((task) => task.id === id) ?? null;
  }

  update(id: string, updater: (task: TaskEntity) => TaskEntity) {
    const updated = this.snapshot.map((task) => (task.id === id ? updater(task) : task));
    this._tasks$.next(updated);
    return updated.find((task) => task.id === id) ?? null;
  }

  /**
   * Check if a task has a pending operation (e.g., being created)
   */
  isPending(taskId: string): boolean {
    return this._pendingOperations$.getValue().some(
      (op) => op.id === taskId || op.tempId === taskId
    );
  }
}
