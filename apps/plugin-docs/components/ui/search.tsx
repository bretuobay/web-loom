'use client';

import { BrandSearchTrigger } from '@repo/docs-theme';
import type { SearchEntry } from '@repo/docs-theme';

type SearchProps = {
  entries?: SearchEntry[];
  featuredHrefs?: string[];
  compact?: boolean;
  className?: string;
};

export default function Search({
  entries = [],
  featuredHrefs = [],
  compact = false,
  className = '',
}: SearchProps) {
  return (
    <BrandSearchTrigger
      entries={entries}
      featuredHrefs={featuredHrefs}
      compact={compact}
      className={className}
      browseLabel="Browse book chapters"
      placeholder="Search chapters…"
    />
  );
}
