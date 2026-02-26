import Header from '@/components/ui/header';
import BookSidebar from '@/components/ui/book-sidebar';
import AppProvider from '@/app/app-provider';
import { getBookPages } from '@/components/mdx/utils';

export default function BookLayout({ children }: { children: React.ReactNode }) {
  const chapters = getBookPages().map(({ slug, number, title, section }) => ({
    slug,
    number,
    title,
    section,
  }));

  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="grow">
          <section className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div>
                <BookSidebar chapters={chapters} />
                <div className="md:grow md:pl-64 lg:pr-6 xl:pr-0">
                  <div className="pt-20 md:pt-24 pb-8 md:pl-6 lg:pl-12">{children}</div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AppProvider>
  );
}
