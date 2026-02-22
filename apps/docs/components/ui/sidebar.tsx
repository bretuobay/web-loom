'use client';

import { useRef, useEffect } from 'react';
import { useAppProvider } from '@/app/app-provider';
import SidebarLink from './sidebar-link';

export default function SupportSidebar() {
  const sidebar = useRef<HTMLDivElement>(null);
  const { sidebarOpen, setSidebarOpen } = useAppProvider();

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: { target: EventTarget | null }): void => {
      if (!sidebar.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: { keyCode: number }): void => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  return (
    <div>
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-slate-900/20 z-10 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        ref={sidebar}
        id="sidebar"
        className={`fixed left-0 top-0 bottom-0 w-64 h-screen border-r border-slate-200 md:left-auto md:shrink-0 z-10 dark:border-slate-800 dark:bg-slate-900 transform transition-transform ease-out duration-200 ${sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full max-md:opacity-0'}`}
      >
        {/* Gradient bg displaying on light layout only */}
        <div
          className="absolute inset-0 -left-[9999px] bg-linear-to-b from-slate-50 to-white pointer-events-none -z-10 dark:hidden"
          aria-hidden="true"
        ></div>

        <div className="fixed top-0 bottom-0 w-64 px-4 sm:px-6 md:pl-0 md:pr-8 overflow-y-auto no-scrollbar">
          <div className="pt-24 md:pt-28 pb-8">
            <nav className="md:block">
              <ul className="text-sm space-y-2">
                <li>
                  <SidebarLink href="/docs/fundamentals">Architecture Fundamentals</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/getting-started">Getting Started</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/core-concepts">Core Concepts</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/models">Models</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/viewmodels">ViewModels</SidebarLink>
                </li>
                <li className="pt-4">
                  <SidebarLink href="/docs/mvvm-react-use-case">MVVM in React</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/mvvm-vue-use-case">MVVM in Vue</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/mvvm-angular-use-case">MVVM in Angular</SidebarLink>
                </li>
                <li className="pt-4">
                  <SidebarLink href="/docs/store-core">Store Core</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/signals-core">Signals Core</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/event-bus-core">Event Bus Core</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/query-core">Query Core</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/ui-core">UI Core Behaviors</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/ui-patterns">UI Patterns</SidebarLink>
                </li>
                <li>
                  <SidebarLink href="/docs/design-core">Design Core</SidebarLink>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </aside>
    </div>
  );
}
