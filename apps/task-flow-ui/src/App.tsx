import '@repo/shared/styles';
import './App.css';

import { type ReactNode, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PluginRegistry, type PluginDefinition } from '@repo/plugin-core';
import { PluginSpotlight } from './components/PluginSpotlight';
import { ProjectList } from './components/ProjectList';
import { TaskBoard } from './components/TaskBoard';
import { AuthPage } from './pages/AuthPage';
import { AuthViewModel } from './view-models/AuthViewModel';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';
import { Container } from './layout/Container';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import { useObservable } from './hooks/useObservable';
import { CommandPalette } from './components/CommandPalette';
import { OfflineIndicator } from './components/OfflineIndicator';

const navItems = [
  { label: 'Projects', path: '/projects' },
  { label: 'Task board', path: '/tasks' }
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

function NotFoundPanel() {
  const navigate = useNavigate();
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Page not found</h2>
      </div>
      <p className="panel__empty">No matching route for this path.</p>
      <button type="button" onClick={() => navigate('/projects')}>
        Return home
      </button>
    </section>
  );
}

function HeroPanel({
  onTaskBoardClick,
  onProjectsClick
}: {
  onTaskBoardClick: () => void;
  onProjectsClick: () => void;
}) {
  return (
    <section className="taskflow-hero">
      <div className="taskflow-hero__content">
        <h2 className="sr-only">TaskFlow workspace</h2>
        <div className="taskflow-hero__actions">
          <button type="button" className="layout-header__cta" onClick={onTaskBoardClick}>
            Launch task board
          </button>
          <button type="button" className="taskflow-hero__secondary" onClick={onProjectsClick}>
            Review projects
          </button>
        </div>
      </div>
    </section>
  );
}

function RequireAuth({ viewModel, children }: { viewModel: AuthViewModel; children: ReactNode }) {
  const currentUser = useObservable(viewModel.userObservable, null);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function MainShell({
  authViewModel,
  pluginDefinitions
}: {
  authViewModel: AuthViewModel;
  pluginDefinitions: PluginDefinition[];
}) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const currentUser = useObservable(authViewModel.userObservable, null);

  const handleLogout = () => {
    authViewModel.logout();
    navigate('/auth');
  };

  return (
    <>
      <CommandPalette
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        isAuthenticated={!!currentUser}
      />
      <OfflineIndicator />
      <div className="taskflow-shell">
        <Header
          theme={theme}
          navItems={navItems}
          onTaskBoardClick={() => navigate('/tasks')}
          onToggleTheme={toggleTheme}
          currentUser={currentUser ? { displayName: currentUser.displayName, role: currentUser.role } : undefined}
          onLogout={handleLogout}
        />

      <HeroPanel
        onTaskBoardClick={() => navigate('/tasks')}
        onProjectsClick={() => navigate('/projects')}
      />

      <Container>
        <div className="taskflow-grid">
          <main className="taskflow-main">
            <Routes>
              <Route index element={<ProjectList />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="tasks" element={<TaskBoard />} />
              <Route path="*" element={<NotFoundPanel />} />
            </Routes>
          </main>
          <aside className="taskflow-aside">
            <section className="panel panel--plugins">
              <div className="panel__header">
                <h2>Plugin Registry</h2>
                <p className="panel__subhead">Activate widgets, nav hooks, and lightweight integrations.</p>
              </div>
              <div className="plugin-grid">
                {pluginDefinitions.map((plugin) => (
                  <PluginSpotlight key={plugin.manifest.id} plugin={plugin.manifest} />
                ))}
              </div>
            </section>
          </aside>
        </div>
      </Container>

      <Footer />
      </div>
    </>
  );
}

function App() {
  const registry = useMemo(registerPlugins, []);
  const pluginDefinitions = useMemo(() => Array.from(registry.plugins.values()), [registry]);
  const authViewModel = useMemo(() => new AuthViewModel(), []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/auth" element={<AuthPage viewModel={authViewModel} />} />
        <Route
          path="/*"
          element={
            <RequireAuth viewModel={authViewModel}>
              <MainShell authViewModel={authViewModel} pluginDefinitions={pluginDefinitions} />
            </RequireAuth>
          }
        />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
