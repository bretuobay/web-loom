import { getPages } from "../../lib/pages";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function generateStaticParams() {
  const pages = getPages();
  return pages.map((page) => ({
    slug: page.slug.split("/"),
  }));
}

async function getPage(params: { slug: string[] }) {
  const slug = params.slug.join("/");
  const pages = getPages();
  const page = pages.find((p) => p.slug === slug);

  if (!page) {
    return null;
  }

  const fullPath = path.join(
    process.cwd(),
    "apps/docs/content",
    `${slug}.mdx`
  );
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { content, data } = matter(fileContents);

  return {
    ...page,
    content,
  };
}

export default async function Page({ params }: { params: { slug: string[] } }) {
  const page = await getPage(params);

  if (!page) {
    notFound();
  }

  return (
    <article className="prose dark:prose-invert">
      <h1>{page.title}</h1>
      <MDXRemote source={page.content} />
    </article>
  );
}
