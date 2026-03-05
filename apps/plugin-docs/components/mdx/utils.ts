import fs from 'fs';
import path from 'path';
import type { SearchEntry } from '@repo/docs-theme';

export type BookMetadata = {
  title: string;
  publishedAt?: string;
  updatedAt?: string;
  summary?: string;
  topicTitle?: string;
  topicSlug?: string;
};

export type BookPage = {
  slug: string;
  href: string;
  chapterNumber: number;
  topic: string;
  metadata: BookMetadata;
  content: string;
  prev: { title: string; href: string } | null;
  next: { title: string; href: string } | null;
};

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match?.[1] ?? '';
  const content = fileContent.replace(frontmatterRegex, '').trim();
  const frontMatterLines = frontMatterBlock.trim().split('\n').filter(Boolean);
  const metadata: Partial<BookMetadata> = {};

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(': ');
    let value = valueArr.join(': ').trim();
    value = value.replace(/^['"](.*)['"]$/, '$1');
    metadata[key.trim() as keyof BookMetadata] = value;
  });

  return { metadata: metadata as BookMetadata, content };
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx');
}

function getChapterNumber(slug: string) {
  const match = slug.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

function getTopicForChapter(slug: string, chapterNumber: number) {
  if (slug.startsWith('00-')) return 'Front Matter';
  if (chapterNumber >= 1 && chapterNumber <= 4) return 'Part I: Foundations and Theory';
  if (chapterNumber >= 5 && chapterNumber <= 8) return 'Part II: Implementation and Architecture';
  if (chapterNumber >= 9 && chapterNumber <= 10) return 'Part III: Security, Testing, and Best Practices';
  if (chapterNumber >= 11 && chapterNumber <= 13) return 'Part IV: Real-World Applications';
  if (chapterNumber >= 14 && chapterNumber <= 15) return 'Part V: Production and Optimization';
  if (chapterNumber >= 16) return 'Appendices';
  return 'Plugin Architecture Book';
}

export function getBookPages(): BookPage[] {
  const dir = path.join(process.cwd(), 'content/docs');
  const mdxFiles = getMDXFiles(dir)
    .map((file) => ({
      file,
      slug: path.basename(file, path.extname(file)),
      chapterNumber: getChapterNumber(path.basename(file, path.extname(file))),
    }))
    .sort((a, b) => {
      if (a.chapterNumber !== b.chapterNumber) return a.chapterNumber - b.chapterNumber;
      return a.slug.localeCompare(b.slug);
    });

  const pages = mdxFiles.map(({ file, slug, chapterNumber }) => {
    const rawContent = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { metadata, content } = parseFrontmatter(rawContent);

    return {
      slug,
      href: `/book/${slug}`,
      chapterNumber,
      topic: getTopicForChapter(slug, chapterNumber),
      metadata,
      content,
      prev: null,
      next: null,
    } as BookPage;
  });

  return pages.map((page, index) => ({
    ...page,
    prev:
      index > 0
        ? {
            title: pages[index - 1].metadata.title,
            href: pages[index - 1].href,
          }
        : null,
    next:
      index < pages.length - 1
        ? {
            title: pages[index + 1].metadata.title,
            href: pages[index + 1].href,
          }
        : null,
  }));
}

export function getBookPage(slug: string) {
  return getBookPages().find((page) => page.slug === slug);
}

export function getBookSearchEntries(): SearchEntry[] {
  return getBookPages().map((page) => ({
    title: page.metadata.title,
    summary: page.metadata.summary ?? 'Plugin architecture book chapter',
    href: page.href,
    topic: page.topic,
  }));
}
