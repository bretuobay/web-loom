import { AuthPanel } from '../components/AuthPanel';
import { AuthViewModel } from '../view-models/AuthViewModel';

export function AuthPage({ viewModel }: { viewModel: AuthViewModel }) {
  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <AuthPanel viewModel={viewModel} />
      </div>
    </div>
  );
}
