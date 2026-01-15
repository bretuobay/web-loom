import { BehaviorSubject } from 'rxjs';
import type {
  AuthPayload,
  RegisterPayload,
  ChangePasswordPayload,
  AuthResponse
} from '../domain/services/apiClient';
import { taskFlowApiClient } from '../domain/services/apiClient';
import { UserEntity } from '../domain/entities/user';

const STORAGE_TOKEN_KEY = 'taskflow_token';
const STORAGE_USER_KEY = 'taskflow_user';

export class AuthViewModel {
  private readonly user$ = new BehaviorSubject<UserEntity | null>(null);
  private readonly loading$ = new BehaviorSubject(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);

  public readonly userObservable = this.user$.asObservable();
  public readonly isLoading$ = this.loading$.asObservable();
  public readonly errorMessage$ = this.error$.asObservable();

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    const token = window.localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedUser = window.localStorage.getItem(STORAGE_USER_KEY);
    if (token) {
      taskFlowApiClient.setToken(token);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          this.user$.next(UserEntity.fromApi(parsed));
        } catch {
          window.localStorage.removeItem(STORAGE_USER_KEY);
        }
      }
    }
  }

  private persistSession(token: string | null, user: UserEntity | null) {
    taskFlowApiClient.setToken(token);
    this.user$.next(user);
    if (typeof window === 'undefined') {
      return;
    }
    if (token && user) {
      window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
      window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_TOKEN_KEY);
      window.localStorage.removeItem(STORAGE_USER_KEY);
    }
  }

  private getStoredToken() {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(STORAGE_TOKEN_KEY);
  }

  public refreshUser(user: UserEntity) {
    const token = this.getStoredToken();
    if (!token) {
      this.user$.next(user);
      return;
    }
    this.persistSession(token, user);
  }

  private setError(message: string | null) {
    this.error$.next(message);
  }

  public clearError() {
    this.setError(null);
  }

  private async authenticate(result: AuthResponse) {
    const user = UserEntity.fromApi(result.user);
    this.persistSession(result.token, user);
    return user;
  }

  public async login(payload: AuthPayload) {
    this.loading$.next(true);
    this.setError(null);
    try {
      const response = await taskFlowApiClient.login(payload);
      await this.authenticate(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      this.setError(message);
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  public async register(payload: RegisterPayload) {
    this.loading$.next(true);
    this.setError(null);
    try {
      const response = await taskFlowApiClient.register(payload);
      await this.authenticate(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      this.setError(message);
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  public async changePassword(payload: ChangePasswordPayload) {
    this.loading$.next(true);
    this.setError(null);
    try {
      await taskFlowApiClient.changePassword(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      this.setError(message);
      throw error;
    } finally {
      this.loading$.next(false);
    }
  }

  public logout() {
    this.persistSession(null, null);
    this.setError(null);
  }
}
