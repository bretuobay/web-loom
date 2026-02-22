'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

interface DocPage {
  title: string;
  summary: string;
  slug: string;
  topic: string;
}

const ALL_DOCS: DocPage[] = [
  {
    title: 'Getting Started',
    summary: 'What Web Loom is, why framework-agnostic architecture matters, and how to install the packages and build your first ViewModel in minutes.',
    slug: 'getting-started',
    topic: 'Getting Started',
  },
  {
    title: 'Architecture Fundamentals',
    summary: 'The core ideas behind Web Loom — why framework-agnostic architecture matters and how the MVVM pattern keeps business logic independent of the UI layer.',
    slug: 'fundamentals',
    topic: 'Getting Started',
  },
  {
    title: 'Core Concepts',
    summary: 'The foundational ideas behind MVVM Core — how Models, ViewModels, Commands, and the dispose pattern work together to produce a testable, framework-agnostic architecture.',
    slug: 'core-concepts',
    topic: 'MVVM Core',
  },
  {
    title: 'Models',
    summary: 'Deep dive into the Model layer — BaseModel, RestfulApiModel, QueryStateModel, and real-world implementations from the Web Loom example apps.',
    slug: 'models',
    topic: 'MVVM Core',
  },
  {
    title: 'ViewModels',
    summary: 'Deep dive into the ViewModel layer — BaseViewModel, Commands, RestfulApiViewModel, FormViewModel, QueryableCollectionViewModel, and real-world implementations.',
    slug: 'viewmodels',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM in React',
    summary: "How React's rendering model works, why RxJS observables need a bridge, and practical patterns for wiring ViewModels into React 19 components.",
    slug: 'mvvm-react-use-case',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM in Vue',
    summary: "How Vue 3's reactivity system works, why RxJS observables need a composable bridge, and practical patterns for wiring ViewModels into Vue components.",
    slug: 'mvvm-vue-use-case',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM in Angular',
    summary: "How Angular's Zone.js change detection works, why the async pipe is the natural bridge to RxJS observables, and practical patterns for wiring ViewModels into Angular components.",
    slug: 'mvvm-angular-use-case',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM in Vanilla TypeScript',
    summary: 'How to wire Web Loom ViewModels into a framework-free TypeScript app — manual DOM rendering, RxJS subscriptions, EJS templates, and imperative event listeners.',
    slug: 'mvvm-vanilla-use-case',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM Core',
    summary: 'A minimal MVVM framework for building reactive web applications.',
    slug: 'mvvm-core',
    topic: 'Published Packages',
  },
  {
    title: 'Store Core',
    summary: 'A minimal client state management library for building reactive web applications.',
    slug: 'store-core',
    topic: 'Published Packages',
  },
  {
    title: 'Signals Core',
    summary: 'Framework-agnostic reactive signals with computed values and effects.',
    slug: 'signals-core',
    topic: 'Published Packages',
  },
  {
    title: 'Event Bus Core',
    summary: 'A lightweight, framework-agnostic Event Bus library for decoupled communication in modern web applications.',
    slug: 'event-bus-core',
    topic: 'Published Packages',
  },
  {
    title: 'Query Core',
    summary: 'A minimal server state management library for managing asynchronous data fetching, caching, and state.',
    slug: 'query-core',
    topic: 'Published Packages',
  },
  {
    title: 'UI Core Behaviors',
    summary: 'Eight framework-agnostic headless UI behaviors — Dialog, Disclosure, Form, List Selection, Roving Focus, Keyboard Shortcuts, Undo/Redo, and Drag-and-Drop.',
    slug: 'ui-core',
    topic: 'Published Packages',
  },
  {
    title: 'UI Patterns',
    summary: 'Composed UI patterns built on Web Loom UI Core behaviors — Master-Detail, Wizard, Modal, Tabs, Sidebar, Toast Queue, Command Palette, Hub-and-Spoke, Grid Layout, and FAB.',
    slug: 'ui-patterns',
    topic: 'Published Packages',
  },
  {
    title: 'Design Core',
    summary: 'Framework-agnostic design tokens, CSS custom properties, dynamic theming, and a pre-built component library.',
    slug: 'design-core',
    topic: 'Published Packages',
  },
];

const FEATURED_SLUGS = ['getting-started', 'core-concepts', 'mvvm-core', 'signals-core', 'query-core', 'ui-core'];
const FEATURED_DOCS = ALL_DOCS.filter((d) => FEATURED_SLUGS.includes(d.slug));

interface SearchModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

function DocIcon({ className }: { className: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.953 4.29a.5.5 0 0 0-.454-.292H6.14L6.984.62A.5.5 0 0 0 6.12.173l-6 7a.5.5 0 0 0 .379.825h5.359l-.844 3.38a.5.5 0 0 0 .864.445l6-7a.5.5 0 0 0 .075-.534Z" />
    </svg>
  );
}

export default function SearchModal({ isOpen, setIsOpen }: SearchModalProps) {
  const [query, setQuery] = useState('');

  function close() {
    setIsOpen(false);
    setQuery('');
  }

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    return ALL_DOCS.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.topic.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const items = results ?? FEATURED_DOCS;
    const map = new Map<string, DocPage[]>();
    items.forEach((doc) => {
      if (!map.has(doc.topic)) map.set(doc.topic, []);
      map.get(doc.topic)!.push(doc);
    });
    return map;
  }, [results]);

  return (
    <Dialog as="div" open={isOpen} onClose={close}>
      <DialogBackdrop
        transition
        className="fixed inset-0 z-99999 bg-slate-900/30 transition-opacity duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 top-20 z-99999 mb-4 flex items-start justify-center overflow-hidden px-4 sm:px-6 md:top-28">
        <DialogPanel
          transition
          className="max-h-full w-full max-w-2xl overflow-auto rounded-xl bg-white dark:bg-slate-800 shadow-lg duration-300 ease-out data-closed:translate-y-4 data-closed:opacity-0"
        >
          {/* Search input */}
          <form className="border-b border-slate-200 dark:border-slate-700" onSubmit={(e) => e.preventDefault()}>
            <div className="flex items-center">
              <label htmlFor="search-modal">
                <span className="sr-only">Search</span>
                <svg
                  className="w-4 h-4 fill-slate-500 shrink-0 ml-4 dark:fill-slate-400"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="m14.707 13.293-1.414 1.414-2.4-2.4 1.414-1.414 2.4 2.4ZM6.8 12.6A5.8 5.8 0 1 1 6.8 1a5.8 5.8 0 0 1 0 11.6Zm0-2a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z" />
                </svg>
              </label>
              <input
                id="search-modal"
                data-autofocus
                className="text-sm w-full bg-white dark:bg-slate-800 dark:text-slate-200 border-0 focus:ring-transparent placeholder-slate-400 dark:placeholder:text-slate-500 appearance-none py-3 pl-2 pr-4"
                type="search"
                placeholder="Search docs…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="shrink-0 mr-3 text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  onClick={() => setQuery('')}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Results */}
          <div className="py-4 px-2 space-y-4">
            {results !== null && results.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 px-2 py-2">
                No results for{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">"{query}"</span>
              </p>
            ) : (
              <>
                {!results && (
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1">
                    Browse docs
                  </div>
                )}
                {Array.from(grouped.entries()).map(([topic, docs]) => (
                  <div key={topic}>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider px-2 mb-1">
                      {topic}
                    </div>
                    <ul>
                      {docs.map((doc) => (
                        <li key={doc.slug}>
                          <Link
                            className="flex items-start px-2 py-2 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700/60 focus-within:bg-slate-100 dark:focus-within:bg-slate-700/60 outline-hidden group"
                            href={`/docs/${doc.slug}`}
                            onClick={close}
                          >
                            <DocIcon className="w-3 h-3 fill-slate-400 dark:fill-slate-500 group-hover:fill-blue-500 dark:group-hover:fill-blue-400 shrink-0 mr-3 mt-1 transition-colors" />
                            <div>
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                                {doc.title}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-normal mt-0.5">
                                {doc.summary}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
