// Client-safe types and interfaces for pages
import type { PageData } from './pages-server';

export type { PageData };

// This file no longer uses fs - data is passed from server components
export function formatPageData(pages: PageData[]): PageData[] {
  return pages.map((page) => ({
    ...page,
    title: page.title || page.slug,
  }));
}
