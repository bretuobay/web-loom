import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogSeries, type BlogPage } from '@/components/mdx/utils';
import Footer from '@/components/ui/footer';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Deep-dives, tutorials and architectural thinking on building framework-agnostic TypeScript applications with Web Loom.',
  alternates: { canonical: absoluteUrl('/blog') },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/blog'),
    title: 'Web Loom Blog',
    description:
      'Deep-dives, tutorials and architectural thinking on building framework-agnostic TypeScript applications with Web Loom.',
    siteName: 'Web Loom',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Loom Blog',
    description:
      'Deep-dives, tutorials and architectural thinking on building framework-agnostic TypeScript applications with Web Loom.',
  },
};

// Category tag styles — cycle through a small palette by article number
const TAG_STYLES = [
  'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
  'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
  'bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400',
];

function tagStyle(n: number) {
  return TAG_STYLES[n % TAG_STYLES.length];
}

function FeaturedPost({ post }: { post: BlogPage }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block mb-10 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-800/60 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tagStyle(post.number)}`}>
          {post.packageName ?? `Part ${String(post.number).padStart(2, '0')}`}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">Series finale</span>
      </div>
      <h3 className="text-xl font-[650] text-slate-800 dark:text-slate-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {post.title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">{post.summary}</p>
      <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
        Read article
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}

function PostRow({ post }: { post: BlogPage }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex items-start gap-5 py-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 -mx-4 px-4 rounded-lg transition-colors"
    >
      {/* Article number badge */}
      <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-[650] text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {String(post.number).padStart(2, '0')}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {post.packageName && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${tagStyle(post.number)}`}>
              {post.packageName}
            </span>
          )}
        </div>
        <h3 className="text-base font-[650] text-slate-800 dark:text-slate-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{post.summary}</p>
      </div>

      {/* Arrow */}
      <svg
        className="shrink-0 w-4 h-4 mt-1 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

export default function BlogIndex() {
  const seriesList = getBlogSeries();

  return (
    <>
      {/* Page hero */}
      <header className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Home
          </Link>
          <svg className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">Blog</span>
        </div>

        <h1 className="text-3xl font-[650] text-slate-800 dark:text-slate-200 mb-3">The Web Loom Blog</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          The story of how Web Loom came to be, plus deep-dives on every published package — the history behind each
          pattern, how other platforms handle it, and how Web Loom thinks about it.
        </p>
      </header>

      {seriesList.map((series) => {
        const featured = series.featureLastPost ? series.posts[series.posts.length - 1] : undefined;
        const listed = featured ? series.posts.slice(0, -1) : series.posts;

        return (
          <section key={series.id} className="mb-16" aria-labelledby={`series-${series.id}`}>
            <h2 id={`series-${series.id}`} className="text-xl font-[650] text-slate-800 dark:text-slate-200 mb-2">
              {series.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-8">{series.description}</p>

            {featured && <FeaturedPost post={featured} />}

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {listed.map((post) => (
                <PostRow key={post.slug} post={post} />
              ))}
            </div>
          </section>
        );
      })}

      <Footer />
    </>
  );
}
