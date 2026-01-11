import { useMemo } from 'react';
import { ProjectListViewModel } from '../view-models/ProjectListViewModel';
import { useObservable } from '../hooks/useObservable';
import { ProjectCard } from './ProjectCard';
import { formatProjectStatus } from '../domain/values/projectStatus';

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
    <section className="project-list">
      <header className="project-list__header">
        <div>
          <h2>Project Explorer</h2>
          <p className="project-list__subhead">Live task management powered by the TaskFlow API.</p>
        </div>
        <div className="project-list__controls">
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search projects…"
            value={searchTerm}
            onChange={(event) => vm.setSearchTerm(event.target.value)}
          />
          <button type="button" onClick={() => vm.refresh()}>
            Refresh
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="project-list__error">
          <p>{errorMessage}</p>
          <button type="button" onClick={() => vm.refresh()}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="panel__empty">Loading projects…</p>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onCycleStatus={(id) => vm.cycleProjectStatus(id)}
              onViewDetails={(id) => handleViewDetails(id)}
            />
          ))}
          {!projects.length && !errorMessage && (
            <p className="project-list__empty">No projects match your search term.</p>
          )}
        </div>
      )}

      {detailOpen && selectedProject && (
        <aside className="project-list__detail">
          <div className="project-list__detail-header">
            <h3>{selectedProject.name}</h3>
            <button type="button" onClick={() => vm.toggleDetailPanel()}>
              Close
            </button>
          </div>
          <p>{selectedProject.description}</p>
          <p className="project-list__detail-meta">
            {selectedProject.completedCount} / {selectedProject.tasksCount} tasks complete
          </p>
          <div className="project-list__detail-stats">
            <span>Status: {formatProjectStatus(selectedProject.status)}</span>
            <span>Color: {selectedProject.color}</span>
          </div>
        </aside>
      )}
    </section>
  );
}
