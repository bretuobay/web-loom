import type { MetadataRoute } from 'next';
import { getDocPages } from '@/components/mdx/utils';
import { getBlogPages } from '@/components/mdx/utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://webloom.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const docPages = getDocPages().map((page) => ({
    url: `${SITE_URL}/docs/${page.slug}`,
    lastModified: page.metadata.updatedAt
      ? new Date(page.metadata.updatedAt)
      : now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const blogPages = getBlogPages().map((page) => ({
    url: `${SITE_URL}/blog/${page.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...docPages,
    ...blogPages,
  ];
}
