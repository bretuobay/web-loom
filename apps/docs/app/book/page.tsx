import type { Metadata } from 'next';
import Link from 'next/link';
import { getBookPages, type BookPage } from '@/components/mdx/utils';
import Footer from '@/components/ui/footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://webloomframework.com';

export const metadata: Metadata = {
  title: 'MVVM in Practice — Book',
  description:
    'A practical, code-first guide to Model-View-ViewModel architecture for modern frontend development — framework-agnostic patterns that survive React, Vue, and Angular.',
  alternates: { canonical: `${SITE_URL}/book` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/book`,
    title: 'MVVM in Practice',
    description:
      'A practical, code-first guide to Model-View-ViewModel architecture for modern frontend development.',
    siteName: 'Web Loom',
  },
};

function groupBySection(pages: BookPage[]): { section: string; chapters: BookPage[] }[] {
  const groups: { section: string; chapters: BookPage[] }[] = [];
  const seen = new Map<string, BookPage[]>();
  for (const p of pages) {
    if (!seen.has(p.section)) {
      const group: BookPage[] = [];
      seen.set(p.section, group);
      groups.push({ section: p.section, chapters: group });
    }
    seen.get(p.section)!.push(p);
  }
  return groups;
}

export default function BookIndex() {
  const pages = getBookPages();
  const groups = groupBySection(pages);

  return (
    <>
      {/* Page hero */}
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Link
            href="/"
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Home
          </Link>
          <svg className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-slate-800 dark:text-slate-200 font-medium">Book</span>
        </div>

        <h1 className="text-3xl font-[650] text-slate-800 dark:text-slate-200 mb-3">MVVM in Practice</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          A practical, code-first guide to Model-View-ViewModel architecture for modern frontend
          development — framework-agnostic patterns that survive React, Vue, and Angular.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href={`/book/${pages[0]?.slug ?? 'chapter1'}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-[650] hover:bg-blue-700 transition-colors"
          >
            Start reading
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-sm text-slate-500 dark:text-slate-400">{pages.length} chapters</span>
        </div>
      </header>

      {/* Table of contents by section */}
      <div className="space-y-10">
        {groups.map(({ section, chapters }) => (
          <div key={section}>
            <h2 className="text-xs font-[650] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              {section}
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {chapters.map((ch) => (
                <Link
                  key={ch.slug}
                  href={`/book/${ch.slug}`}
                  className="group flex items-center gap-4 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 -mx-4 px-4 rounded-lg transition-colors"
                >
                  <div className="shrink-0 w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-[650] text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {String(ch.number).padStart(2, '0')}
                  </div>
                  <span className="flex-1 text-sm font-[650] text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {ch.title}
                  </span>
                  <svg
                    className="shrink-0 w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </>
  );
}
