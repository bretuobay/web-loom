import type { RouteDefinition, RouteMatch, Router } from '@web-loom/router-core';
import type { Disposable, Template } from '@web-loom/template-core';

/**
 * One row of the declarative route table: the single source of truth for
 * "which template renders at this path, and what data it needs on entry".
 */
export interface TemplateRoute<TContext extends object = object> {
  path: string;
  template: Template<TContext>;
  /**
   * Runs on every entry into this route, after the template is shown.
   * Replaces per-template `use:` fetch triggers; rejections are routed to
   * {@link RouterViewOptions.onLoadError} instead of becoming unhandled.
   */
  load?: (match: RouteMatch) => void | Promise<void>;
  name?: string;
  meta?: Record<string, unknown>;
}

export interface RouterViewOptions<TContext extends object> {
  router: Router;
  routes: ReadonlyArray<TemplateRoute<TContext>>;
  /** Shown when no route in the table matches the current path. */
  notFound: Template<TContext>;
  /** The context object mounted with every route template. */
  context: TContext;
  onLoadError?: (error: unknown, match: RouteMatch) => void;
  /**
   * When true, the first render hydrates pre-rendered markup already present
   * in `outletEl` (e.g. from an SSR response) instead of mounting fresh —
   * matching `Template.hydrate()`'s recovery behavior if the markup doesn't
   * match. Every render after the first always mounts. Default: false.
   */
  hydrate?: boolean;
}

/**
 * Binds a router to a template outlet: shows the matching route's template on
 * every navigation (including the current route immediately, since
 * `router.subscribe` emits on subscribe) and runs its `load` hook per entry.
 * Disposing unsubscribes from the router and tears down the mounted template.
 */
export function createRouterView<TContext extends object>(
  outletEl: Element,
  options: RouterViewOptions<TContext>,
): Disposable {
  const { router, routes, notFound, context } = options;
  const onLoadError =
    options.onLoadError ??
    ((error: unknown, match: RouteMatch) => {
      console.error(`[template-core-router] load failed for "${match.path}"`, error);
    });

  const byPath = new Map<string, TemplateRoute<TContext>>();
  for (const route of routes) {
    if (byPath.has(route.path)) {
      throw new Error(`createRouterView received duplicate route path "${route.path}".`);
    }
    byPath.set(route.path, route);
  }

  let current: Disposable | null = null;
  let isFirstRender = true;
  let disposed = false;

  const showRoute = (match: RouteMatch): void => {
    if (disposed) return;
    const route = byPath.get(match.path);
    const template = route?.template ?? notFound;

    if (isFirstRender && options.hydrate && outletEl.childNodes.length > 0) {
      current = template.hydrate(outletEl, context);
    } else {
      current?.dispose();
      current = template.mount(outletEl, context);
    }
    isFirstRender = false;

    if (route?.load) {
      Promise.resolve()
        .then(() => route.load?.(match))
        .catch((error) => onLoadError(error, match));
    }
  };

  const unsubscribe = router.subscribe(showRoute);

  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      current?.dispose();
      current = null;
    },
  };
}

/**
 * Derives the router-core route definitions from the same table, so the
 * router and the view never disagree about which paths exist.
 */
export function toRouteDefinitions<TContext extends object>(
  routes: ReadonlyArray<TemplateRoute<TContext>>,
): RouteDefinition[] {
  return routes.map((route) => ({
    path: route.path,
    name: route.name,
    meta: route.meta,
  }));
}
