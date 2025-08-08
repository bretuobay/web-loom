"use client";

import { Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "next-themes";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { setTheme, theme } = useTheme();

  return (
    <header className="z-20 flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center space-x-4">
        <button onClick={onMenuClick} className="md:hidden">
          <Menu />
        </button>
        <h1 className="text-lg font-semibold">MVVM Framework Docs</h1>
      </div>
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Sun className="hidden dark:block" />
        <Moon className="dark:hidden" />
      </button>
    </header>
  );
}
