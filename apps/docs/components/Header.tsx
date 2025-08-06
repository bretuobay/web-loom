"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
  const { setTheme, theme } = useTheme();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b px-4">
      <div>
        <h1 className="text-lg font-semibold">MVVM Framework Docs</h1>
      </div>
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-800"
      >
        <Sun className="hidden dark:block" />
        <Moon className="dark:hidden" />
      </button>
    </header>
  );
}
