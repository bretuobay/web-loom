import { ProjectEntity } from '../domain/entities/project';
import { type ProjectStatus, formatProjectStatus } from '../domain/values/projectStatus';

interface Props {
  project: ProjectEntity;
  onCycleStatus: (id: string) => void;
  onViewDetails?: (projectId: string) => void;
}

const statusBadge = (status: ProjectStatus) => {
  switch (status) {
    case 'planning':
      return 'badge--muted';
    case 'active':
      return 'badge--accent';
    case 'paused':
      return 'badge--warning';
    case 'completed':
      return 'badge--success';
    default:
      return '';
  }
};

export function ProjectCard({ project, onCycleStatus, onViewDetails }: Props) {
  const completion =
    project.tasksCount > 0 ? Math.min(100, Math.round((project.completedCount / project.tasksCount) * 100)) : 0;

  return (
    <article className="project-card" style={{ borderColor: project.color }}>
      <header className="project-card__header">
        <div>
          <h3>{project.name}</h3>
          <p className="project-card__description">{project.description}</p>
        </div>
        <span className={`project-card__status ${statusBadge(project.status)}`}>
          {formatProjectStatus(project.status)}
        </span>
      </header>
      <div className="project-card__progress">
        <div
          className="project-card__progress-bar"
          style={{ width: `${completion}%`, backgroundColor: project.color }}
        />
        <small>
          {project.completedCount} / {project.tasksCount} tasks • {completion}% complete
        </small>
      </div>
      <div className="project-card__footer">
        <button className="project-card__action" type="button" onClick={() => onCycleStatus(project.id)}>
          Move to next phase
        </button>
        {onViewDetails && (
          <button className="project-card__details" type="button" onClick={() => onViewDetails(project.id)}>
            View details
          </button>
        )}
      </div>
    </article>
  );
}
