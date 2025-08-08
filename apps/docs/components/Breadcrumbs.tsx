"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav className="mb-4 flex items-center space-x-2 text-sm text-gray-500">
      <Link href="/" className="hover:underline">
        Home
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const capitalizedSegment = segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <div key={href} className="flex items-center space-x-2">
            <ChevronRight size={16} />
            {isLast ? (
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {capitalizedSegment}
              </span>
            ) : (
              <Link href={href} className="hover:underline">
                {capitalizedSegment}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
