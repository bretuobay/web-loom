import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CustomMDX } from '@/components/mdx/mdx';
import Hamburger from '@/components/ui/hamburger';
import Feedback from '@/components/ui/feedback';
import PageNavigation from '@/components/ui/page-navigation';
import Footer from '@/components/ui/footer';
import SecondaryNav from '@/components/ui/secondary-nav';
import { getBookPage, getBookPages } from '@/components/mdx/utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://webloomframework.com';

export async function generateStaticParams() {
  return getBookPages().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata | undefined> {
  const { slug } = await props.params;
  const post = getBookPage(slug);

  if (!post) {
    return;
  }

  const title = post.metadata.title;
  const description = post.metadata.summary ?? 'Plugin architecture book chapter';

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${post.href}` },
  };
}

export default async function BookChapterPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = getBookPage(slug);

  if (!post) notFound();

  return (
    <>
      <article className="flex xl:space-x-12">
        <div className="min-w-0">
          <div className="md:hidden flex items-center mb-8">
            <Hamburger />

            <div className="flex items-center text-sm whitespace-nowrap min-w-0 ml-3">
              <span className="text-slate-600 dark:text-slate-400">Plugin Book</span>
              <svg
                className="fill-slate-400 shrink-0 mx-2 dark:fill-slate-500"
                width="8"
                height="10"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M1 2 2.414.586 6.828 5 2.414 9.414 1 8l3-3z" />
              </svg>
              <span className="text-slate-800 font-medium truncate dark:text-slate-200">{post.metadata.title}</span>
            </div>
          </div>

          <div>
            <header className="mb-6">
              <div className="text-xs font-[650] text-blue-600 dark:text-blue-400 uppercase mb-2">
                {post.topic}
              </div>
              <h1 className="text-2xl font-[650] text-slate-800 mb-2 dark:text-slate-200">{post.metadata.title}</h1>
              {post.metadata.summary && (
                <p className="text-base text-slate-600 dark:text-slate-400">{post.metadata.summary}</p>
              )}
            </header>

            <article className="prose text-slate-600 dark:text-slate-400 max-w-none prose-p:leading-normal prose-headings:font-[650] prose-headings:text-slate-800 dark:prose-headings:text-slate-200 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm prose-a:font-medium prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-800 dark:prose-strong:text-slate-100 prose-code:text-slate-800 prose-code:bg-transparent dark:prose-code:bg-slate-800 dark:prose-code:text-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 [&_pre_code]:!text-slate-100 prose-headings:scroll-mt-24">
              <CustomMDX source={post.content} />
            </article>
          </div>

          <Feedback />

          <PageNavigation
            prevArticle={[post.prev?.title, post.prev?.href]}
            nextArticle={[post.next?.title, post.next?.href]}
          />

          <Footer />
        </div>

        <SecondaryNav />
      </article>
    </>
  );
}
