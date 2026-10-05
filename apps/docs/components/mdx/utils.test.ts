import { describe, expect, it } from 'vitest';
import { BLOG_SERIES, getBlogPages, getBlogSeries, getBookPages } from './utils';

describe('blog series', () => {
  it('assigns every post to a known series, ordered by part within each series', () => {
    for (const series of getBlogSeries()) {
      expect(BLOG_SERIES[series.id]).toBeDefined();
      const parts = series.posts.map((post) => post.number);
      expect(parts).toEqual([...parts].sort((a, b) => a - b));
    }
  });

  it('reads series, part and summary from frontmatter', () => {
    const intro = getBlogSeries().find((series) => series.id === 'introducing-web-loom');
    expect(intro?.posts.map((post) => post.number)).toEqual([1, 2, 3, 4]);
    expect(intro?.posts[0]).toMatchObject({
      slug: 'a-playground-that-grew-into-a-framework',
      title: 'Web Loom: A Playground That Grew Into a Framework',
    });
    expect(intro?.posts[0].summary).toMatch(/^How an old C# pattern/);
    expect(intro?.posts[0].content).not.toMatch(/^---/);
  });

  it('keeps posts without frontmatter in the package deep-dive series', () => {
    const post = getBlogPages().find((p) => p.slug === '01-mvvm-core');
    expect(post).toMatchObject({ series: 'package-deep-dives', number: 1, packageName: '@web-loom/mvvm-core' });
  });
});

describe('book frontmatter', () => {
  it('still reads chapter titles and sections', () => {
    const [first] = getBookPages();
    expect(first).toMatchObject({ slug: 'chapter1', title: 'The Frontend Architecture Crisis' });
    expect(first.section).not.toBe('Uncategorized');
    expect(first.content.startsWith('---')).toBe(false);
  });
});
