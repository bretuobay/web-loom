'use client';

import { PageData } from '../lib/pages';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar({ isOpen, pages }: { isOpen: boolean; pages: PageData[] }) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 z-20 h-full w-[280px] flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 pt-16 transition-transform md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full overflow-y-auto pb-10">
        <nav className="flex flex-col space-y-1 p-4">
          {pages.map((page) => {
            const isActive = pathname === `/${page.slug}`;
            return (
              <Link
                key={page.slug}
                href={`/${page.slug}`}
                className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <FileText size={16} />
                <span>{page.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
