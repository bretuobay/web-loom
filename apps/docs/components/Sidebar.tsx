import { getPages } from "../lib/pages";
import { FileText } from "lucide-react";
import Link from "next/link";

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pages = getPages();

  return (
    <aside
      className={`absolute z-10 h-full w-64 flex-col border-r bg-white p-4 transition-transform dark:bg-gray-950 md:static md:flex ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      <nav className="flex flex-col space-y-2">
        {pages.map((page) => (
          <Link
            key={page.slug}
            href={`/${page.slug}`}
            className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <FileText size={16} />
            <span>{page.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
