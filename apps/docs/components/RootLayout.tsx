'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { PageData } from '../lib/pages';
import { TableOfContents } from './TableOfContents';

export function RootLayout({ children, pages }: { children: React.ReactNode; pages: PageData[] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="pt-16">
        <Sidebar isOpen={isSidebarOpen} pages={pages} />
        <div className="md:pl-[280px]">
          <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[1fr_240px] lg:gap-8">
            <main className="min-w-0 py-10 px-6">
              <Breadcrumbs />
              <div className="mt-4">
                {children}
              </div>
            </main>
            <aside className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] py-10 px-6">
              <TableOfContents />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
