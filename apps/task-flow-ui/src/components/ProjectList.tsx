import { useMemo } from 'react';
import { ProjectListViewModel } from '../view-models/ProjectListViewModel';
import { useObservable } from '../hooks/useObservable';
import { ProjectCard } from './ProjectCard';
import { formatProjectStatus } from '../domain/values/projectStatus';
import styles from './ProjectList.module.css';

interface Props {
  viewModel?: ProjectListViewModel;
}

export function ProjectList({ viewModel }: Props) {
  const vm = useMemo(() => viewModel ?? new ProjectListViewModel(), [viewModel]);
  const projects = useObservable(vm.filteredProjects$, []);
  const allProjects = useObservable(vm.projects$, []);
  const isLoading = useObservable(vm.isLoading$, false);
  const errorMessage = useObservable(vm.errorMessage$, null);
  const detailOpen = useObservable(vm.isDetailPanelOpen$, false);
  const selectedProjectId = useObservable(vm.selectedProject$, undefined);
  const selectedProject = useMemo(
    () => (selectedProjectId ? allProjects.find((project) => project.id === selectedProjectId) ?? null : null),
    [allProjects, selectedProjectId]
  );

  const searchTerm = vm.searchTerm;

  const handleViewDetails = (projectId: string) => {
    if (selectedProjectId === projectId && detailOpen) {
      vm.toggleDetailPanel();
      return;
    }
    vm.selectProject(projectId);
    if (!detailOpen) {
      vm.toggleDetailPanel();
    }
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Project Explorer</h2>
          <p className={styles.subtitle}>Live task management powered by the TaskFlow API.</p>
        </div>
        <div className={styles.controls}>
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search projects…"
            value={searchTerm}
            onChange={(event) => vm.setSearchTerm(event.target.value)}
            className={styles.searchInput}
          />
          <button type="button" onClick={() => vm.refresh()} className={styles.button}>
            Refresh
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className={styles.error}>
          <p>{errorMessage}</p>
          <button type="button" onClick={() => vm.refresh()} className={styles.button}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <p className={styles.empty}>Loading projects…</p>
      ) : (
        <div className={styles.grid}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onCycleStatus={(id) => vm.cycleProjectStatus(id)}
              onViewDetails={(id) => handleViewDetails(id)}
            />
          ))}
          {!projects.length && !errorMessage && (
            <p className={styles.empty}>No projects match your search term.</p>
          )}
        </div>
      )}

      {detailOpen && selectedProject && (
        <aside className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <h3 className={styles.detailTitle}>{selectedProject.name}</h3>
            <button type="button" onClick={() => vm.toggleDetailPanel()} className={styles.button}>
              Close
            </button>
          </div>
          <p>{selectedProject.description}</p>
          <p>
            {selectedProject.completedCount} / {selectedProject.tasksCount} tasks complete
          </p>
          <div>
            <span>Status: {formatProjectStatus(selectedProject.status)}</span>
            <span>Color: {selectedProject.color}</span>
          </div>
        </aside>
      )}
    </section>
  );
}
