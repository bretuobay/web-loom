import { useState, memo, type ChangeEvent, type FormEvent } from 'react';
import type { UserData } from '@repo/models';
import { authViewModel } from '@repo/view-models/AuthViewModel';
import { useObservable } from '../hooks/useObservable';
import { useAuth } from '../providers/AuthProvider';

export const AccountPanel = memo(function AccountPanel() {
  const user = useObservable<UserData | null>(authViewModel.user$, null);
  const { isLoading } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await authViewModel.changePasswordCommand.execute({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setStatusMessage('Password updated and session refreshed.');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
      let message = 'Unable to update password.';
      if (error instanceof Error && error.message) {
        message = error.message;
      }
      setErrorMessage(message);
    }
  };

  const displayName = user.firstName || user.email;

  return (
    <section className="account-panel">
      <div className="account-summary">
        <div>
          <p className="account-summary-label">Account Information</p>
          <h3 className="account-summary-name">{displayName}</h3>
          <p className="account-summary-email">{user.email}</p>
        </div>
      </div>

      <form className="account-form" onSubmit={handleSubmit}>
        <h4>Change password</h4>
        {statusMessage && <p className="account-form-message">{statusMessage}</p>}
        {errorMessage && <p className="account-form-error">{errorMessage}</p>}

        <label htmlFor="current-password">Current password</label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={passwordForm.currentPassword}
          onChange={handlePasswordChange}
          required
        />

        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={passwordForm.newPassword}
          onChange={handlePasswordChange}
          required
        />

        <button type="submit" className="button" disabled={isLoading}>
          Update password
        </button>
      </form>
    </section>
  );
});
