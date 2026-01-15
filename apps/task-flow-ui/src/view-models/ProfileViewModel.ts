import { BehaviorSubject, Subscription, type Observable } from 'rxjs';
import type { ProfilePreferences } from '../domain/entities/user';
import { UserEntity } from '../domain/entities/user';
import { taskFlowApiClient } from '../domain/services/apiClient';
import { AuthViewModel } from './AuthViewModel';
import { Command } from '@web-loom/mvvm-core';
import { startWith } from 'rxjs/operators';

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

  private readonly subscriptions = new Subscription();

  private readonly feedback$ = new BehaviorSubject<FeedbackMessage>(null);
  public readonly feedbackObservable = this.feedback$.asObservable();

  private currentProfile: UserEntity | null = null;

  public readonly loadCommand: Command<void, void>;
  public readonly saveCommand: Command<void, void>;
  public readonly isLoading$: Observable<boolean>;
  public readonly isSaving$: Observable<boolean>;

  private readonly authViewModel: AuthViewModel;
  private readonly client: typeof taskFlowApiClient;

  constructor(authViewModel: AuthViewModel, client = taskFlowApiClient) {
    this.authViewModel = authViewModel;
    this.client = client;
    this.subscriptions.add(
      this.authViewModel.userObservable.subscribe((user) => {
        if (!user) {
          return;
        }
        this.currentProfile = user;
        this.profile$.next(user);
        this.resetForm(user);
      }),
    );

    this.loadCommand = new Command(async () => {
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
      }
    });

    this.saveCommand = new Command(async () => {
      const form = this.getFormState();
      const payload = {
        displayName: form.displayName.trim(),
        avatarUrl: form.avatarUrl && form.avatarUrl.trim() ? form.avatarUrl.trim() : null,
        preferences: form.preferences,
      };
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
      }
    });

    this.isLoading$ = this.loadCommand.isExecuting$.pipe(startWith(false));
    this.isSaving$ = this.saveCommand.isExecuting$.pipe(startWith(false));
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
    await this.loadCommand.execute();
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
    await this.saveCommand.execute();
  }

  public dispose() {
    this.subscriptions.unsubscribe();
    this.loadCommand.dispose();
    this.saveCommand.dispose();
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
