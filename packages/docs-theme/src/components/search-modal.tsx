'use client';

import Link from 'next/link';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { useMemo, useState } from 'react';
import type { SearchEntry } from '../types';

type SearchModalProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  entries: SearchEntry[];
  featuredHrefs?: string[];
  placeholder?: string;
  browseLabel?: string;
};

function DocIcon({ className }: { className: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.953 4.29a.5.5 0 0 0-.454-.292H6.14L6.984.62A.5.5 0 0 0 6.12.173l-6 7a.5.5 0 0 0 .379.825h5.359l-.844 3.38a.5.5 0 0 0 .864.445l6-7a.5.5 0 0 0 .075-.534Z" />
    </svg>
  );
}

export default function SearchModal({
  isOpen,
  setIsOpen,
  entries,
  featuredHrefs = [],
  placeholder = 'Search docs…',
  browseLabel = 'Browse docs',
}: SearchModalProps) {
  const [query, setQuery] = useState('');

  function close() {
    setIsOpen(false);
    setQuery('');
  }

  const featuredEntries = useMemo(() => {
    if (featuredHrefs.length === 0) return entries.slice(0, 8);
    const featuredSet = new Set(featuredHrefs);
    const featured = entries.filter((entry) => featuredSet.has(entry.href));
    return featured.length > 0 ? featured : entries.slice(0, 8);
  }, [entries, featuredHrefs]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.topic.toLowerCase().includes(q),
    );
  }, [entries, query]);

  const grouped = useMemo(() => {
    const groupedEntries = results ?? featuredEntries;
    const map = new Map<string, SearchEntry[]>();
    groupedEntries.forEach((entry) => {
      if (!map.has(entry.topic)) {
        map.set(entry.topic, []);
      }
      map.get(entry.topic)?.push(entry);
    });
    return map;
  }, [featuredEntries, results]);

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
          <form className="border-b border-slate-200 dark:border-slate-700" onSubmit={(event) => event.preventDefault()}>
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
                placeholder={placeholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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

          <div className="py-4 px-2 space-y-4">
            {results !== null && results.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 px-2 py-2">
                No results for{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">&quot;{query}&quot;</span>
              </p>
            ) : (
              <>
                {!results && (
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1">
                    {browseLabel}
                  </div>
                )}
                {Array.from(grouped.entries()).map(([topic, docs]) => (
                  <div key={topic}>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider px-2 mb-1">
                      {topic}
                    </div>
                    <ul>
                      {docs.map((doc) => (
                        <li key={doc.href}>
                          <Link
                            className="flex items-start px-2 py-2 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700/60 focus-within:bg-slate-100 dark:focus-within:bg-slate-700/60 outline-hidden group"
                            href={doc.href}
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
