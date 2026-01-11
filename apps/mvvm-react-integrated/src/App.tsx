import './App.css';
import './styles/Dashboard.css';
import './styles/Layout.css';
import './styles/Pages.css';

import { useEffect, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { GreenhouseList } from './components/GreenhouseList';
import { SensorList } from './components/SensorList';
import { SensorReadingList } from './components/SensorReadingList';
import { ThresholdAlertList } from './components/ThresholdAlertList';
import { Header } from './layout/Header';
import Container from './layout/Container';
import Footer from './layout/Footer';
import { AppProvider } from './providers/AppProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { AccountPanel } from './components/AccountPanel';
import { AuthGate } from './components/AuthGate';
import { authViewModel } from '@repo/view-models/AuthViewModel';
import { useObservable } from './hooks/useObservable';

function AuthRoute() {
  const isAuthenticated = useObservable(authViewModel.isAuthenticated$, false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="auth-layout">
      <AuthGate />
    </main>
  );
}

function ProtectedLayout() {
  return (
    <>
      <Header />
      <Container>
        <AccountPanel />
        <Outlet />
      </Container>
      <Footer />
    </>
  );
}

function RequireAuth({ children }: { children: ReactElement }) {
  const isAuthenticated = useObservable(authViewModel.isAuthenticated$, false);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function NotFoundRedirect() {
  const isAuthenticated = useObservable(authViewModel.isAuthenticated$, false);
  return <Navigate to={isAuthenticated ? '/dashboard' : '/auth'} replace />;
}

function App() {
  useEffect(() => {
    const storedToken = authViewModel.token;
    if (storedToken) {
      authViewModel.refreshSessionCommand.execute().catch(() => {});
    }
  }, []);

  return (
    <ThemeProvider>
      <AppProvider>
        <div className="app-layout">
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthRoute />} />
              <Route
                element={
                  <RequireAuth>
                    <ProtectedLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="greenhouses" element={<GreenhouseList />} />
                <Route path="sensors" element={<SensorList />} />
                <Route path="sensor-readings" element={<SensorReadingList />} />
                <Route path="threshold-alerts" element={<ThresholdAlertList />} />
              </Route>
              <Route path="*" element={<NotFoundRedirect />} />
            </Routes>
          </BrowserRouter>
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
