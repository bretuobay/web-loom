import { describe, expect, it } from 'vitest';
import { matchRoute } from './matcher';
import type { RouteDefinition } from './types';

const routes: RouteDefinition[] = [
  { path: '/', name: 'home' },
  {
    path: '/users',
    name: 'users',
    children: [
      { path: '/', name: 'user-list' },
      { path: '/:id(\\d+)', name: 'user-detail', meta: { auth: true } },
    ],
  },
  {
    path: '/files/*',
    name: 'file-catch',
  },
];

describe('matchRoute', () => {
  it('matches nested dynamic routes and extracts params', () => {
    const match = matchRoute(routes, '/users/42?tab=activity');
    expect(match.name).toBe('user-detail');
    expect(match.params).toEqual({ id: '42' });
    expect(match.meta).toEqual({ auth: true });
    expect(match.query).toEqual({ tab: 'activity' });
    expect(match.fullPath).toBe('/users/42?tab=activity');
    expect(match.matched.length).toBe(3);
  });

  it('supports wildcard routes', () => {
    const match = matchRoute(routes, '/files/foo/bar.png');
    expect(match.params).toEqual({ wildcard: 'foo/bar.png' });
    expect(match.name).toBe('file-catch');
  });

  it('throws when no route matches', () => {
    expect(() => matchRoute(routes, '/orders/abc')).toThrowError();
  });
});
