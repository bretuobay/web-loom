'use client';

import { BrandSearchModal } from '@repo/docs-theme';
import { DOCS_SEARCH_ENTRIES, DOCS_SEARCH_FEATURED_HREFS } from './search-data';

interface SearchModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function SearchModal({ isOpen, setIsOpen }: SearchModalProps) {
  return (
    <BrandSearchModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      entries={DOCS_SEARCH_ENTRIES}
      featuredHrefs={DOCS_SEARCH_FEATURED_HREFS}
      browseLabel="Browse docs"
      placeholder="Search docs…"
    />
  );
}
