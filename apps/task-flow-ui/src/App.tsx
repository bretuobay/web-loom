import '@repo/shared/styles';
import './App.css';

import { useMemo } from 'react';
import { PluginRegistry, type PluginDefinition } from '@repo/plugin-core';
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate
} from 'react-router-dom';
import { ProjectList } from './components/ProjectList';
import { TaskBoard } from './components/TaskBoard';
import { PluginSpotlight } from './components/PluginSpotlight';
import { AuthViewModel } from './view-models/AuthViewModel';
import { AuthPage } from './pages/AuthPage';
import { useObservable } from './hooks/useObservable';

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

function MainShell({
  authViewModel,
  pluginDefinitions
}: {
  authViewModel: AuthViewModel;
  pluginDefinitions: PluginDefinition[];
}) {
  const currentUser = useObservable(authViewModel.userObservable, null);
  const navigate = useNavigate();

  const handleLogout = () => {
    authViewModel.logout();
    navigate('/auth');
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
        <button className="hero__cta" type="button" onClick={() => navigate('/tasks')}>
          Open Task Board
        </button>
      </header>

      <nav className="taskflow-nav" aria-label="TaskFlow navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `taskflow-nav__button ${isActive ? 'is-active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <NavLink className="taskflow-nav__button" to="/auth">
          Sign in / register
        </NavLink>
      </nav>

      <div className="taskflow-auth-status">
        {currentUser ? (
          <>
            <span>
              Signed in as <strong>{currentUser.displayName}</strong> ({currentUser.email}) · role:{' '}
              {currentUser.role}
            </span>
            <button type="button" className="panel__button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <span className="taskflow-auth-status__muted">Not signed in</span>
        )}
      </div>

      <main className="taskflow-main">
        <Routes>
          <Route index element={<ProjectList />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="tasks" element={<TaskBoard />} />
          <Route path="*" element={<NotFoundPanel />} />
        </Routes>
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

function App() {
  const registry = useMemo(registerPlugins, []);
  const pluginDefinitions = useMemo(() => Array.from(registry.plugins.values()), [registry]);
  const authViewModel = useMemo(() => new AuthViewModel(), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage viewModel={authViewModel} />} />
        <Route
          path="/*"
          element={<MainShell authViewModel={authViewModel} pluginDefinitions={pluginDefinitions} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
