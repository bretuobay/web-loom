import { BrandHeader } from '@repo/docs-theme';
import type { NavItem } from '@repo/docs-theme';
import Logo from './logo';
import { DOCS_SEARCH_ENTRIES, DOCS_SEARCH_FEATURED_HREFS } from './search-data';

const NAV_ITEMS: NavItem[] = [
  { label: 'Docs', href: '/docs/getting-started' },
  { label: 'Blog', href: '/blog' },
  { label: 'Book', href: '/book' },
];

export default function Header() {
  return (
    <BrandHeader
      logo={<Logo />}
      navItems={NAV_ITEMS}
      searchEntries={DOCS_SEARCH_ENTRIES}
      featuredSearchHrefs={DOCS_SEARCH_FEATURED_HREFS}
      cta={{ label: 'GitHub', href: 'https://github.com/bretuobay/web-loom', external: true }}
      browseLabel="Browse docs"
      searchPlaceholder="Search docs…"
    />
  );
}
