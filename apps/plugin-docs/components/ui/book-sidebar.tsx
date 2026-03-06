'use client';

import { useEffect, useRef } from 'react';
import { useAppProvider } from '@/app/app-provider';
import BookSidebarLink from './book-sidebar-link';

type Chapter = {
  slug: string;
  title: string;
  chapterNumber: number;
  topic: string;
};

type Props = {
  chapters: Chapter[];
};

function groupByTopic(chapters: Chapter[]) {
  const groups: { topic: string; chapters: Chapter[] }[] = [];
  const seen = new Map<string, Chapter[]>();

  for (const chapter of chapters) {
    if (!seen.has(chapter.topic)) {
      const bucket: Chapter[] = [];
      seen.set(chapter.topic, bucket);
      groups.push({ topic: chapter.topic, chapters: bucket });
    }
    seen.get(chapter.topic)?.push(chapter);
  }

  return groups;
}

export default function BookSidebar({ chapters }: Props) {
  const sidebar = useRef<HTMLDivElement>(null);
  const { sidebarOpen, setSidebarOpen } = useAppProvider();
  const groups = groupByTopic(chapters);

  useEffect(() => {
    const handler = ({ target }: { target: EventTarget | null }) => {
      if (!sidebar.current || !sidebarOpen || sidebar.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  });

  useEffect(() => {
    const handler = ({ keyCode }: { keyCode: number }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  return (
    <div>
      <div
        className={`md:hidden fixed inset-0 bg-slate-900/20 z-10 transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <aside
        ref={sidebar}
        id="sidebar"
        className={`fixed left-0 top-0 bottom-0 w-64 h-screen border-r border-slate-200 md:left-auto md:shrink-0 z-10 dark:border-slate-800 dark:bg-slate-900 transform transition-transform ease-out duration-200 ${
          sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full max-md:opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 -left-[9999px] bg-linear-to-b from-slate-50 to-white pointer-events-none -z-10 dark:hidden"
          aria-hidden="true"
        />

        <div className="fixed top-0 bottom-0 w-64 px-4 sm:px-6 md:pl-0 md:pr-8 overflow-y-auto no-scrollbar">
          <div className="pt-24 md:pt-28 pb-8">
            <nav aria-label="Plugin architecture book chapters">
              <p className="text-xs font-[650] uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-5">
                Plugin Architecture Book
              </p>

              <div className="space-y-6">
                {groups.map(({ topic, chapters: topicChapters }) => (
                  <div key={topic}>
                    <p className="text-xs font-[650] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                      {topic}
                    </p>
                    <ul className="space-y-1">
                      {topicChapters.map((chapter) => (
                        <li key={chapter.slug}>
                          <BookSidebarLink href={`/book/${chapter.slug}`}>
                            <span className="shrink-0 font-mono text-slate-400 dark:text-slate-500 mr-2 text-xs">
                              {String(chapter.chapterNumber).padStart(2, '0')}
                            </span>
                            <span className="min-w-0">{chapter.title}</span>
                          </BookSidebarLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </aside>
    </div>
  );
}
