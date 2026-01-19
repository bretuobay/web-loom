import { useLocation, Navigate, type Location } from 'react-router-dom';
import { AuthPanel } from '../components/AuthPanel';
import type { AuthViewModel } from '../view-models/AuthViewModel';
import { useObservable } from '../hooks/useObservable';

type LocationState = {
  from?: Location;
};

export function AuthPage({ viewModel }: { viewModel: AuthViewModel }) {
  const location = useLocation();
  const currentUser = useObservable(viewModel.userObservable, null);

  if (currentUser) {
    const state = location.state as LocationState | undefined;
    const target = state?.from?.pathname ?? '/projects';
    return <Navigate to={target} replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <AuthPanel viewModel={viewModel} />
      </div>
    </div>
  );
}
