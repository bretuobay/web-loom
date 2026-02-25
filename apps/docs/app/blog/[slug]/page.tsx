import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPages } from '@/components/mdx/utils';
import { CustomMDX } from '@/components/mdx/mdx';
import Footer from '@/components/ui/footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://webloomframework.com';

export async function generateStaticParams() {
  return getBlogPages().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata | undefined> {
  const { slug } = await props.params;
  const post = getBlogPages().find((p) => p.slug === slug);
  if (!post) return;

  const canonical = `${SITE_URL}/blog/${slug}`;

  return {
    // Use absolute to avoid double-appending "— Web Loom" from the template
    title: { absolute: `${post.title} — Web Loom Blog` },
    description: post.summary,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: post.title,
      description: post.summary,
      siteName: 'Web Loom',
      section: post.packageName ?? 'Web Loom Blog',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
    },
  };
}

export default async function BlogPost(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const posts = getBlogPages();
  const index = posts.findIndex((p) => p.slug === slug);

  if (index === -1) notFound();

  const post = posts[index];
  const prev = index > 0 ? posts[index - 1] : null;
  const next = index < posts.length - 1 ? posts[index + 1] : null;
  const canonical = `${SITE_URL}/blog/${slug}`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Loom', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
    ],
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    url: canonical,
    author: { '@type': 'Person', name: 'Festus Yeboah' },
    publisher: {
      '@type': 'Organization',
      name: 'Web Loom',
      url: SITE_URL,
    },
    isPartOf: {
      '@type': 'Blog',
      '@id': `${SITE_URL}/blog`,
      name: 'Web Loom Blog',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 text-sm">
        <Link
          href="/"
          className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Home
        </Link>
        <svg className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Link
          href="/blog"
          className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Blog
        </Link>
        <svg className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">{post.title}</span>
      </nav>

      {/* Article header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            Part {String(post.number).padStart(2, '0')}
          </span>
          {post.packageName && (
            <code className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              {post.packageName}
            </code>
          )}
        </div>

        <h1 className="text-3xl font-[650] text-slate-800 dark:text-slate-200 leading-tight mb-4">
          {post.title}
        </h1>

        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          {post.summary}
        </p>

        <div className="mt-6 h-px bg-slate-200 dark:bg-slate-800" />
      </header>

      {/* Article body */}
      <article className="prose text-slate-600 dark:text-slate-400 max-w-none prose-p:leading-relaxed prose-headings:font-[650] prose-headings:text-slate-800 dark:prose-headings:text-slate-200 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-a:font-medium prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-800 dark:prose-strong:text-slate-100 prose-code:text-slate-800 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 dark:prose-code:text-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 [&_pre_code]:!text-slate-100 prose-headings:scroll-mt-24 prose-hr:border-slate-200 dark:prose-hr:border-slate-800">
        <CustomMDX source={post.content} />
      </article>

      {/* Series navigation */}
      {(prev || next) && (
        <nav className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
            Continue the series
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="group flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Previous
                </span>
                <span className="text-sm font-[650] text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                  {prev.title}
                </span>
              </Link>
            ) : <div />}

            {next && (
              <Link
                href={`/blog/${next.slug}`}
                className="group flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors sm:text-right"
              >
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 sm:justify-end">
                  Next
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm font-[650] text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                  {next.title}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}

      <Footer />
    </>
  );
}
