import { type ChangeEvent, type FormEvent, type MouseEvent, useEffect } from 'react';
import type { ProfilePreferences } from '../domain/entities/user';
import { useObservable } from '../hooks/useObservable';
import { useTheme } from '../providers/ThemeProvider';
import type { ProfileViewModel } from '../view-models/ProfileViewModel';
import styles from './ProfilePanel.module.css';

const initialFormState = {
  displayName: '',
  avatarUrl: null,
  preferences: {},
  isDirty: false
};

interface ProfilePanelProps {
  viewModel: ProfileViewModel;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfilePanel({ viewModel, isOpen, onClose }: ProfilePanelProps) {
  const profile = useObservable(viewModel.profileObservable, null);
  const form = useObservable(viewModel.formObservable, initialFormState);
  const isLoading = useObservable(viewModel.isLoading$, false);
  const isSaving = useObservable(viewModel.isSaving$, false);
  const feedback = useObservable(viewModel.feedbackObservable, null);
  const { theme, setThemeMode } = useTheme();

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    viewModel.cancel();
    onClose();
  };

  const handleClose = () => {
    viewModel.cancel();
    onClose();
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await viewModel.saveProfile();
    } catch {
      // Feedback already set in ViewModel
    }
  };

  const handleCancel = () => {
    viewModel.cancel();
    onClose();
  };

  const handleDisplayNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    viewModel.setDisplayName(event.target.value);
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    viewModel.setAvatarUrl(value ? value : null);
  };

  const handleThemeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    viewModel.setThemePreference(value ? (value as ProfilePreferences['theme']) : undefined);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void viewModel.loadProfile();
  }, [isOpen, viewModel]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const targetTheme = form.preferences.theme;
    if (targetTheme && targetTheme !== theme) {
      setThemeMode(targetTheme);
    }
  }, [form.preferences.theme, isOpen, setThemeMode, theme]);

  if (!isOpen) {
    return null;
  }

  const canSave = form.isDirty && form.displayName.trim().length >= 2 && !isSaving;
  const previewInitial = form.displayName || profile?.displayName || 'You';
  const avatarUrl = form.avatarUrl ?? profile?.avatarUrl;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label="Profile settings">
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>{profile?.displayName ?? 'Your profile'}</h2>
            <p className={styles.subtitle}>
              {profile?.email} · {profile?.role ?? 'Member'}
            </p>
          </div>
          <button className={styles.closeButton} type="button" onClick={handleClose}>
            Close
          </button>
        </header>

        <div className={styles.preview}>
          <div className={styles.avatar}>
            {avatarUrl ? (
              <img className={styles.avatarImage} src={avatarUrl} alt={`${previewInitial} avatar`} />
            ) : (
              <span className={styles.avatarPlaceholder}>{previewInitial.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className={styles.previewLabel}>Welcome back, {profile?.displayName ?? 'teammate'}!</p>
            <p className={styles.previewMeta}>Use this panel to keep your profile up to date.</p>
          </div>
        </div>

        {feedback && (
          <div
            className={`${styles.feedback} ${
              feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
            }`}
          >
            {feedback.message}
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>Loading profile data…</div>
        ) : (
          <form className={styles.form} onSubmit={handleSave}>
            <label className={styles.field}>
              <span>Display name</span>
              <input
                type="text"
                value={form.displayName}
                onChange={handleDisplayNameChange}
                placeholder="Set a friendly name"
                minLength={2}
              />
            </label>

            <label className={styles.field}>
              <span>Avatar URL</span>
              <input
                type="url"
                value={form.avatarUrl ?? ''}
                onChange={handleAvatarChange}
                placeholder="https://example.com/avatar.png"
              />
            </label>

            <label className={styles.field}>
              <span>Theme preference</span>
              <select value={form.preferences.theme ?? ''} onChange={handleThemeChange}>
                <option value="">Follow system</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className={styles.saveButton} disabled={!canSave}>
                {isSaving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
