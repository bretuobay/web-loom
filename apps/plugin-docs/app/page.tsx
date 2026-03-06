import Link from 'next/link';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Header />

      <main className="grow">
        {/* Hero */}
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
              By Festus Yeboah
            </p>
            <h1 className="max-w-3xl text-4xl font-[650] leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
              Building Extensible Web Applications
            </h1>
            <p className="mt-3 text-lg font-[500] text-slate-500 dark:text-slate-400">
              A Complete Guide to TypeScript Plugin Architecture
            </p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Fifteen chapters and a full reference appendix on designing plugin-based platforms
              that scale — from core contracts and lifecycle management through security,
              testing, real-world domain patterns, performance optimisation, and production
              distribution. Patterns drawn from VS Code, Vite, Backstage, Kibana, Vendure,
              TinaCMS, and more.
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

        {/* Cards */}
        <section className="border-b border-slate-200 py-16 dark:border-slate-800">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-[650] text-slate-900 dark:text-slate-100">What You Learn</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Plugin contracts and lifecycle, SDK design, dynamic loading, event-driven
                communication, sandboxing and security, testing strategies, e-commerce and CMS
                plugin patterns, dashboard analytics, performance optimisation, and deployment
                and distribution pipelines.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-[650] text-slate-900 dark:text-slate-100">Who It&apos;s For</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Engineers, architects, and technical leads designing extensible platforms —
                admin dashboards, e-commerce engines, CMS systems, analytics tools — where
                the core product must grow without being rewritten.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-[650] text-slate-900 dark:text-slate-100">What You Get</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                15 chapters across 5 parts, a complete TypeScript type reference, React, Vue,
                Angular, and Vanilla JS plugin examples, build configurations, a security
                checklist, and performance benchmarking guidance.
              </p>
            </article>
          </div>
        </section>

        {/* Chapter parts overview */}
        <section className="border-b border-slate-200 py-16 dark:border-slate-800">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-[650] text-slate-900 dark:text-slate-100">Five parts. One coherent system.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Chapters progress from first principles to production deployment, so you can read
              front to back or jump to the part that matches where you are right now.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { part: 'Part I', title: 'Foundations and Theory', chapters: 'Ch. 1–4', desc: 'What plugin architecture is, TypeScript fundamentals, framework-agnostic design, and core contracts.' },
                { part: 'Part II', title: 'Implementation and Architecture', chapters: 'Ch. 5–8', desc: 'Registry design, dynamic loading, SDK API design, and event-driven inter-plugin communication.' },
                { part: 'Part III', title: 'Security, Testing, and Best Practices', chapters: 'Ch. 9–10', desc: 'Sandboxing, permission models, CSP, and a full testing strategy from unit to end-to-end.' },
                { part: 'Part IV', title: 'Real-World Applications', chapters: 'Ch. 11–13', desc: 'Plugin patterns for e-commerce platforms, CMS systems, and dashboard analytics ecosystems.' },
                { part: 'Part V', title: 'Production and Optimisation', chapters: 'Ch. 14–15', desc: 'Bundle performance, lazy loading, and production distribution, versioning, and rollback strategies.' },
                { part: 'Appendices', title: 'Reference Material', chapters: 'A–E', desc: 'Full TypeScript type definitions, cross-framework examples, build configs, and security and performance checklists.' },
              ].map(({ part, title, chapters, desc }) => (
                <div
                  key={part}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-xs font-[650] uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    {part} · {chapters}
                  </p>
                  <h3 className="mt-1 text-sm font-[650] text-slate-900 dark:text-slate-100">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-[650] uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Foreword by Evans Boateng Owusu, Software Architect
              </p>
              <h2 className="mt-3 text-2xl font-[650] text-slate-900 dark:text-slate-100">
                Read from foundations to deployment.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Start at Chapter 1 for the full journey, or use the table of contents to jump
                directly to the topic you need.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/book/01-foundations-of-plugin-architecture"
                  className="btn-sm inline-flex items-center bg-blue-600 text-slate-100 shadow-xs hover:bg-blue-700"
                >
                  Open Chapter 1
                </Link>
                <Link
                  href="/book/00-foreword"
                  className="btn-sm inline-flex items-center border border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
                >
                  Read the Foreword
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
