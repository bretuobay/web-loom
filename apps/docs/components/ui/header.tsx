import Logo from '@/components/ui/logo';
import ThemeToggle from './theme-toggle';
import Search from './search';

export default function Header() {
  return (
    <header className="fixed w-full z-30">
      <div
        className="absolute inset-0 bg-white/70 border-b border-slate-200 backdrop-blur-sm -z-10 dark:bg-slate-900 dark:border-slate-800"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Site branding */}
          <div className="grow">
            <div className="flex items-center">
              <Logo />
              <Search />
            </div>
          </div>

          {/* Desktop navigation */}
          <nav className="flex">
            {/* Right side elements links */}
            <ul className="flex grow justify-end flex-wrap items-center">
              <li className="ml-4">
                <a
                  className="btn-sm inline-flex items-center gap-1.5 text-slate-100 bg-blue-600 hover:bg-blue-700 shadow-xs"
                  href="https://github.com/bretuobay/web-loom"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View Web Loom on GitHub"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
                  </svg>
                  GitHub
                </a>
              </li>
              {/* Lights switch */}
              <li>
                <ThemeToggle />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
