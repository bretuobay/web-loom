import { BehaviorSubject, type Observable } from 'rxjs';
import { BaseViewModel, Command, type ICommand } from '@web-loom/mvvm-core';
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

  public readonly signInCommand: ICommand<SignInPayload, AuthTokenResponseData>;
  public readonly signUpCommand: ICommand<SignUpPayload, AuthTokenResponseData>;
  public readonly changePasswordCommand: ICommand<ChangePasswordPayload, AuthTokenResponseData>;
  public readonly signOutCommand: ICommand<void, void>;
  public readonly refreshSessionCommand: ICommand<void, void>;

  constructor(model: AuthModel) {
    super(model);
    this.user$ = this.data$ as Observable<UserData | null>;
    this.token$ = model.token$;
    const subscription = this.token$.subscribe((token) => {
      this._authenticated$.next(Boolean(token));
    });
    this.addSubscription(subscription);

    this.signInCommand = Command.create<SignInPayload, AuthTokenResponseData>()
      .withExecute(async (payload: SignInPayload) => {
        const result = await model.signIn(payload);
        this._sessionResult$.next(result);
        return result;
      })
      .build();

    this.signUpCommand = Command.create<SignUpPayload, AuthTokenResponseData>()
      .withExecute(async (payload: SignUpPayload) => {
        const result = await model.signUp(payload);
        this._sessionResult$.next(result);
        return result;
      })
      .build();

    this.changePasswordCommand = Command.create<ChangePasswordPayload, AuthTokenResponseData>()
      .withExecute(async (payload: ChangePasswordPayload) => {
        const result = await model.changePassword(payload);
        this._sessionResult$.next(result);
        return result;
      })
      .build();

    this.signOutCommand = Command.create<void, void>()
      .withExecute(async () => {
        await model.signOut();
        this._sessionResult$.next(null);
      })
      .build();

    this.refreshSessionCommand = Command.create<void, void>()
      .withExecute(async () => {
        await model.fetch();
      })
      .build();
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
