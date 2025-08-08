import { getPages } from '../../lib/pages-server';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function generateStaticParams() {
  const pages = getPages();
  return pages.map((page) => ({
    slug: page.slug.split('/'),
  }));
}

async function getPage(params: Promise<{ slug: string[] }>) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug.join('/');
  const pages = getPages();
  const page = pages.find((p) => p.slug === slug);

  if (!page) {
    return null;
  }

  const fullPath = path.join(process.cwd(), 'content', `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { content } = matter(fileContents);

  return {
    ...page,
    content,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const page = await getPage(params);

  if (!page) {
    notFound();
  }

  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>{page.title}</h1>
      <MDXRemote source={page.content} />
    </article>
  );
}
