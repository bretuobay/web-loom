import { useState, memo, type ChangeEvent, type FormEvent } from 'react';
import { authViewModel } from '@repo/view-models/AuthViewModel';
import { useAuth } from '../providers/AuthProvider';

type AuthMode = 'signin' | 'signup';

const initialFormState = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
};

export const AuthGate = memo(function AuthGate() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [formState, setFormState] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isLoading } = useAuth();

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
    setFormState(initialFormState);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    try {
      if (mode === 'signin') {
        await authViewModel.signInCommand.execute({
          email: formState.email.trim(),
          password: formState.password,
        });
        return;
      }

      await authViewModel.signUpCommand.execute({
        email: formState.email.trim(),
        password: formState.password,
        firstName: formState.firstName.trim() || undefined,
        lastName: formState.lastName.trim() || undefined,
      });
    } catch (error) {
      let message = 'Unable to authenticate. Please try again.';
      if (error instanceof Error && error.message) {
        message = error.message;
      }
      setErrorMessage(message);
    }
  };

  const isSignUp = mode === 'signup';

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <header className="auth-panel-header">
          <h1>{isSignUp ? 'Create your AgroSense account' : 'Welcome back'}</h1>
          <p>
            {isSignUp
              ? 'Sign up to start tracking sensors, greenhouses, and alerts.'
              : 'Sign in to monitor the greenhouse environment dashboard.'}
          </p>
        </header>

        <div className="auth-panel-tabs">
          <button
            type="button"
            className={`auth-panel-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => handleModeChange('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-panel-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => handleModeChange('signup')}
          >
            Sign up
          </button>
        </div>

        {errorMessage && <p className="auth-panel-error">{errorMessage}</p>}

        <form className="auth-panel-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="username"
            value={formState.email}
            onChange={handleChange}
            required
          />

          {isSignUp && (
            <>
              <label htmlFor="auth-first-name">First name</label>
              <input
                id="auth-first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={formState.firstName}
                onChange={handleChange}
              />

              <label htmlFor="auth-last-name">Last name</label>
              <input
                id="auth-last-name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={formState.lastName}
                onChange={handleChange}
              />
            </>
          )}

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={formState.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="button" disabled={isLoading}>
            {isSignUp ? 'Create account' : 'Sign in'}
          </button>
          {isLoading && <p className="auth-panel-status">Processing...</p>}
        </form>
      </div>
    </div>
  );
});
