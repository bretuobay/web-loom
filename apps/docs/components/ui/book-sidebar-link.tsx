'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppProvider } from '@/app/app-provider';

interface BookSidebarLinkProps {
  children: React.ReactNode;
  href: string;
}

export default function BookSidebarLink({ children, href }: BookSidebarLinkProps) {
  const pathname = usePathname();
  const { setSidebarOpen } = useAppProvider();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-start text-sm leading-snug transition-colors py-0.5 ${
        isActive
          ? 'text-blue-600 dark:text-blue-400 font-[650]'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </Link>
  );
}
