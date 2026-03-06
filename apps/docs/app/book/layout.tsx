import Header from '@/components/ui/header';
import BookSidebar from '@/components/ui/book-sidebar';
import AppProvider from '@/app/app-provider';
import { getBookPages } from '@/components/mdx/utils';
import { BrandLayoutShell } from '@repo/docs-theme';

export default function BookLayout({ children }: { children: React.ReactNode }) {
  const chapters = getBookPages().map(({ slug, number, title, section }) => ({
    slug,
    number,
    title,
    section,
  }));

  return (
    <AppProvider>
      <BrandLayoutShell header={<Header />} sidebar={<BookSidebar chapters={chapters} />}>
        {children}
      </BrandLayoutShell>
    </AppProvider>
  );
}
