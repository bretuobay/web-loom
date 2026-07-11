import { signal, observe, type ReadonlySignal } from '@web-loom/signals-core';
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
  private readonly _sessionResult = signal<AuthTokenResponseData | null>(null);
  public readonly sessionResult$: ReadonlySignal<AuthTokenResponseData | null> = this._sessionResult.asReadonly();
  public readonly token$: ReadonlySignal<string | null>;
  private readonly _authenticated = signal<boolean>(false);
  public readonly isAuthenticated$: ReadonlySignal<boolean> = this._authenticated.asReadonly();
  public readonly user$: ReadonlySignal<UserData | null>;

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
    this.user$ = this.data$ as ReadonlySignal<UserData | null>;
    this.token$ = model.token$;
    // observe delivers the stored token immediately, then on every change
    const unsubscribe = observe(this.token$, (token) => {
      this._authenticated.set(Boolean(token));
    });
    this.addSubscription(unsubscribe);

    this.signInCommand = Command.create<SignInPayload, AuthTokenResponseData>()
      .withExecute(async (payload: SignInPayload) => {
        const result = await model.signIn(payload);
        this._sessionResult.set(result);
        return result;
      })
      .build();

    this.signUpCommand = Command.create<SignUpPayload, AuthTokenResponseData>()
      .withExecute(async (payload: SignUpPayload) => {
        const result = await model.signUp(payload);
        this._sessionResult.set(result);
        return result;
      })
      .build();

    this.changePasswordCommand = Command.create<ChangePasswordPayload, AuthTokenResponseData>()
      .withExecute(async (payload: ChangePasswordPayload) => {
        const result = await model.changePassword(payload);
        this._sessionResult.set(result);
        return result;
      })
      .build();

    this.signOutCommand = Command.create<void, void>()
      .withExecute(async () => {
        await model.signOut();
        this._sessionResult.set(null);
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
  }
}

const authModel = new AuthModel();
export const authViewModel = new AuthViewModel(authModel);
export type { AuthTokenResponseData, ChangePasswordPayload, SignInPayload, SignUpPayload };
