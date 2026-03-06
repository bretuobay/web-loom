import { BrandHeader } from '@repo/docs-theme';
import type { NavItem } from '@repo/docs-theme';
import Logo from './logo';
import { getBookSearchEntries } from '@/components/mdx/utils';

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Book', href: '/book' },
];

export default function Header() {
  const searchEntries = getBookSearchEntries();
  const featuredSearchHrefs = searchEntries.slice(0, 6).map((entry) => entry.href);

  return (
    <BrandHeader
      logo={<Logo />}
      navItems={NAV_ITEMS}
      searchEntries={searchEntries}
      featuredSearchHrefs={featuredSearchHrefs}
      cta={{ label: 'GitHub', href: 'https://github.com/bretuobay/web-loom', external: true }}
      browseLabel="Browse book chapters"
      searchPlaceholder="Search chapters…"
    />
  );
}
