import type { ProjectSnapshot } from '../view-models/ProjectBoardViewModel';

interface Props {
  project: ProjectSnapshot;
  onCycleStatus: (id: string) => void;
}

const statusBadge = (status: ProjectSnapshot['status']) => {
  switch (status) {
    case 'Backlog':
      return 'badge--muted';
    case 'In Progress':
      return 'badge--accent';
    case 'Review':
      return 'badge--warning';
    case 'Done':
      return 'badge--success';
    default:
      return '';
  }
};

export function ProjectCard({ project, onCycleStatus }: Props) {
  const completion = project.tasks > 0 ? Math.min(100, Math.round((project.completed / project.tasks) * 100)) : 0;

  return (
    <article className="project-card" style={{ borderColor: project.color }}>
      <header className="project-card__header">
        <div>
          <h3>{project.name}</h3>
          <p className="project-card__description">{project.description}</p>
        </div>
        <span className={`project-card__status ${statusBadge(project.status)}`}>{project.status}</span>
      </header>
      <div className="project-card__progress">
        <div className="project-card__progress-bar" style={{ width: `${completion}%`, backgroundColor: project.color }} />
        <small>
          {project.completed} / {project.tasks} tasks • {completion}% complete
        </small>
      </div>
      <button className="project-card__action" type="button" onClick={() => onCycleStatus(project.id)}>
        Move to next phase
      </button>
    </article>
  );
}
