'use client';

import { useRef, useEffect } from 'react';
import { useAppProvider } from '@/app/app-provider';
import BookSidebarLink from './book-sidebar-link';

type Chapter = { slug: string; number: number; title: string; section: string };

type Props = { chapters: Chapter[] };

function groupBySection(chapters: Chapter[]): { section: string; chapters: Chapter[] }[] {
  const groups: { section: string; chapters: Chapter[] }[] = [];
  const seen = new Map<string, Chapter[]>();
  for (const ch of chapters) {
    if (!seen.has(ch.section)) {
      const group: Chapter[] = [];
      seen.set(ch.section, group);
      groups.push({ section: ch.section, chapters: group });
    }
    seen.get(ch.section)!.push(ch);
  }
  return groups;
}

export default function BookSidebar({ chapters }: Props) {
  const sidebar = useRef<HTMLDivElement>(null);
  const { sidebarOpen, setSidebarOpen } = useAppProvider();
  const groups = groupBySection(chapters);

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
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-slate-900/20 z-10 transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
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
            <nav aria-label="Book chapters">
              <p className="text-xs font-[650] uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-5">
                MVVM in Practice
              </p>

              <div className="space-y-6">
                {groups.map(({ section, chapters: groupChapters }) => (
                  <div key={section}>
                    <p className="text-xs font-[650] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                      {section}
                    </p>
                    <ul className="space-y-1">
                      {groupChapters.map((ch) => (
                        <li key={ch.slug}>
                          <BookSidebarLink href={`/book/${ch.slug}`}>
                            <span className="shrink-0 font-mono text-slate-400 dark:text-slate-500 mr-2 text-xs">
                              {String(ch.number).padStart(2, '0')}
                            </span>
                            <span className="min-w-0">{ch.title}</span>
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
