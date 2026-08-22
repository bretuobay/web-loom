import { describe, expect, it, vi } from 'vitest';
import { createRouter, type Router } from '@web-loom/router-core';
import { compile } from '@web-loom/template-core';
import { createRouterView, toRouteDefinitions, type TemplateRoute } from './router-view.js';

interface AppContext {
  title: string;
}

function makeRoutes(load?: (path: string) => void): TemplateRoute<AppContext>[] {
  return [
    {
      path: '/',
      template: compile<AppContext>('<h1>home {{ title }}</h1>'),
      load: load ? () => load('/') : undefined,
    },
    {
      path: '/sensors',
      template: compile<AppContext>('<h1>sensors {{ title }}</h1>'),
      load: load ? () => load('/sensors') : undefined,
    },
  ];
}

function makeRouter(routes: TemplateRoute<AppContext>[]): Router {
  window.history.replaceState(null, '', '/');
  return createRouter({ mode: 'history', routes: toRouteDefinitions(routes) });
}

describe('createRouterView', () => {
  it('renders the current route immediately on mount', () => {
    const routes = makeRoutes();
    const router = makeRouter(routes);
    const outletEl = document.createElement('main');

    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
    });

    expect(outletEl.textContent).toBe('home app');
    view.dispose();
    router.destroy();
  });

  it('swaps templates on navigation and disposes the previous mount', async () => {
    const routes = makeRoutes();
    const router = makeRouter(routes);
    const outletEl = document.createElement('main');

    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
    });

    await router.push('/sensors');
    expect(outletEl.textContent).toBe('sensors app');
    expect(outletEl.querySelectorAll('h1')).toHaveLength(1);

    view.dispose();
    router.destroy();
  });

  it('runs the load hook on each route entry', async () => {
    const load = vi.fn();
    const routes = makeRoutes(load);
    const router = makeRouter(routes);
    const outletEl = document.createElement('main');

    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
    });
    await Promise.resolve();
    expect(load).toHaveBeenCalledWith('/');

    await router.push('/sensors');
    await Promise.resolve();
    expect(load).toHaveBeenCalledWith('/sensors');
    expect(load).toHaveBeenCalledTimes(2);

    view.dispose();
    router.destroy();
  });

  it('reports load failures through onLoadError instead of throwing', async () => {
    const failure = new Error('fetch failed');
    const onLoadError = vi.fn();
    const routes: TemplateRoute<AppContext>[] = [
      {
        path: '/',
        template: compile<AppContext>('<h1>home</h1>'),
        load: () => Promise.reject(failure),
      },
    ];
    const router = makeRouter(routes);
    const outletEl = document.createElement('main');

    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
      onLoadError,
    });

    await vi.waitFor(() => expect(onLoadError).toHaveBeenCalledWith(failure, expect.objectContaining({ path: '/' })));

    view.dispose();
    router.destroy();
  });

  it('falls back to the notFound template for unknown paths', async () => {
    const routes = makeRoutes();
    const router = createRouter({
      mode: 'history',
      routes: [...toRouteDefinitions(routes), { path: '/unmapped' }],
    });
    const outletEl = document.createElement('main');

    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
    });

    await router.push('/unmapped');
    expect(outletEl.textContent).toBe('missing');

    view.dispose();
    router.destroy();
  });

  it('rejects duplicate route paths', () => {
    const routes = makeRoutes();
    const [firstRoute] = routes;
    if (!firstRoute) throw new Error('expected at least one route');
    const router = makeRouter(routes);
    expect(() =>
      createRouterView(document.createElement('main'), {
        router,
        routes: [...routes, firstRoute],
        notFound: compile<AppContext>('<h1>missing</h1>'),
        context: { title: 'app' },
      }),
    ).toThrow(/duplicate route path/);
    router.destroy();
  });

  it('stops reacting to navigation after dispose', async () => {
    const routes = makeRoutes();
    const router = makeRouter(routes);
    const outletEl = document.createElement('main');

    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
    });
    view.dispose();
    expect(outletEl.textContent).toBe('');

    await router.push('/sensors');
    expect(outletEl.textContent).toBe('');
    router.destroy();
  });
});

describe('toRouteDefinitions', () => {
  it('carries path, name, and meta into router-core definitions', () => {
    const definitions = toRouteDefinitions<AppContext>([
      {
        path: '/sensors',
        template: compile<AppContext>('<p></p>'),
        name: 'sensors',
        meta: { icon: 'gauge' },
      },
    ]);
    expect(definitions).toEqual([{ path: '/sensors', name: 'sensors', meta: { icon: 'gauge' } }]);
  });
});

describe('createRouterView hydrate option', () => {
  it('hydrates pre-rendered markup on the first render instead of mounting', async () => {
    const routes = makeRoutes();
    const router = makeRouter(routes);
    const outletEl = document.createElement('main');
    outletEl.innerHTML = '<h1>home app</h1>';
    const existingH1 = outletEl.querySelector('h1');

    const hydrateSpy = vi.spyOn(routes[0]!.template, 'hydrate');
    const mountSpy = vi.spyOn(routes[0]!.template, 'mount');

    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
      hydrate: true,
    });

    expect(hydrateSpy).toHaveBeenCalledTimes(1);
    expect(mountSpy).not.toHaveBeenCalled();
    expect(outletEl.querySelector('h1')).toBe(existingH1);

    view.dispose();
    router.destroy();
  });

  it('mounts fresh on the first render when the outlet has no existing markup', () => {
    const routes = makeRoutes();
    const router = makeRouter(routes);
    const outletEl = document.createElement('main');

    const hydrateSpy = vi.spyOn(routes[0]!.template, 'hydrate');
    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
      hydrate: true,
    });

    expect(hydrateSpy).not.toHaveBeenCalled();
    expect(outletEl.textContent).toBe('home app');

    view.dispose();
    router.destroy();
  });

  it('mounts (not hydrates) on every navigation after the first render', async () => {
    const routes = makeRoutes();
    const router = makeRouter(routes);
    const outletEl = document.createElement('main');
    outletEl.innerHTML = '<h1>home app</h1>';

    const mountSpy = vi.spyOn(routes[1]!.template, 'mount');
    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
      hydrate: true,
    });

    await router.push('/sensors');
    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(outletEl.textContent).toBe('sensors app');

    view.dispose();
    router.destroy();
  });

  it('behaves like a plain mount when hydrate is not set, even with existing markup', () => {
    const routes = makeRoutes();
    const router = makeRouter(routes);
    const outletEl = document.createElement('main');
    outletEl.innerHTML = '<h1>stale</h1>';

    const hydrateSpy = vi.spyOn(routes[0]!.template, 'hydrate');
    const mountSpy = vi.spyOn(routes[0]!.template, 'mount');
    const view = createRouterView(outletEl, {
      router,
      routes,
      notFound: compile<AppContext>('<h1>missing</h1>'),
      context: { title: 'app' },
    });

    expect(hydrateSpy).not.toHaveBeenCalled();
    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(outletEl.textContent).toContain('home app');

    view.dispose();
    router.destroy();
  });
});
