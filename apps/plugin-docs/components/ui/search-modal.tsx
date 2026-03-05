'use client';

import { BrandSearchModal } from '@repo/docs-theme';
import type { SearchEntry } from '@repo/docs-theme';

interface SearchModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  entries?: SearchEntry[];
  featuredHrefs?: string[];
}

export default function SearchModal({
  isOpen,
  setIsOpen,
  entries = [],
  featuredHrefs = [],
}: SearchModalProps) {
  return (
    <BrandSearchModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      entries={entries}
      featuredHrefs={featuredHrefs}
      browseLabel="Browse book chapters"
      placeholder="Search chapters…"
    />
  );
}
