import { ProjectEntity } from '../domain/entities/project';
import { type ProjectStatus, formatProjectStatus } from '../domain/values/projectStatus';
import styles from './ProjectCard.module.css';

interface Props {
  project: ProjectEntity;
  onCycleStatus: (id: string) => void;
  onViewDetails?: (projectId: string) => void;
}

const statusBadge = (status: ProjectStatus) => {
  switch (status) {
    case 'planning':
      return styles.badgeMuted;
    case 'active':
      return styles.badgeAccent;
    case 'paused':
      return styles.badgeWarning;
    case 'completed':
      return styles.badgeSuccess;
    default:
      return '';
  }
};

export function ProjectCard({ project, onCycleStatus, onViewDetails }: Props) {
  const completion =
    project.tasksCount > 0 ? Math.min(100, Math.round((project.completedCount / project.tasksCount) * 100)) : 0;

  return (
    <article className={styles.card} style={{ borderLeftColor: project.color }}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>{project.name}</h3>
          <p className={styles.description}>{project.description}</p>
        </div>
        <span className={`${styles.status} ${statusBadge(project.status)}`}>
          {formatProjectStatus(project.status)}
        </span>
      </header>
      <div className={styles.progress}>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${completion}%`, backgroundColor: project.color }}
          />
        </div>
        <small className={styles.progressText}>
          {project.completedCount} / {project.tasksCount} tasks • {completion}% complete
        </small>
      </div>
      <div className={styles.footer}>
        <button className={styles.actionButton} type="button" onClick={() => onCycleStatus(project.id)}>
          Move to next phase
        </button>
        {onViewDetails && (
          <button className={styles.detailsButton} type="button" onClick={() => onViewDetails(project.id)}>
            View details
          </button>
        )}
      </div>
    </article>
  );
}
