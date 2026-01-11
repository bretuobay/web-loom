import { BehaviorSubject, type Observable } from 'rxjs';
import { BaseViewModel, Command } from '@web-loom/mvvm-core';
import {
  AuthModel,
  type AuthTokenResponseData,
  type ChangePasswordPayload,
  type SignInPayload,
  type SignUpPayload,
  type UserData,
} from '@repo/models';

export class AuthViewModel extends BaseViewModel<AuthModel> {
  private readonly _sessionResult$ = new BehaviorSubject<AuthTokenResponseData | null>(null);
  public readonly sessionResult$: Observable<AuthTokenResponseData | null> = this._sessionResult$.asObservable();
  public readonly token$: Observable<string | null>;
  private readonly _authenticated$ = new BehaviorSubject<boolean>(false);
  public readonly isAuthenticated$: Observable<boolean> = this._authenticated$.asObservable();
  public readonly user$: Observable<UserData | null>;

  public get token(): string | null {
    return this.model.token;
  }

  public readonly signInCommand: Command<SignInPayload, AuthTokenResponseData>;
  public readonly signUpCommand: Command<SignUpPayload, AuthTokenResponseData>;
  public readonly changePasswordCommand: Command<ChangePasswordPayload, AuthTokenResponseData>;
  public readonly signOutCommand: Command<void, void>;
  public readonly refreshSessionCommand: Command<void, void>;

  constructor(model: AuthModel) {
    super(model);
    this.user$ = this.data$ as Observable<UserData | null>;
    this.token$ = model.token$;
    const subscription = this.token$.subscribe((token) => {
      this._authenticated$.next(Boolean(token));
    });
    this.addSubscription(subscription);

    this.signInCommand = new Command(async (payload: SignInPayload) => {
      const result = await model.signIn(payload);
      this._sessionResult$.next(result);
      return result;
    });

    this.signUpCommand = new Command(async (payload: SignUpPayload) => {
      const result = await model.signUp(payload);
      this._sessionResult$.next(result);
      return result;
    });

    this.changePasswordCommand = new Command(async (payload: ChangePasswordPayload) => {
      const result = await model.changePassword(payload);
      this._sessionResult$.next(result);
      return result;
    });

    this.signOutCommand = new Command(async () => {
      await model.signOut();
      this._sessionResult$.next(null);
    });

    this.refreshSessionCommand = new Command(async () => {
      await model.fetch();
    });
  }

  public dispose(): void {
    super.dispose();
    this.signInCommand.dispose();
    this.signUpCommand.dispose();
    this.changePasswordCommand.dispose();
    this.signOutCommand.dispose();
    this.refreshSessionCommand.dispose();
    this._sessionResult$.complete();
    this._authenticated$.complete();
  }
}

const authModel = new AuthModel();
export const authViewModel = new AuthViewModel(authModel);
export type { AuthTokenResponseData, ChangePasswordPayload, SignInPayload, SignUpPayload };
