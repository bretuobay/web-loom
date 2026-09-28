import type { MetadataRoute } from 'next';
import { getBlogPages, getBookPages, getDocPages } from '@/components/mdx/utils';
import { absoluteUrl, SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const docPages = getDocPages().map((page) => ({
    url: absoluteUrl(`/docs/${page.slug}`),
    lastModified: page.metadata.updatedAt ?? page.metadata.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const blogPages = getBlogPages().map((page) => ({
    url: absoluteUrl(`/blog/${page.slug}`),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const bookPages = getBookPages().map((page) => ({
    url: absoluteUrl(`/book/${page.slug}`),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: absoluteUrl('/docs'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...docPages,
    {
      url: absoluteUrl('/blog'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogPages,
    {
      url: absoluteUrl('/book'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...bookPages,
  ];
}
