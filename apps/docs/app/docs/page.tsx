import type { Metadata } from 'next';
import Link from 'next/link';
import { getDocPages } from '@/components/mdx/utils';
import Footer from '@/components/ui/footer';
import { absoluteUrl, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Web Loom documentation for framework-agnostic MVVM architecture, reactive primitives, framework integrations, and platform-first TypeScript packages.',
  alternates: { canonical: absoluteUrl('/docs') },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/docs'),
    title: 'Web Loom Documentation',
    description:
      'Guides and API concepts for framework-agnostic MVVM architecture, reactive primitives, and Web Loom packages.',
    siteName: 'Web Loom',
  },
};

const docGroups = [
  {
    title: 'Start here',
    description: 'Understand the architecture and scaffold your first Web Loom application.',
    slugs: ['getting-started', 'fundamentals', 'create-web-loom'],
  },
  {
    title: 'Architecture',
    description: 'Build portable Models and ViewModels with explicit lifecycle and interaction patterns.',
    slugs: ['core-concepts', 'models', 'viewmodels', 'mvvm-patterns'],
  },
  {
    title: 'Framework integrations',
    description: 'Connect the same framework-free ViewModels to every major rendering layer.',
    slugs: [
      'mvvm-react-use-case',
      'mvvm-vue-use-case',
      'mvvm-angular-use-case',
      'mvvm-vanilla-use-case',
      'mvvm-react-native-use-case',
      'mvvm-lit-use-case',
      'mvvm-marko-use-case',
      'mvvm-svelte-use-case',
      'mvvm-solid-use-case',
      'mvvm-qwik-use-case',
    ],
  },
  {
    title: 'Packages and patterns',
    description: 'Explore the typed primitives and headless behaviors that make up the Web Loom ecosystem.',
    slugs: [
      'mvvm-core',
      'signals-core',
      'store-core',
      'event-bus-core',
      'event-emitter-core',
      'query-core',
      'ui-core',
      'ui-patterns',
      'design-core',
      'packages-roadmap',
    ],
  },
] as const;

export default function DocsIndexPage() {
  const docPages = getDocPages();
  const pages = new Map(docPages.map((page) => [page.slug, page]));
  const groupedSlugs: string[] = docGroups.flatMap((group) => [...group.slugs]);
  const unlistedSlugs = docPages.map((page) => page.slug).filter((slug) => !groupedSlugs.includes(slug));
  const missingSlugs = groupedSlugs.filter((slug) => !pages.has(slug));

  if (unlistedSlugs.length || missingSlugs.length) {
    throw new Error(
      `Documentation hub is out of sync (unlisted: ${unlistedSlugs.join(', ') || 'none'}; missing: ${missingSlugs.join(', ') || 'none'})`,
    );
  }

  const canonical = absoluteUrl('/docs');

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Loom', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Documentation', item: canonical },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Web Loom Documentation',
    url: canonical,
    description: metadata.description,
    hasPart: docPages.map((page) => ({
      '@type': 'TechArticle',
      name: page.metadata.title,
      url: absoluteUrl(`/docs/${page.slug}`),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <header className="mb-12 max-w-3xl">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/" className="text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400">
            Home
          </Link>
          <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
            /
          </span>
          <span className="font-medium text-slate-800 dark:text-slate-200">Documentation</span>
        </div>
        <h1 className="mb-4 text-4xl font-[650] tracking-tight text-slate-900 dark:text-white">
          Web Loom documentation
        </h1>
        <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Learn the framework-agnostic MVVM architecture, connect it to your preferred view layer, and explore the
          platform-first packages that support production applications.
        </p>
      </header>

      <div className="space-y-12">
        {docGroups.map((group) => (
          <section key={group.title} aria-labelledby={`group-${group.title.toLowerCase().replaceAll(' ', '-')}`}>
            <div className="mb-5">
              <h2
                id={`group-${group.title.toLowerCase().replaceAll(' ', '-')}`}
                className="text-xl font-[650] text-slate-900 dark:text-slate-100"
              >
                {group.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.slugs.map((slug) => {
                const page = pages.get(slug)!;
                return (
                  <Link
                    key={slug}
                    href={`/docs/${slug}`}
                    className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-700"
                  >
                    <h3 className="font-[650] text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                      {page.metadata.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {page.metadata.summary}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </>
  );
}
