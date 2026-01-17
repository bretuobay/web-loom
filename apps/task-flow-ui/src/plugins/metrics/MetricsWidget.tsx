import { useMemo } from 'react';
import { TASK_STATUSES, formatTaskStatus } from '../../domain/values/taskStatus';
import { useObservable } from '../../hooks/useObservable';
import { MetricsViewModel, initialMetricsSnapshot } from '../../view-models/MetricsViewModel';

export function MetricsWidget() {
  const viewModel = useMemo(() => new MetricsViewModel(), []);
  const metrics = useObservable(viewModel.metrics$, initialMetricsSnapshot);
  const isLoading = useObservable(viewModel.isLoading$, false);

  return (
    <section className="metrics-widget">
      <header className="metrics-widget__header">
        <div>
          <p className="metrics-widget__meta">Metrics plugin</p>
          <h3>Flow health</h3>
        </div>
        <span className="metrics-widget__status">{isLoading ? 'Syncing…' : 'Synced'}</span>
      </header>

      <p className="metrics-widget__insight">{metrics.focusInsight}</p>

      <div className="metrics-widget__stats">
        <article>
          <span>{metrics.totalTasks}</span>
          <p>Total tasks</p>
        </article>
        <article>
          <span>{metrics.completionRate}%</span>
          <p>Completion rate</p>
        </article>
        <article>
          <span>{metrics.overdueTasks}</span>
          <p>Overdue</p>
        </article>
      </div>

      <div className="metrics-widget__breakdown">
        {TASK_STATUSES.map((status) => (
          <div key={status} className="metrics-widget__breakdown-row">
            <span>{formatTaskStatus(status)}</span>
            <strong>{metrics.statusBreakdown[status] ?? 0}</strong>
          </div>
        ))}
      </div>

      <div className="metrics-widget__next-due">
        <p>
          <strong>Next due:</strong>{' '}
          {metrics.nextDueTask ? `${metrics.nextDueTask.title} (${metrics.nextDueTask.dueDate})` : 'No due items'}
        </p>
        <time>Last refreshed: {metrics.lastUpdated ?? '—'}</time>
      </div>
    </section>
  );
}
