import { createHistory } from './history';
import { createRouteMatcher, type MatchContext } from './matcher';
import { buildURL, normalizePath, parseQuery } from './query';
import {
  type AfterNavigationHook,
  type NavigationGuard,
  type NavigationLocation,
  type NavigationTarget,
  type RedirectObject,
  type RouteMatch,
  type Router,
  type RouterErrorHandler,
  type RouterOptions,
  type RouteSubscriber,
} from './types';
import { isBrowser, mergeMeta, normalizeBase } from './utils';

type GuardOutcome =
  | { type: 'proceed' }
  | { type: 'cancel' }
  | { type: 'redirect'; target: NavigationTarget; replace?: boolean };

interface NormalizedNavigation {
  path: string;
  query: Record<string, string | string[]>;
  fullPath: string;
}

export function createRouter(options: RouterOptions): Router {
  if (!options || !options.routes || !options.routes.length) {
    throw new Error('createRouter requires at least one route definition');
  }

  const mode = options.mode ?? 'history';
  const base = normalizeBase(options.base);
  const matcher = createRouteMatcher(options.routes);
  const history = createHistory(mode, base);

  const beforeGuards = new Set<NavigationGuard>();
  const afterHooks = new Set<AfterNavigationHook>();
  const errorHandlers = new Set<RouterErrorHandler>();
  const subscribers = new Set<RouteSubscriber>();

  let destroyed = false;
  let currentRoute = resolveToRoute(history.getLocation());

  const stopHistory = history.listen(() => {
    if (destroyed) {
      return;
    }

    const location = history.getLocation();
    confirmNavigation(location, { isPop: true }).catch((error) => {
      handleError(error);
      restoreURL();
    });
  });

  function restoreURL() {
    if (destroyed) {
      return;
    }
    history.replace(currentRoute.fullPath);
  }

  function resolveToRoute(target: NavigationTarget | string): RouteMatch {
    const normalized = normalizeNavigationTarget(target);
    const context = matchContext(normalized.path);
    return buildRouteMatch(normalized, context);
  }

  function matchContext(path: string): MatchContext {
    return matcher(path);
  }

  function buildRouteMatch(normalized: NormalizedNavigation, context: MatchContext): RouteMatch {
    return {
      path: normalized.path,
      fullPath: normalized.fullPath,
      params: context.params,
      query: normalized.query,
      meta: mergeMeta(context.stack),
      name: context.stack[context.stack.length - 1]?.name,
      matched: context.stack,
    };
  }

  function normalizeNavigationTarget(target: NavigationTarget | string): NormalizedNavigation {
    if (typeof target === 'string') {
      const [pathPart, queryPart = ''] = splitPathAndQuery(target);
      const normalizedPath = normalizePath(pathPart);
      const query = parseQuery(queryPart);
      return {
        path: normalizedPath,
        query,
        fullPath: buildURL(normalizedPath, query),
      };
    }

    const [pathPart, queryPart = ''] = splitPathAndQuery(target.path);
    const normalizedPath = normalizePath(pathPart);
    const queryFromPath = parseQuery(queryPart);
    const providedQuery = normalizeQueryRecord(target.query);
    const mergedQuery = { ...queryFromPath, ...providedQuery };
    return {
      path: normalizedPath,
      query: mergedQuery,
      fullPath: buildURL(normalizedPath, mergedQuery),
    };
  }

  function normalizeQueryRecord(query?: NavigationLocation['query']): Record<string, string | string[]> {
    if (!query) {
      return {};
    }
    const result: Record<string, string | string[]> = {};
    Object.entries(query).forEach(([key, rawValue]) => {
      if (rawValue === undefined || rawValue === null) {
        return;
      }
      if (Array.isArray(rawValue)) {
        const normalizedValues = rawValue
          .filter((value) => value !== undefined && value !== null)
          .map((value) => String(value));
        if (!normalizedValues.length) {
          return;
        }
        result[key] = normalizedValues.length === 1 ? normalizedValues[0] : normalizedValues;
        return;
      }
      result[key] = String(rawValue);
    });
    return result;
  }

  function splitPathAndQuery(path: string): [string, string?] {
    const index = path.indexOf('?');
    if (index === -1) {
      return [path];
    }
    return [path.slice(0, index), path.slice(index + 1)];
  }

  async function confirmNavigation(
    target: NavigationTarget | string,
    options: { replace?: boolean; isPop?: boolean } = {},
  ): Promise<RouteMatch> {
    const toRoute = resolveToRoute(target);
    if (toRoute.fullPath === currentRoute.fullPath) {
      return currentRoute;
    }

    const fromRoute = currentRoute;

    const decision = await runGuards(toRoute, fromRoute);

    if (decision.type === 'redirect') {
      return confirmNavigation(decision.target, {
        replace: decision.replace ?? options.replace,
      });
    }

    if (decision.type === 'cancel') {
      if (options.isPop) {
        restoreURL();
      }
      return currentRoute;
    }

    finalizeNavigation(toRoute, fromRoute, {
      replace: options.replace ?? false,
      isPop: options.isPop ?? false,
    });

    return toRoute;
  }

  async function runGuards(to: RouteMatch, from: RouteMatch | null): Promise<GuardOutcome> {
    const chain: NavigationGuard[] = [];
    beforeGuards.forEach((guard) => chain.push(guard));
    to.matched.forEach((route) => {
      if (route.beforeEnter) {
        chain.push(route.beforeEnter);
      }
      if (route.canActivate) {
        chain.push(route.canActivate);
      }
    });

    for (const guard of chain) {
      try {
        const result = await guard(to, from);
        const outcome = interpretGuardResult(result);
        if (outcome.type !== 'proceed') {
          return outcome;
        }
      } catch (error) {
        handleError(error);
        throw error;
      }
    }

    return { type: 'proceed' };
  }

  function interpretGuardResult(result: unknown): GuardOutcome {
    if (result === undefined || result === true) {
      return { type: 'proceed' };
    }
    if (result === false) {
      return { type: 'cancel' };
    }
    if (typeof result === 'string') {
      return { type: 'redirect', target: result };
    }
    if (isRedirectObject(result)) {
      return {
        type: 'redirect',
        target: {
          path: result.path,
          query: result.query,
        },
        replace: result.replace,
      };
    }
    return { type: 'proceed' };
  }

  function isRedirectObject(value: unknown): value is RedirectObject {
    return Boolean(value && typeof value === 'object' && 'path' in (value as RedirectObject));
  }

  function finalizeNavigation(
    to: RouteMatch,
    from: RouteMatch | null,
    { replace, isPop }: { replace: boolean; isPop: boolean },
  ) {
    if (!isPop) {
      if (replace) {
        history.replace(to.fullPath);
      } else {
        history.push(to.fullPath);
      }
    }
    const previous = currentRoute;
    currentRoute = to;
    subscribers.forEach((subscriber) => subscriber(to));
    afterHooks.forEach((hook) => {
      try {
        hook(to, previous);
      } catch (error) {
        handleError(error);
      }
    });
  }

  function handleError(error: unknown) {
    if (!errorHandlers.size) {
      return;
    }
    errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch {
        // ignore handler errors
      }
    });
  }

  const router: Router = {
    get currentRoute() {
      return currentRoute;
    },
    push(target: NavigationTarget) {
      return confirmNavigation(target, { replace: false });
    },
    replace(target: NavigationTarget) {
      return confirmNavigation(target, { replace: true });
    },
    go(delta: number) {
      if (!isBrowser) {
        return;
      }
      window.history.go(delta);
    },
    back() {
      if (!isBrowser) {
        return;
      }
      window.history.back();
    },
    forward() {
      if (!isBrowser) {
        return;
      }
      window.history.forward();
    },
    resolve(target: NavigationTarget) {
      return resolveToRoute(target);
    },
    beforeEach(guard: NavigationGuard) {
      beforeGuards.add(guard);
      return () => beforeGuards.delete(guard);
    },
    afterEach(hook: AfterNavigationHook) {
      afterHooks.add(hook);
      return () => afterHooks.delete(hook);
    },
    onError(handler: RouterErrorHandler) {
      errorHandlers.add(handler);
      return () => errorHandlers.delete(handler);
    },
    subscribe(listener: RouteSubscriber) {
      subscribers.add(listener);
      listener(currentRoute);
      return () => subscribers.delete(listener);
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      stopHistory();
      subscribers.clear();
      beforeGuards.clear();
      afterHooks.clear();
      errorHandlers.clear();
    },
  };

  return router;
}
