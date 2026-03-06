'use client';

import { BrandSearchTrigger } from '@repo/docs-theme';
import { DOCS_SEARCH_ENTRIES, DOCS_SEARCH_FEATURED_HREFS } from './search-data';

type SearchProps = {
  compact?: boolean;
  className?: string;
};

export default function Search({ compact = false, className = '' }: SearchProps) {
  return (
    <BrandSearchTrigger
      entries={DOCS_SEARCH_ENTRIES}
      featuredHrefs={DOCS_SEARCH_FEATURED_HREFS}
      compact={compact}
      className={className}
      browseLabel="Browse docs"
      placeholder="Search docs…"
    />
  );
}
