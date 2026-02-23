import type { Metadata } from 'next';
import { getDocPages } from '@/components/mdx/utils';
import { notFound } from 'next/navigation';
import { CustomMDX } from '@/components/mdx/mdx';
import TopicTitle from '@/components/ui/topic-title';
import Hamburger from '@/components/ui/hamburger';
import Feedback from '@/components/ui/feedback';
import PageNavigation from '@/components/ui/page-navigation';
import Footer from '@/components/ui/footer';
import SecondaryNav from '@/components/ui/secondary-nav';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://webloom.dev';

export async function generateStaticParams() {
  return getDocPages().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata | undefined> {
  const { slug } = await props.params;
  const post = getDocPages().find((p) => p.slug === slug);
  if (!post) return;

  const { title, summary: description, topicTitle } = post.metadata;
  const canonical = `${SITE_URL}/docs/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description,
      siteName: 'Web Loom',
      section: topicTitle,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SinglePost(props: {
  params: Promise<{ topic: string; slug: string }>;
}) {
  const params = await props.params;
  const post = getDocPages().find((p) => p.slug === params.slug);
  if (!post) notFound();

  const canonical = `${SITE_URL}/docs/${params.slug}`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Web Loom', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Docs', item: `${SITE_URL}/docs/getting-started` },
      { '@type': 'ListItem', position: 3, name: post.metadata.title, item: canonical },
    ],
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.metadata.title,
    description: post.metadata.summary,
    url: canonical,
    author: { '@type': 'Person', name: 'Festus Yeboah' },
    publisher: { '@type': 'Organization', name: 'Web Loom', url: SITE_URL },
    ...(post.metadata.publishedAt && { datePublished: post.metadata.publishedAt }),
    ...(post.metadata.updatedAt && { dateModified: post.metadata.updatedAt }),
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

      {/* Page header */}
      {post.metadata.topicTitle && post.metadata.topicSlug && (
        <div className="h-8 flex items-center mb-3">
          <TopicTitle name={post.metadata.topicTitle} segment={post.metadata.topicSlug} />
        </div>
      )}

      <article className="flex xl:space-x-12">
        {/* Main area */}
        <div className="min-w-0">
          {/* Mobile hamburger + breadcrumbs */}
          <div className="md:hidden flex items-center mb-8">
            <Hamburger />

            <div className="flex items-center text-sm whitespace-nowrap min-w-0 ml-3">
              {post.metadata.topicTitle && (
                <span className="text-slate-600 dark:text-slate-400">{post.metadata.topicTitle}</span>
              )}
              <svg
                className="fill-slate-400 shrink-0 mx-2 dark:fill-slate-500"
                width="8"
                height="10"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M1 2 2.414.586 6.828 5 2.414 9.414 1 8l3-3z" />
              </svg>
              <span className="text-slate-800 font-medium truncate dark:text-slate-200">
                {post.metadata.title}
              </span>
            </div>
          </div>

          {/* Article content */}
          <div>
            <header className="mb-6">
              <h1 className="text-2xl font-[650] text-slate-800 mb-2 dark:text-slate-200">
                {post.metadata.title}
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400">{post.metadata.summary}</p>
            </header>
            <article className="prose text-slate-600 dark:text-slate-400 max-w-none prose-p:leading-normal prose-headings:font-[650] prose-headings:text-slate-800 dark:prose-headings:text-slate-200 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm prose-a:font-medium prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-800 dark:prose-strong:text-slate-100 prose-code:text-slate-800 prose-code:bg-transparent dark:prose-code:bg-slate-800 dark:prose-code:text-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-headings:scroll-mt-24">
              <CustomMDX source={post.content} />
            </article>
          </div>

          <Feedback />

          <PageNavigation
            prevArticle={[post.metadata.prevTitle, post.metadata.prevSlug]}
            nextArticle={[post.metadata.nextTitle, post.metadata.nextSlug]}
          />

          <Footer />
        </div>

        <SecondaryNav />
      </article>
    </>
  );
}
