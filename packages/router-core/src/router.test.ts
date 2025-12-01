import { beforeEach, describe, expect, it } from 'vitest';
import { createRouter } from './router';
import type { RouteDefinition } from './types';

const routes: RouteDefinition[] = [
  { path: '/', name: 'home' },
  {
    path: '/users',
    name: 'users',
    children: [
      { path: '/', name: 'user-list' },
      {
        path: '/:id',
        name: 'user-detail',
        meta: { auth: true },
      },
    ],
  },
  { path: '/login', name: 'login' },
  { path: '/blocked', name: 'blocked' },
];

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('createRouter', () => {
  it('navigates via push and resolves params/query', async () => {
    const router = createRouter({ routes });
    await router.push('/users/42?tab=info');
    expect(router.currentRoute.path).toBe('/users/42');
    expect(router.currentRoute.params.id).toBe('42');
    expect(router.currentRoute.query.tab).toBe('info');
    router.destroy();
  });

  it('applies global guards and redirects', async () => {
    const router = createRouter({ routes });
    router.beforeEach((to) => {
      if (to.meta.auth) {
        return '/login';
      }
    });
    await router.push('/users/7');
    expect(router.currentRoute.name).toBe('login');
    router.destroy();
  });

  it('cancels navigation when guard returns false', async () => {
    const router = createRouter({ routes });
    router.beforeEach((to) => {
      if (to.path === '/blocked') {
        return false;
      }
    });
    await router.push('/blocked');
    expect(router.currentRoute.path).toBe('/');
    router.destroy();
  });

  it('notifies subscribers immediately and on navigation', async () => {
    const router = createRouter({ routes });
    const visited: string[] = [];
    const unsubscribe = router.subscribe((route) => visited.push(route.fullPath));
    expect(visited).toEqual(['/']);
    await router.push('/users');
    expect(visited.at(-1)).toBe('/users');
    unsubscribe();
    router.destroy();
  });
});
