import { describe, expect, it } from 'vitest';
import { parseQuery, stringifyQuery, buildURL } from './query';

describe('query utilities', () => {
  it('parses query strings with repeated keys', () => {
    expect(parseQuery('?page=2&tag=a&tag=b')).toEqual({
      page: '2',
      tag: ['a', 'b'],
    });
  });

  it('stringifies query objects', () => {
    expect(
      stringifyQuery({
        page: 3,
        search: 'test',
        tags: ['a', 'b'],
        skip: undefined,
      }),
    ).toBe('?page=3&search=test&tags=a&tags=b');
  });

  it('builds URLs with normalized paths', () => {
    expect(buildURL('users/123', { tab: 'profile' })).toBe('/users/123?tab=profile');
  });
});
