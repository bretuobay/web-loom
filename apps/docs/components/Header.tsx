"use client";

import { Sun, Moon, Menu, Search } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { setTheme, theme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <button onClick={onMenuClick} className="md:hidden">
            <Menu />
          </button>
          <Link href="/" className="text-lg font-bold">
            MVVM Docs
          </Link>
        </div>

        {/* Placeholder for desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/getting-started" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Docs</Link>
          <Link href="/api-reference" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">API</Link>
          <Link href="/examples" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Examples</Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Search size={20} />
          </button>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
}
