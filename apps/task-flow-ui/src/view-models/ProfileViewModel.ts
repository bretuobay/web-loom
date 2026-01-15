import { BehaviorSubject } from 'rxjs';
import type { ProfilePreferences, UserApiResponse } from '../domain/entities/user';
import { UserEntity } from '../domain/entities/user';
import { taskFlowApiClient } from '../domain/services/apiClient';
import { AuthViewModel } from './AuthViewModel';

interface ProfileFormState {
  displayName: string;
  avatarUrl: string | null;
  preferences: ProfilePreferences;
  isDirty: boolean;
}

type FeedbackMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

export class ProfileViewModel {
  private readonly profile$ = new BehaviorSubject<UserEntity | null>(null);
  public readonly profileObservable = this.profile$.asObservable();

  private readonly form$ = new BehaviorSubject<ProfileFormState>(this.createEmptyForm());
  public readonly formObservable = this.form$.asObservable();

  private readonly loading$ = new BehaviorSubject(false);
  public readonly isLoading$ = this.loading$.asObservable();

  private readonly saving$ = new BehaviorSubject(false);
  public readonly isSaving$ = this.saving$.asObservable();

  private readonly feedback$ = new BehaviorSubject<FeedbackMessage>(null);
  public readonly feedbackObservable = this.feedback$.asObservable();

  private currentProfile: UserEntity | null = null;

  constructor(private readonly authViewModel: AuthViewModel, private readonly client = taskFlowApiClient) {
    this.authViewModel.userObservable.subscribe((user) => {
      if (!user) {
        return;
      }
      this.currentProfile = user;
      this.profile$.next(user);
      this.resetForm(user);
    });
  }

  private createEmptyForm(): ProfileFormState {
    return {
      displayName: '',
      avatarUrl: null,
      preferences: {},
      isDirty: false
    };
  }

  private getFormState() {
    return this.form$.getValue();
  }

  private setFeedback(message: string, type: 'success' | 'error') {
    this.feedback$.next({ message, type });
  }

  public clearFeedback() {
    this.feedback$.next(null);
  }

  private resetForm(profile: UserEntity) {
    this.form$.next({
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      preferences: { ...profile.preferences },
      isDirty: false
    });
  }

  private updateForm(partial: Partial<Omit<ProfileFormState, 'isDirty'>>) {
    const next = {
      ...this.getFormState(),
      ...partial,
      isDirty: true
    };
    this.form$.next(next);
  }

  public async loadProfile() {
    this.loading$.next(true);
    this.clearFeedback();
    try {
      const response = await this.client.fetchProfile();
      const profile = UserEntity.fromApi(response);
      this.currentProfile = profile;
      this.profile$.next(profile);
      this.authViewModel.refreshUser(profile);
      this.resetForm(profile);
    } catch (error) {
      this.setFeedback('Unable to load profile. Please try again.', 'error');
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  public setDisplayName(value: string) {
    this.updateForm({
      displayName: value
    });
  }

  public setAvatarUrl(value: string | null) {
    this.updateForm({
      avatarUrl: value
    });
  }

  public setThemePreference(value: ProfilePreferences['theme'] | undefined) {
    const preferences = { ...this.getFormState().preferences };
    if (value) {
      preferences.theme = value;
    } else {
      delete preferences.theme;
    }
    this.updateForm({
      preferences
    });
  }

  public async saveProfile() {
    const form = this.getFormState();
    const payload = {
      displayName: form.displayName.trim(),
      avatarUrl: form.avatarUrl && form.avatarUrl.trim() ? form.avatarUrl.trim() : null,
      preferences: form.preferences
    };
    this.saving$.next(true);
    this.clearFeedback();
    try {
      const updated = await this.client.updateProfile(payload);
      const profile = UserEntity.fromApi(updated);
      this.currentProfile = profile;
      this.profile$.next(profile);
      this.authViewModel.refreshUser(profile);
      this.resetForm(profile);
      this.setFeedback('Profile updated successfully.', 'success');
    } catch (error) {
      this.setFeedback('Unable to save profile changes.', 'error');
      throw error;
    } finally {
      this.saving$.next(false);
    }
  }

  public cancel() {
    if (this.currentProfile) {
      this.resetForm(this.currentProfile);
    } else {
      this.form$.next(this.createEmptyForm());
    }
    this.clearFeedback();
  }
}
