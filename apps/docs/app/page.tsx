import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/theme-toggle';
import AnimatedFrameworks from '@/components/ui/animated-frameworks';

import type { Metadata } from 'next';

const GITHUB_URL = 'https://github.com/bretuobay/web-loom';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://webloom.dev';

export const metadata: Metadata = {
  title: {
    absolute: 'Web Loom — Framework-Agnostic MVVM Architecture',
  },
  description:
    'Framework-agnostic MVVM architecture for the modern web. 34 packages. One ViewModel — React, Vue, Angular, Lit, Marko, Svelte, React Native.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    title: 'Web Loom — Framework-Agnostic MVVM Architecture',
    description:
      'Framework-agnostic MVVM architecture for the modern web. 34 packages. One ViewModel — React, Vue, Angular, Lit, Marko, Svelte, React Native.',
  },
};

// ─── Spoke navigation cards ───────────────────────────────────────────────────

const spokes = [
  {
    title: 'Core Architecture',
    description: 'BaseModel, BaseViewModel, Commands — MVVM in plain TypeScript. No framework imports, fully testable.',
    href: '/docs/getting-started',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-400">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Signals Core',
    description: 'Zero-dependency reactive primitives. Push-based state without a virtual DOM or framework runtime.',
    href: '/docs/signals-core',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-400">
        <path d="M4 10 Q7 4 10 10 Q13 16 16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Query Core',
    description: 'Typed caching layer over fetch. Deduplication and stale-while-revalidate — no separate runtime.',
    href: '/docs/query-core',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-400">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Store Core',
    description: 'Minimal reactive store for UI-only state. localStorage adapter built in, no boilerplate.',
    href: '/docs/store-core',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-400">
        <ellipse cx="10" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 6v4c0 1.657 3.134 3 7 3s7-1.343 7-3V6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 10v4c0 1.657 3.134 3 7 3s7-1.343 7-3v-4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Event Bus Core',
    description: 'Typed pub/sub over EventTarget primitives. Decoupled cross-feature messaging with zero overhead.',
    href: '/docs/event-bus-core',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-400">
        <circle cx="4" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 10h3M13 5.5L9 9.5M13 14.5L9 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'UI Core',
    description: 'Headless accessibility behaviors for dialog, list, and form. Bring your own markup.',
    href: '/docs/ui-core',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-400">
        <rect x="3" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 17h6M10 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Design Core',
    description: 'Design tokens as CSS custom properties. Flat and paper themes included — no CSS-in-JS required.',
    href: '/docs/design-core',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-400">
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Package Roadmap',
    description: '10 packages published on npm. 24 more in active development across forms, media, i18n, and more.',
    href: '/docs/packages-roadmap',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-blue-400">
        <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// ─── Supported frameworks ─────────────────────────────────────────────────────

const frameworks = [
  { name: 'React',         href: '/docs/mvvm-react-use-case' },
  { name: 'Vue',           href: '/docs/mvvm-vue-use-case' },
  { name: 'Angular',       href: '/docs/mvvm-angular-use-case' },
  { name: 'Lit',           href: '/docs/mvvm-lit-use-case' },
  { name: 'Marko',         href: '/docs/mvvm-marko-use-case' },
  { name: 'Svelte',        href: '/docs/mvvm-svelte-use-case' },
  { name: 'Solid',         href: '/docs/mvvm-solid-use-case' },
  { name: 'Qwik',          href: '/docs/mvvm-qwik-use-case' },
  { name: 'React Native',  href: '/docs/mvvm-react-native-use-case' },
  { name: 'Vanilla TS',    href: '/docs/mvvm-vanilla-use-case' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Web Loom',
      description:
        'Framework-agnostic MVVM architecture for the modern web.',
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Web Loom',
      url: SITE_URL,
      sameAs: ['https://github.com/bretuobay/web-loom'],
    },
  ],
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-30">
        <div
          className="absolute inset-0 bg-white/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md -z-10"
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/images/webloom.png" width={30} height={30} alt="Web Loom" className="rounded" />
            <span className="text-sm font-[500] text-slate-800 dark:text-slate-100">
              Web<span className="text-blue-500 dark:text-blue-400">.loom</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/docs/getting-started"
              className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/blog"
              className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
            >
              Blog
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
              </svg>
              GitHub
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="grow">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative bg-slate-950 text-slate-100 pt-36 pb-24 overflow-hidden">
          {/* Ambient radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(0,191,255,0.13) 0%, transparent 70%)',
            }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            aria-hidden="true"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />

          <div className="relative max-w-4xl mx-auto px-6 text-center">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-10 rounded-full border border-slate-700/80 bg-slate-800/50 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />
              34 packages · 10 published on npm
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-[650] leading-[1.07] tracking-tight mb-6">
              Business logic that{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #00bfff 0%, #60a5fa 45%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                survives
              </span>
              <br />
              framework changes
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              MVVM is the architectural discipline. The browser is the platform.
              Web Loom packages give you clean, typed APIs over mature browser primitives —
              fetch, storage, routing, events — without heavy abstractions or framework lock-in.
              Your business logic runs anywhere.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 hover:bg-blue-400 text-slate-950 text-sm font-[500] transition-colors shadow-lg shadow-blue-500/20"
              >
                Get started
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 text-sm font-[500] transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
                </svg>
                View on GitHub
              </a>
            </div>

            {/* Framework pill row — animated to show swappability */}
            <AnimatedFrameworks frameworks={frameworks} />
          </div>
        </section>

        {/* ── Code showcase ───────────────────────────────────────────────── */}
        <section className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Copy */}
              <div>
                <p className="text-xs font-[500] uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3">
                  The pattern
                </p>
                <h2 className="text-2xl sm:text-3xl font-[650] text-slate-800 dark:text-slate-100 mb-4 leading-tight">
                  One ViewModel.<br />Every framework.
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  The ViewModel is plain TypeScript — no framework imports, no heavy runtime.
                  Infrastructure packages sit directly on mature browser APIs: <code className="text-blue-400 text-[11px]">fetch</code> for
                  HTTP, <code className="text-blue-400 text-[11px]">localStorage</code> for
                  persistence, <code className="text-blue-400 text-[11px]">History API</code> for
                  routing. Typed interfaces over what the platform already provides — not replacements for it.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    ['Model', 'owns data, calls browser APIs or your backend'],
                    ['ViewModel', 'derives displayable state, exposes Commands'],
                    ['View', 'subscribes and renders — the only framework-specific code'],
                  ].map(([label, desc]) => (
                    <li key={label} className="flex gap-3 text-sm">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 mt-[7px]" aria-hidden="true" />
                      <span>
                        <span className="text-slate-700 dark:text-slate-200 font-[500]">{label}</span>
                        <span className="text-slate-500 dark:text-slate-500"> — {desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/docs/core-concepts"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                >
                  Deep dive into core concepts
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              {/* Code block */}
              <div className="rounded-xl border border-slate-700/60 bg-slate-950 overflow-hidden font-mono text-[12.5px] leading-relaxed">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" aria-hidden="true" />
                  <span className="ml-2 text-xs text-slate-500">TaskListViewModel.ts</span>
                </div>
                <pre className="p-5 overflow-x-auto text-slate-300 whitespace-pre">
{`import { BaseViewModel, Command }
  from '@web-loom/mvvm-core';
import { map } from 'rxjs/operators';

export class TaskListViewModel
  extends BaseViewModel<TaskModel> {

  readonly fetchCommand =
    this.registerCommand(
      new Command(() => this.model.fetchAll())
    );

  readonly pendingCount$ =
    this.data$.pipe(
      map(tasks =>
        (tasks ?? []).filter(t => !t.done).length
      )
    );
}`}
                </pre>
                <div className="border-t border-slate-800 px-5 py-2.5 flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
                  Identical class in React, Vue, Angular, React Native
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Platform-first ──────────────────────────────────────────────── */}
        <section className="py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-[500] uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3">
                Platform-first
              </p>
              <h2 className="text-2xl sm:text-3xl font-[650] text-slate-800 dark:text-slate-100 mb-4 leading-tight">
                The browser has matured.
                <br />
                <span className="text-slate-500 dark:text-slate-400 font-[400]">Web Loom works with it, not around it.</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
                Every infrastructure package is a thin, typed wrapper over a stable browser primitive.
                No proprietary runtimes. No invented protocols. Full tree-shaking.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  api: 'fetch',
                  pkg: '@web-loom/http-core',
                  desc: 'Typed requests with interceptors and response mapping',
                },
                {
                  api: 'localStorage',
                  pkg: '@web-loom/storage-core',
                  desc: 'Versioned, typed persistence with session and memory adapters',
                },
                {
                  api: 'History API',
                  pkg: '@web-loom/router-core',
                  desc: 'Reactive navigation state over pushState and popstate',
                },
                {
                  api: 'EventTarget',
                  pkg: '@web-loom/event-emitter-core',
                  desc: 'Strongly typed event emitter with automatic disposal',
                },
              ].map(({ api, pkg, desc }) => (
                <div
                  key={pkg}
                  className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                      {api}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400 dark:text-slate-600 shrink-0" aria-hidden="true">
                      <path d="M2 6h8M6.5 3.5l3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[11px] font-mono text-blue-500 dark:text-blue-400 truncate">{pkg.replace('@web-loom/', '')}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hub & Spoke cards ────────────────────────────────────────────── */}
        <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-[500] uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3">
                Ecosystem
              </p>
              <h2 className="text-2xl sm:text-3xl font-[650] text-slate-800 dark:text-slate-100">
                Explore the packages
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {spokes.map((spoke) => (
                <Link
                  key={spoke.title}
                  href={spoke.href}
                  className="group flex flex-col gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-sm hover:shadow-blue-500/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                    {spoke.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-[500] text-slate-800 dark:text-slate-100 mb-1">
                      {spoke.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {spoke.description}
                    </p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 group-hover:gap-1.5 transition-all">
                    Read docs
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6h8M6.5 3.5l3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                View all documentation
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Framework compatibility ──────────────────────────────────────── */}
        <section className="py-20 border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="text-xs font-[500] uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3">
              Compatibility
            </p>
            <h2 className="text-2xl sm:text-3xl font-[650] text-slate-800 dark:text-slate-100 mb-4">
              Works with every major framework
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10 text-sm leading-relaxed">
              The ViewModel has no framework imports. Connecting it to a new framework means writing
              one thin subscription bridge — typically under 20 lines.
            </p>

            <AnimatedFrameworks frameworks={frameworks} variant="adaptive" />
          </div>
        </section>

        {/* ── About Festus Yeboah ──────────────────────────────────────────── */}
        <section className="py-20 bg-white dark:bg-slate-900">
          <div className="max-w-3xl mx-auto px-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
              <div
                className="h-px w-full"
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, #00bfff 35%, #818cf8 65%, transparent)',
                }}
              />
              <div className="p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* Avatar */}
                  <div
                    className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-[650] select-none"
                    style={{ background: 'linear-gradient(135deg, #00bfff 0%, #818cf8 100%)' }}
                    aria-hidden="true"
                  >
                    F
                  </div>

                  <div>
                    <p className="text-xs font-[500] uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">
                      The author
                    </p>
                    <h2 className="text-xl font-[650] text-slate-800 dark:text-slate-100 mb-0.5">
                      Festus Yeboah
                    </h2>
                    <p className="text-sm text-slate-400 mb-5">Framework Architect</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                      Festus is a frontend architect who has spent years watching teams rewrite the
                      same business logic every time the framework pendulum swings. Web Loom is his
                      attempt to give the web the same architectural continuity that Android, iOS,
                      and .NET have enjoyed for twenty years.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                      The project is open-source and driven by the conviction that the 80% of an
                      application that is not rendering code should be portable, testable, and immune
                      to framework churn.
                    </p>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
                      </svg>
                      Follow on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="bg-slate-950 py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-[650] text-slate-100 mb-4">
              Ready to stop rewriting?
            </h2>
            <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Install the core package and wire up your first ViewModel in minutes.
            </p>
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg bg-slate-800 border border-slate-700/80 font-mono text-sm text-slate-300 mb-8 select-all">
              <span className="text-slate-500 select-none">$</span>
              npm install @web-loom/mvvm-core rxjs
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 hover:bg-blue-400 text-slate-950 text-sm font-[500] transition-colors shadow-lg shadow-blue-500/20"
              >
                Read the docs
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 text-sm font-[500] transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
                </svg>
                Star on GitHub
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/images/webloom.png"
              width={22}
              height={22}
              alt="Web Loom"
              className="rounded opacity-60"
            />
            <span className="text-sm text-slate-500">
              Web<span className="text-slate-400">.loom</span>
              <span className="ml-2">— open source, MIT</span>
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-500" aria-label="Footer navigation">
            <Link href="/docs/getting-started" className="hover:text-slate-300 transition-colors">
              Docs
            </Link>
            <Link href="/blog" className="hover:text-slate-300 transition-colors">
              Blog
            </Link>
            <Link href="/docs/packages-roadmap" className="hover:text-slate-300 transition-colors">
              Roadmap
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>

    </div>
  );
}
