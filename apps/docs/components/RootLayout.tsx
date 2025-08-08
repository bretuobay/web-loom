'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { PageData } from '../lib/pages';

export function RootLayout({ children, pages }: { children: React.ReactNode; pages: PageData[] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-950">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} pages={pages} />
        <main className="flex-1 overflow-y-auto bg-white p-6 dark:bg-gray-950">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
