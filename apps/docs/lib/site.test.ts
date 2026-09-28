import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { getBlogPages, getBookPages, getDocPages } from '@/components/mdx/utils';
import { absoluteUrl, normalizeSiteUrl } from './site';

describe('site URL handling', () => {
  it('normalizes deployment values before they reach metadata', () => {
    expect(normalizeSiteUrl(undefined)).toBe('https://webloomframework.com');
    expect(normalizeSiteUrl('  https://webloomframework.com/  ')).toBe('https://webloomframework.com');
    expect(normalizeSiteUrl('https://example.com/docs///')).toBe('https://example.com/docs');
  });

  it('builds clean absolute URLs', () => {
    expect(absoluteUrl('/docs/getting-started')).toBe('https://webloomframework.com/docs/getting-started');
  });
});

describe('sitemap', () => {
  it('contains every public route exactly once', () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    const expectedCount = 4 + getDocPages().length + getBlogPages().length + getBookPages().length;

    expect(entries).toHaveLength(expectedCount);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain('https://webloomframework.com/docs');
    expect(urls).toContain('https://webloomframework.com/blog');
    expect(urls).toContain('https://webloomframework.com/book');
    expect(urls).not.toContain('https://webloomframework.com/docs/how-can-we-help');
    expect(urls).not.toContain('https://webloomframework.com/docs/marketing-api-quick-start');

    for (const url of urls) {
      expect(url).toBe(url.trim());
      expect(url).not.toContain('%20');
      expect(() => new URL(url)).not.toThrow();
    }
  });
});
