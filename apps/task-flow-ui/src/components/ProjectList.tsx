import { useMemo } from 'react';
import { ProjectListViewModel } from '../view-models/ProjectListViewModel';
import { useObservable } from '../hooks/useObservable';
import { ProjectCard } from './ProjectCard';
import { SkeletonList } from './Skeleton';
import { formatProjectStatus } from '../domain/values/projectStatus';
import { ProjectDetailPanel } from './ProjectDetailPanel';
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
  const projectTasks = useObservable(vm.projectTasks$, []);
  const isTaskFormOpen = useObservable(vm.isTaskFormOpen$, false);

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
        <div className={styles.grid}>
          <SkeletonList type="project" count={3} />
        </div>
      ) : (
        <div className={`${styles.grid} stagger-container`}>
          {projects.map((project) => (
            <div key={project.id} className="stagger-item">
              <ProjectCard
                project={project}
                onCycleStatus={(id) => {
                  void vm.cycleProjectStatus(id);
                }}
                onViewDetails={(id) => handleViewDetails(id)}
              />
            </div>
          ))}
          {!projects.length && !errorMessage && (
            <p className={`${styles.empty} animate-fadeIn`}>No projects match your search term.</p>
          )}
        </div>
      )}

      {detailOpen && selectedProject && (
        <>
          <div
            className={`${styles.detailOverlay} animate-fadeIn`}
            onClick={() => vm.toggleDetailPanel()}
            aria-hidden="true"
          />
          <aside className={`${styles.detailPanel} animate-slideInFromRight`}>
            <ProjectDetailPanel
              project={selectedProject}
              tasks={projectTasks}
              onClose={() => vm.toggleDetailPanel()}
              isTaskFormOpen={isTaskFormOpen}
              onToggleTaskForm={() => vm.toggleTaskForm()}
              onUploadAttachment={async (taskId, file) => {
                try {
                  await vm.uploadAttachment(taskId, file);
                } catch {
                  // Errors surface via the view model observable
                }
              }}
              onCreateTask={async (values) => {
                try {
                  await vm.createTaskForProject(selectedProject.id, values);
                  vm.toggleTaskForm();
                } catch {
                  // Errors surfaced via VM error observable
                }
              }}
            />
          </aside>
        </>
      )}
    </section>
  );
}
