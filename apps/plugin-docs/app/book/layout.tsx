import Header from '@/components/ui/header';
import BookSidebar from '@/components/ui/book-sidebar';
import AppProvider from '@/app/app-provider';
import { getBookPages } from '@/components/mdx/utils';
import { BrandLayoutShell } from '@repo/docs-theme';

export default function BookLayout({ children }: { children: React.ReactNode }) {
  const chapters = getBookPages().map((chapter) => ({
    slug: chapter.slug,
    title: chapter.metadata.title,
    chapterNumber: chapter.chapterNumber,
    topic: chapter.topic,
  }));

  return (
    <AppProvider>
      <BrandLayoutShell header={<Header />} sidebar={<BookSidebar chapters={chapters} />}>
        {children}
      </BrandLayoutShell>
    </AppProvider>
  );
}
