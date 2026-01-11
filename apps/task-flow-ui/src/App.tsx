import '@repo/shared/styles';
import './App.css';

import { useMemo } from 'react';
import { PluginRegistry } from '@repo/plugin-core';
import { ProjectBoardViewModel } from './view-models/ProjectBoardViewModel';
import { useObservable } from './hooks/useObservable';
import { PluginSpotlight } from './components/PluginSpotlight';
import { ProjectCard } from './components/ProjectCard';
import { formatProjectStatus } from './domain/values/projectStatus';
import type { ProjectEntity } from './domain/entities/project';

const registerPlugins = () => {
  const registry = new PluginRegistry();

  registry.register({
    id: 'taskflow-kanban',
    name: 'Kanban Insights',
    version: '0.1.0',
    entry: '/plugins/kanban',
    description: 'Surface live kanban metrics inside the TaskFlow workspace.',
    widgets: [
      {
        id: 'kanban-cycle-time',
        title: 'Cycle-time Watch',
        component: () => (
          <div className="widget-pill">
            <span>5.2 days</span>
            <p>Average cycle time</p>
          </div>
        ),
      },
    ],
    menuItems: [
      {
        label: 'Kanban view',
        path: '/kanban',
      },
    ],
  });

  registry.register({
    id: 'taskflow-market',
    name: 'Plugin Marketplace',
    version: '0.2.0',
    entry: '/plugins/market',
    description: 'Catalog of lightweight Web Loom plugins ready for activation.',
    widgets: [
      {
        id: 'market-wave',
        title: 'New releases',
        component: () => (
          <div className="widget-pill">
            <span>3</span>
            <p>fresh plugins</p>
          </div>
        ),
      },
    ],
  });

  return registry;
};

function App() {
  const viewModel = useMemo(() => new ProjectBoardViewModel(), []);
  const projects = useObservable<ProjectEntity[]>(viewModel.data$, []);
  const isLoading = useObservable(viewModel.isLoading$, false);
  const registry = useMemo(registerPlugins, []);
  const pluginDefinitions = useMemo(() => Array.from(registry.plugins.values()), [registry]);
  const statusSummary = viewModel.getStatusSummary();

  return (
    <div className="taskflow-shell">
      <header className="hero">
        <div>
          <p className="hero__eyebrow">Web Loom · MVVM Demo</p>
          <h1>TaskFlow · Project Management</h1>
          <p>Real-time inspired experience built on Web Loom ViewModels, plugin registry, and reactive state.</p>
        </div>
        <button className="hero__cta" type="button" onClick={() => viewModel.addProject()}>
          Launch another sprint
        </button>
      </header>

      <section className="panel">
        <div className="panel__header">
          <h2>Project Explorer</h2>
          <button
            className="panel__button"
            type="button"
            onClick={() => viewModel.cycleProjectStatus(projects[0]?.id ?? '')}
          >
            Refresh phase
          </button>
        </div>
        <div className="status-badges">
          {statusSummary.map((status) => (
            <span key={status.status} className="status-badge">
              {formatProjectStatus(status.status)} · {status.count}
            </span>
          ))}
        </div>
        {isLoading ? (
          <p className="panel__empty">Loading projects…</p>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onCycleStatus={(id) => viewModel.cycleProjectStatus(id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="panel panel--plugins">
        <div className="panel__header">
          <h2>Plugin Registry</h2>
        </div>
        <div className="plugin-grid">
          {pluginDefinitions.map((plugin) => (
            <PluginSpotlight key={plugin.manifest.id} plugin={plugin.manifest} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
