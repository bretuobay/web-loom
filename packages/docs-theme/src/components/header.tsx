'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SearchTrigger from './search-trigger';
import ThemeToggle from './theme-toggle';
import type { NavItem, SearchEntry } from '../types';

type HeaderProps = {
  logo: any;
  navItems: NavItem[];
  searchEntries: SearchEntry[];
  featuredSearchHrefs?: string[];
  cta?: NavItem;
  searchPlaceholder?: string;
  browseLabel?: string;
};

const navLinkClassName =
  'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200';

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  if (item.external) {
    return (
      <a
        href={item.href}
        className={navLinkClassName}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item.ariaLabel ?? item.label}
        onClick={onClick}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={navLinkClassName} onClick={onClick}>
      {item.label}
    </Link>
  );
}

export default function Header({
  logo,
  navItems,
  searchEntries,
  featuredSearchHrefs,
  cta,
  searchPlaceholder,
  browseLabel,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!mobileMenuRef.current) return;
      if (!mobileMenuOpen || mobileMenuRef.current.contains(target as Node)) return;
      setMobileMenuOpen(false);
    };

    const keyHandler = ({ key }: KeyboardEvent) => {
      if (key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('keydown', keyHandler);

    return () => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed w-full z-30">
      <div
        className="absolute inset-0 bg-white/70 border-b border-slate-200 backdrop-blur-sm -z-10 dark:bg-slate-900 dark:border-slate-800"
        aria-hidden="true"
      />

      <div ref={mobileMenuRef} className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center gap-2 md:h-20">
          {logo}

          <SearchTrigger
            entries={searchEntries}
            featuredHrefs={featuredSearchHrefs}
            className="hidden md:block"
            placeholder={searchPlaceholder}
            browseLabel={browseLabel}
          />

          <div className="ml-auto flex items-center gap-1 md:hidden">
            <SearchTrigger
              entries={searchEntries}
              featuredHrefs={featuredSearchHrefs}
              compact
              placeholder={searchPlaceholder}
              browseLabel={browseLabel}
            />
            <ThemeToggle className="ml-0" />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-header-nav"
              aria-label="Toggle site navigation"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
              </svg>
            </button>
          </div>

          <nav className="ml-auto hidden md:flex">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <NavLink item={item} />
                </li>
              ))}
              {cta && (
                <li className="ml-2">
                  <a
                    className="btn-sm inline-flex items-center gap-1.5 bg-blue-600 text-slate-100 shadow-xs hover:bg-blue-700"
                    href={cta.href}
                    target={cta.external ? '_blank' : undefined}
                    rel={cta.external ? 'noopener noreferrer' : undefined}
                    aria-label={cta.ariaLabel ?? cta.label}
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
                    </svg>
                    {cta.label}
                  </a>
                </li>
              )}
              <li>
                <ThemeToggle className="ml-3" />
              </li>
            </ul>
          </nav>
        </div>

        <div
          id="mobile-header-nav"
          className={`md:hidden overflow-hidden transition-all duration-200 ${
            mobileMenuOpen ? 'max-h-56 pb-3' : 'max-h-0'
          }`}
        >
          <nav className="rounded-lg border border-slate-200 bg-white p-2 shadow-xs dark:border-slate-700 dark:bg-slate-900">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <NavLink item={item} onClick={() => setMobileMenuOpen(false)} />
                </li>
              ))}
              {cta && (
                <li>
                  <a
                    className={navLinkClassName}
                    href={cta.href}
                    target={cta.external ? '_blank' : undefined}
                    rel={cta.external ? 'noopener noreferrer' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {cta.label}
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
