export type RouterMode = 'history' | 'hash';
export type MatchStrategy = 'exact' | 'prefix';

export interface RouteDefinition {
  path: string;
  name?: string;
  component?: unknown;
  children?: RouteDefinition[];
  meta?: Record<string, any>;
  beforeEnter?: NavigationGuard;
  canActivate?: NavigationGuard;
  matchStrategy?: MatchStrategy;
}

export type NavigationGuard = (to: RouteMatch, from: RouteMatch | null) => GuardResult | Promise<GuardResult>;

export type GuardResult = boolean | string | RedirectObject | void;

export interface RedirectObject {
  path: string;
  replace?: boolean;
  query?: Record<string, string | number | boolean | (string | number | boolean)[]>;
}

export interface RouteMatch {
  fullPath: string;
  path: string;
  name?: string;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  meta: Record<string, any>;
  matched: RouteDefinition[];
}

export interface RouterOptions {
  routes: RouteDefinition[];
  mode?: RouterMode;
  base?: string;
}

export interface NavigationLocation {
  path: string;
  query?: Record<string, string | number | boolean | (string | number | boolean)[]>;
  replace?: boolean;
}

export type NavigationTarget = string | NavigationLocation;

export type AfterNavigationHook = (to: RouteMatch, from: RouteMatch | null) => void;
export type RouterErrorHandler = (error: unknown) => void;
export type RouteSubscriber = (route: RouteMatch) => void;

export interface Router {
  readonly currentRoute: RouteMatch;
  push(target: NavigationTarget): Promise<RouteMatch>;
  replace(target: NavigationTarget): Promise<RouteMatch>;
  go(delta: number): void;
  back(): void;
  forward(): void;
  resolve(target: NavigationTarget): RouteMatch;
  beforeEach(guard: NavigationGuard): () => void;
  afterEach(hook: AfterNavigationHook): () => void;
  onError(handler: RouterErrorHandler): () => void;
  subscribe(subscriber: RouteSubscriber): () => void;
  destroy(): void;
}
