import fs from 'fs';
import path from 'path';

type Metadata = {
  title: string;
  publishedAt: string;
  updatedAt?: string;
  summary?: string;
  topicTitle?: string;
  topicSlug?: string;
  prevTitle?: string;
  prevSlug?: string;
  nextTitle?: string;
  nextSlug?: string;
};

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match![1];
  const content = fileContent.replace(frontmatterRegex, '').trim();
  const frontMatterLines = frontMatterBlock.trim().split('\n');
  const metadata: Partial<Metadata> = {};

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(': ');
    let value = valueArr.join(': ').trim();
    value = value.replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
    metadata[key.trim() as keyof Metadata] = value;
  });

  return { metadata: metadata as Metadata, content };
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx');
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  return parseFrontmatter(rawContent);
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));
    return {
      metadata,
      slug,
      content,
    };
  });
}

export function getDocPages() {
  return getMDXData(path.join(process.cwd(), 'content/docs'));
}

// ─── Blog helpers ─────────────────────────────────────────────────────────────

function getMarkdownFiles(dir: string) {
  return fs
    .readdirSync(dir)
    .filter((file) => path.extname(file) === '.md')
    .sort();
}

function parseBlogContent(rawContent: string, filename: string) {
  const lines = rawContent.split('\n');

  // Title: first # heading (strip backtick code-formatting for plain display)
  const titleLineIdx = lines.findIndex((l) => l.startsWith('# '));
  const rawTitle =
    titleLineIdx >= 0
      ? lines[titleLineIdx].replace(/^#\s+/, '').trim()
      : path.basename(filename, '.md');
  const title = rawTitle.replace(/`/g, '');

  // Content: everything after the title line, leading --- stripped
  const afterTitle = lines.slice(titleLineIdx + 1).join('\n').trim();
  const content = afterTitle.replace(/^\s*---\s*\n/, '').trim();

  // Summary: first substantive paragraph (not a heading, separator, or code block)
  const paragraphs = content.split(/\n\n+/);
  const firstPara =
    paragraphs.find((p) => {
      const t = p.trim();
      return (
        t &&
        !t.startsWith('#') &&
        !t.startsWith('---') &&
        !t.startsWith('```') &&
        !t.startsWith('|') &&
        t.length > 30
      );
    }) || '';
  const summary =
    firstPara.replace(/\n/g, ' ').substring(0, 220) +
    (firstPara.length > 220 ? '…' : '');

  // Article number from filename prefix (e.g. "01-mvvm-core.md" → 1)
  const numMatch = filename.match(/^(\d+)-/);
  const number = numMatch ? parseInt(numMatch[1], 10) : 99;

  // Package name: backtick-wrapped @web-loom/... in the raw title
  // Using RegExp constructor to avoid backtick-in-template-literal issues
  const packageMatch = rawTitle.match(new RegExp('`(@web-loom/[\\w-]+)`'));
  const packageName = packageMatch ? packageMatch[1] : null;

  return { title, content, summary, number, packageName };
}

export type BlogPage = ReturnType<typeof getBlogPages>[number];

export function getBlogPages() {
  const dir = path.join(process.cwd(), 'content/blog');
  return getMarkdownFiles(dir)
    .filter((file) => file !== 'medium-intro.md') // exclude the intro essay
    .map((file) => {
      const rawContent = fs.readFileSync(path.join(dir, file), 'utf-8');
      const slug = path.basename(file, '.md');
      return { slug, ...parseBlogContent(rawContent, file) };
    });
}
