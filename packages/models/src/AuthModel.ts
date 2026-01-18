import { RestfulApiModel, type Fetcher } from '@web-loom/mvvm-core';
import { BehaviorSubject } from 'rxjs';
import { apiRegistry, type ApiEndpoint } from './services/services';
import { API_BASE_URL } from './config';
import { nativeFetcher } from './utils/fetcher';
import { AuthTokenResponseSchema, type AuthTokenResponseData, type UserData, UserSchema } from './schemas/auth.schema';

type AuthHeadersResolver = (extra?: HeadersInit) => HeadersInit;

interface AuthFetcherBinding {
  fetcher: Fetcher;
  changeToken: (value?: string | null) => void;
  resolveHeaders: AuthHeadersResolver;
  readToken: () => string | null;
}

const AUTH_STORAGE_KEY = 'mvvm-react-integrated-auth-token';
const isBrowser = typeof window !== 'undefined';

function readTokenFromStorage(): string | null {
  if (!isBrowser) {
    return null;
  }
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

function persistToken(value: string | null): void {
  if (!isBrowser) {
    return;
  }
  if (value) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, value);
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function createAuthFetcher(initialToken?: string | null): AuthFetcherBinding {
  let token: string | null = initialToken ?? null;

  const baseHeaders = (extra?: HeadersInit): HeadersInit => {
    const result: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(extra ?? {}),
    };
    if (token) {
      return { ...result, Authorization: `Bearer ${token}` };
    }
    return result;
  };

  const fetcher: Fetcher = (url, options) => {
    return nativeFetcher(url, {
      ...options,
      headers: baseHeaders(options?.headers as HeadersInit),
    });
  };

  return {
    fetcher,
    changeToken(value?: string | null) {
      token = value ?? null;
    },
    resolveHeaders(extra?: HeadersInit) {
      return baseHeaders(extra);
    },
    readToken() {
      return token;
    },
  };
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends SignInPayload {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export class AuthModel extends RestfulApiModel<UserData, typeof UserSchema> {
  private readonly _token = new BehaviorSubject<string | null>(null);
  public readonly token$ = this._token.asObservable();
  private readonly updateFetcherToken: (value?: string | null) => void;
  private readonly resolveHeaders: AuthHeadersResolver;
  private readonly readFetcherToken: () => string | null;

  constructor() {
    const storedToken = readTokenFromStorage();
    const authFetcher = createAuthFetcher(storedToken);
    super({
      baseUrl: API_BASE_URL,
      endpoint: apiRegistry.auth.me.path,
      fetcher: authFetcher.fetcher,
      schema: UserSchema,
      initialData: null,
      validateSchema: true,
    });
    this.updateFetcherToken = authFetcher.changeToken;
    this.resolveHeaders = authFetcher.resolveHeaders;
    this.readFetcherToken = authFetcher.readToken;
    this.updateTokenState(storedToken);
  }

  public get token(): string | null {
    return this.readFetcherToken();
  }

  public get isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  private updateTokenState(value: string | null) {
    this.updateFetcherToken(value);
    this._token.next(value);
    persistToken(value);
  }

  private async withLoading<T>(work: () => Promise<T>): Promise<T> {
    this.setLoading(true);
    this.clearError();
    try {
      return await work();
    } catch (err) {
      this.setError(err);
      throw err;
    } finally {
      this.setLoading(false);
    }
  }

  private async callAuthEndpoint<T>(endpoint: ApiEndpoint, body?: unknown): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.path}`;
    const response = await nativeFetcher(url, {
      method: endpoint.method,
      headers: this.resolveHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    const fallback = await response.text();
    return fallback as unknown as T;
  }

  private adoptSession(session: AuthTokenResponseData): void {
    this.setData(session.user);
    this.updateTokenState(session.token);
  }

  public async signUp(payload: SignUpPayload): Promise<AuthTokenResponseData> {
    return this.withLoading(async () => {
      const responseBody = await this.callAuthEndpoint<AuthTokenResponseData>(apiRegistry.auth.signup, payload);
      const parsed = AuthTokenResponseSchema.parse(responseBody);
      this.adoptSession(parsed);
      return parsed;
    });
  }

  public async signIn(payload: SignInPayload): Promise<AuthTokenResponseData> {
    return this.withLoading(async () => {
      const responseBody = await this.callAuthEndpoint<AuthTokenResponseData>(apiRegistry.auth.signin, payload);
      const parsed = AuthTokenResponseSchema.parse(responseBody);
      this.adoptSession(parsed);
      return parsed;
    });
  }

  public async changePassword(payload: ChangePasswordPayload): Promise<AuthTokenResponseData> {
    return this.withLoading(async () => {
      const responseBody = await this.callAuthEndpoint<AuthTokenResponseData>(apiRegistry.auth.changePassword, payload);
      const parsed = AuthTokenResponseSchema.parse(responseBody);
      this.adoptSession(parsed);
      return parsed;
    });
  }

  public async signOut(): Promise<void> {
    return this.withLoading(async () => {
      await this.callAuthEndpoint<void>(apiRegistry.auth.signout);
      this.setData(null);
      this.updateTokenState(null);
    });
  }

  public override dispose(): void {
    super.dispose();
    this._token.complete();
  }
}
