'use client';

import { PageData } from '../lib/pages';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export function Sidebar({ isOpen, pages }: { isOpen: boolean; pages: PageData[] }) {
  return (
    <aside
      className={`absolute z-10 h-full w-300 flex-col border-r border-gray-200 bg-gray-50 p-4 pt-6 transition-transform dark:border-gray-800 dark:bg-gray-900 md:static md:flex md:flex-shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      <nav className="flex flex-col space-y-2">
        {pages.map((page) => (
          <Link
            key={page.slug}
            href={`/${page.slug}`}
            className="flex items-center space-x-2 rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FileText size={16} />
            <span>{page.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
