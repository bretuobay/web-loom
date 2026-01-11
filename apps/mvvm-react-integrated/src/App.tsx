import './App.css';
import './styles/Dashboard.css';
import './styles/Layout.css';
import './styles/Pages.css';

import { useEffect, memo, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { GreenhouseList } from './components/GreenhouseList';
import { SensorList } from './components/SensorList';
import { SensorReadingList } from './components/SensorReadingList';
import { ThresholdAlertList } from './components/ThresholdAlertList';
import { Settings } from './pages/Settings';
import { Header } from './layout/Header';
import Container from './layout/Container';
import Footer from './layout/Footer';
import { AppProvider } from './providers/AppProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { AuthGate } from './components/AuthGate';
import { authViewModel } from '@repo/view-models/AuthViewModel';

const AuthRoute = memo(function AuthRoute() {
  const { isAuthenticated } = useAuth();

  // Don't render AuthGate if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="auth-layout">
      <AuthGate />
    </main>
  );
});

const ProtectedLayout = memo(function ProtectedLayout() {
  return (
    <>
      <Header />
      <Container>
        <Outlet />
      </Container>
      <Footer />
    </>
  );
});

const RequireAuth = memo(function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
});

const NotFoundRedirect = memo(function NotFoundRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/auth'} replace />;
});

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
        <AuthProvider>
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
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFoundRedirect />} />
              </Routes>
            </BrowserRouter>
          </div>
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
