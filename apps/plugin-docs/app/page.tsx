import Link from 'next/link';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Header />

      <main className="grow">
        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50 pt-32 pb-20 dark:border-slate-800 dark:bg-slate-950">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 75% 45% at 50% 0%, rgba(0,191,255,0.12) 0%, transparent 70%)',
            }}
          />

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <p className="mb-4 text-xs font-[650] uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Plugin Architecture Book
            </p>
            <h1 className="max-w-3xl text-4xl font-[650] leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
              Build extensible systems in TypeScript without framework lock-in.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
              This site hosts the complete Plugin Architecture book. It explains the foundations,
              implementation patterns, security model, and production rollout strategies for building
              plugin-based platforms that scale.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="btn inline-flex items-center bg-blue-600 text-slate-100 shadow-xs hover:bg-blue-700"
              >
                Start Reading
              </Link>
              <Link
                href="/book/00-table-of-contents"
                className="btn inline-flex items-center border border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
              >
                View Table of Contents
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 py-16 dark:border-slate-800">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-[650] text-slate-900 dark:text-slate-100">What You Learn</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Plugin contracts, lifecycle management, SDK design, dynamic loading, event-driven
                communication, and multi-framework compatibility.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-[650] text-slate-900 dark:text-slate-100">Who It&apos;s For</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Engineers, architects, and technical leads designing extensible products such as
                e-commerce, CMS, analytics, and admin platforms.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-[650] text-slate-900 dark:text-slate-100">What You Get</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Practical chapter-by-chapter guidance, real implementation patterns, and production
                checklists you can apply directly to your system.
              </p>
            </article>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-2xl font-[650] text-slate-900 dark:text-slate-100">
                Read from foundations to deployment.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Chapters are organized progressively so you can start with principles and move into
                architecture, testing, security, optimization, and release strategy.
              </p>
              <div className="mt-6">
                <Link
                  href="/book/01-foundations-of-plugin-architecture"
                  className="btn-sm inline-flex items-center bg-blue-600 text-slate-100 shadow-xs hover:bg-blue-700"
                >
                  Open Chapter 1
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
        <Footer />
      </div>
    </div>
  );
}
