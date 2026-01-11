import '@repo/shared/styles';
import './App.css';

import { useEffect, useMemo, useState } from 'react';
import { PluginRegistry } from '@repo/plugin-core';
import { createRouter, type RouteDefinition, type RouteMatch } from '@web-loom/router-core';
import { ProjectList } from './components/ProjectList';
import { TaskBoard } from './components/TaskBoard';
import { PluginSpotlight } from './components/PluginSpotlight';

const routes: RouteDefinition[] = [
  { path: '/', name: 'home', meta: { view: 'projects' as const } },
  { path: '/projects', name: 'projects', meta: { view: 'projects' as const } },
  { path: '/tasks', name: 'tasks', meta: { view: 'tasks' as const } },
  {
    path: '/:pathMatch(.*)',
    name: 'not-found',
    matchStrategy: 'prefix',
    meta: { view: 'not-found' as const }
  }
];

type AppView = 'projects' | 'tasks' | 'not-found';

const router = createRouter({
  mode: 'history',
  base: '/',
  routes
});

const navItems: { label: string; path: string; view: AppView }[] = [
  { label: 'Projects', path: '/projects', view: 'projects' },
  { label: 'Task board', path: '/tasks', view: 'tasks' }
];

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
        )
      }
    ],
    menuItems: [
      {
        label: 'Kanban view',
        path: '/kanban'
      }
    ]
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
        )
      }
    ]
  });

  return registry;
};

function App() {
  const [route, setRoute] = useState<RouteMatch>(router.currentRoute);
  const registry = useMemo(registerPlugins, []);
  const pluginDefinitions = useMemo(() => Array.from(registry.plugins.values()), [registry]);
  const currentView = (route.meta.view as AppView) ?? 'projects';

  useEffect(() => {
    const unsubscribe = router.subscribe((next) => setRoute(next));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = router.onError((error) => {
      console.error('Router error', error);
    });
    return unsubscribe;
  }, []);

  const navigateTo = (path: string) => {
    router.push(path).catch((error) => {
      console.error('Navigation failed', error);
    });
  };

  return (
    <div className="taskflow-shell">
      <header className="hero">
        <div>
          <p className="hero__eyebrow">Web Loom · MVVM Demo</p>
          <h1>TaskFlow · Project Management</h1>
          <p>
            Real-time inspired experience built on Web Loom ViewModels, plugin registry, reactive state,
            and lightweight routing.
          </p>
        </div>
        <button className="hero__cta" type="button" onClick={() => navigateTo('/tasks')}>
          Open Task Board
        </button>
      </header>

      <nav className="taskflow-nav" aria-label="TaskFlow navigation">
        {navItems.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`taskflow-nav__button ${currentView === item.view ? 'is-active' : ''}`}
            onClick={() => navigateTo(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="taskflow-main">
        {currentView === 'projects' && <ProjectList />}
        {currentView === 'tasks' && <TaskBoard />}
        {currentView === 'not-found' && (
          <section className="panel">
            <div className="panel__header">
              <h2>Page not found</h2>
            </div>
            <p className="panel__empty">No matching route for {route.fullPath}.</p>
            <button type="button" onClick={() => navigateTo('/projects')}>
              Return home
            </button>
          </section>
        )}
      </main>

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
