import { BehaviorSubject } from 'rxjs';
import { TaskEntity } from '../entities/task';
import type { TaskCreationPayload } from '../entities/task';
import { ApiTaskRepository } from '../repositories/ApiTaskRepository';
import type { ITaskRepository } from '../repositories/interfaces';

export class TaskStore {
  private readonly _tasks$ = new BehaviorSubject<TaskEntity[]>([]);

  constructor(private readonly repository: ITaskRepository = new ApiTaskRepository()) {}

  get data$() {
    return this._tasks$.asObservable();
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

  findById(id: string) {
    return this.snapshot.find((task) => task.id === id) ?? null;
  }

  update(id: string, updater: (task: TaskEntity) => TaskEntity) {
    const updated = this.snapshot.map((task) => (task.id === id ? updater(task) : task));
    this._tasks$.next(updated);
    return updated.find((task) => task.id === id) ?? null;
  }
}
