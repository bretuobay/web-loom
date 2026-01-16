import { useMemo } from 'react';
import { ProjectListViewModel } from '../view-models/ProjectListViewModel';
import { useObservable } from '../hooks/useObservable';
import { ProjectCard } from './ProjectCard';
import { SkeletonList } from './Skeleton';
import { formatProjectStatus } from '../domain/values/projectStatus';
import { ProjectDetailPanel } from './ProjectDetailPanel';
import { ProjectForm } from './ProjectForm';
import type { ProjectFormValues } from '../domain/entities/project';
import styles from './ProjectList.module.css';

interface Props {
  viewModel?: ProjectListViewModel;
}

export function ProjectList({ viewModel }: Props) {
  const vm = useMemo(() => viewModel ?? new ProjectListViewModel(), [viewModel]);
  const projects = useObservable(vm.filteredProjects$, []);
  const allProjects = useObservable(vm.projects$, []);
  const isLoading = useObservable(vm.isLoading$, false);
  const isProjectFormOpen = useObservable(vm.isProjectFormOpen$, false);
  const isCreatingProject = useObservable(vm.isProjectFormSubmitting$, false);
  const errorMessage = useObservable(vm.errorMessage$, null);
  const detailOpen = useObservable(vm.isDetailPanelOpen$, false);
  const selectedProjectId = useObservable(vm.selectedProject$, undefined);
  const selectedProject = useMemo(
    () => (selectedProjectId ? allProjects.find((project) => project.id === selectedProjectId) ?? null : null),
    [allProjects, selectedProjectId]
  );
  const projectTasks = useObservable(vm.projectTasks$, []);
  const isTaskFormOpen = useObservable(vm.isTaskFormOpen$, false);
  const projectFormError = useObservable(vm.projectFormError$, null);

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

  const handleCreateProject = async (values: ProjectFormValues) => {
    try {
      await vm.createProject(values);
    } catch {
      // Errors are surfaced via the view model observable
    }
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h2 className={styles.title}>Project Explorer</h2>
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
          <div className={styles.controlActions}>
            <button type="button" onClick={() => vm.refresh()} className={styles.button}>
              Refresh
            </button>
            <button
              type="button"
              onClick={() => vm.toggleProjectForm()}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              {isProjectFormOpen ? 'Hide project form' : 'New project'}
            </button>
          </div>
        </div>
      </header>

      {isProjectFormOpen && (
        <section className={styles.projectFormPanel}>
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => vm.toggleProjectForm()}
            isSubmitting={isCreatingProject}
          />
          {projectFormError && <p className={styles.formError}>{projectFormError}</p>}
        </section>
      )}

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
