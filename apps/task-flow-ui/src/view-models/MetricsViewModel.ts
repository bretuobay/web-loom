import { BehaviorSubject } from 'rxjs';
import { CachingTaskRepository } from '../domain/repositories/CachingTaskRepository';
import { TaskStore } from '../domain/stores/taskStore';
import { TaskEntity } from '../domain/entities/task';
import {
  TASK_STATUSES,
  type TaskStatus,
  formatTaskStatus
} from '../domain/values/taskStatus';

export interface MetricsSnapshot {
  totalTasks: number;
  completionRate: number;
  overdueTasks: number;
  focusInsight: string;
  nextDueTask: { title: string; dueDate: string } | null;
  statusBreakdown: Record<TaskStatus, number>;
  lastUpdated: string | null;
}

const createEmptyBreakdown = (): Record<TaskStatus, number> =>
  TASK_STATUSES.reduce<Record<TaskStatus, number>>((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<TaskStatus, number>);

export const initialMetricsSnapshot: MetricsSnapshot = {
  totalTasks: 0,
  completionRate: 0,
  overdueTasks: 0,
  focusInsight: 'Waiting for data…',
  nextDueTask: null,
  statusBreakdown: createEmptyBreakdown(),
  lastUpdated: null
};

export class MetricsViewModel {
  private readonly taskStore: TaskStore;
  private readonly metricsSubject = new BehaviorSubject<MetricsSnapshot>(initialMetricsSnapshot);
  private readonly loading$ = new BehaviorSubject(false);

  public readonly metrics$ = this.metricsSubject.asObservable();
  public readonly isLoading$ = this.loading$.asObservable();

  constructor(repository?: ConstructorParameters<typeof TaskStore>[0]) {
    this.taskStore = new TaskStore(repository ?? new CachingTaskRepository());
    this.taskStore.data$.subscribe((tasks) => {
      this.metricsSubject.next(this.buildSnapshot(tasks));
    });
    void this.refresh();
  }

  public async refresh() {
    if (this.loading$.getValue()) {
      return;
    }

    this.loading$.next(true);
    try {
      await this.taskStore.refresh();
    } finally {
      this.loading$.next(false);
    }
  }

  private buildSnapshot(tasks: TaskEntity[]): MetricsSnapshot {
    const now = new Date();
    const breakdown = createEmptyBreakdown();
    tasks.forEach((task) => {
      breakdown[task.status] = (breakdown[task.status] ?? 0) + 1;
    });

    const total = tasks.length;
    const completedTotal = breakdown.done ?? 0;
    const busiestStatus = TASK_STATUSES.reduce<TaskStatus>(
      (winner, current) => (breakdown[current] > breakdown[winner] ? current : winner),
      TASK_STATUSES[0]
    );
    const nextDueTaskEntity = tasks
      .filter((task) => task.dueDate)
      .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))[0] ?? null;

    const completionRate = total === 0 ? 0 : Math.round((completedTotal / total) * 100);
    const overdueTasks = tasks.filter(
      (task) => task.dueDate && task.dueDate < now && task.status !== 'done'
    ).length;

    return {
      totalTasks: total,
      completionRate,
      overdueTasks,
      focusInsight: `${formatTaskStatus(busiestStatus)} needs attention`,
      nextDueTask:
        nextDueTaskEntity && nextDueTaskEntity.dueDate
          ? {
              title: nextDueTaskEntity.title,
              dueDate: nextDueTaskEntity.dueDate.toLocaleDateString()
            }
          : null,
      statusBreakdown: breakdown,
      lastUpdated: new Date().toLocaleTimeString()
    };
  }
}
