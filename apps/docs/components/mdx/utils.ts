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

// ─── Frontmatter ──────────────────────────────────────────────────────────────

/**
 * Splits an optional leading `---` block of flat `key: value` lines from the body.
 * Only a block at the very start of the file counts, so `---` rules in the body are left alone.
 */
function splitFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith('---')) return { data: {}, content: raw };
  const match = /---\s*([\s\S]*?)\s*---/.exec(trimmed);
  if (!match) return { data: {}, content: raw };

  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    data[line.slice(0, separator).trim()] = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }
  return { data, content: trimmed.slice(match[0].length).trim() };
}

// ─── Blog helpers ─────────────────────────────────────────────────────────────

/**
 * Blog series, in the order the blog index lists them. A post joins a series via
 * `series:` frontmatter; posts without it belong to the package deep-dive series.
 */
export const BLOG_SERIES = {
  'introducing-web-loom': {
    title: 'Introducing Web Loom',
    description:
      'Where Web Loom came from, why its reactive core moved from RxJS to signals, and what building it with AI agents taught me about patterns.',
    featureLastPost: false,
  },
  'package-deep-dives': {
    title: 'Package Deep Dives',
    description:
      'One article per published package — the history behind each pattern, how other platforms handle it, and how Web Loom thinks about it.',
    featureLastPost: true,
  },
} as const;

export type BlogSeriesId = keyof typeof BLOG_SERIES;

const BLOG_SERIES_ORDER = Object.keys(BLOG_SERIES) as BlogSeriesId[];
const DEFAULT_BLOG_SERIES: BlogSeriesId = 'package-deep-dives';

function resolveBlogSeries(value: string | undefined, filename: string): BlogSeriesId {
  if (value === undefined) return DEFAULT_BLOG_SERIES;
  if (value in BLOG_SERIES) return value as BlogSeriesId;
  throw new Error(`Unknown blog series "${value}" in ${filename}. Add it to BLOG_SERIES.`);
}

function getMarkdownFiles(dir: string) {
  return fs
    .readdirSync(dir)
    .filter((file) => path.extname(file) === '.md')
    .sort();
}

function parseBlogContent(rawContent: string, filename: string) {
  const { data, content: body } = splitFrontmatter(rawContent);
  const lines = body.split('\n');

  // Title: first # heading (strip backtick code-formatting for plain display)
  const titleLineIdx = lines.findIndex((l) => l.startsWith('# '));
  const rawTitle = titleLineIdx >= 0 ? lines[titleLineIdx].replace(/^#\s+/, '').trim() : path.basename(filename, '.md');
  const title = rawTitle.replace(/`/g, '');

  // Content: everything after the title line, leading --- stripped
  const afterTitle = lines
    .slice(titleLineIdx + 1)
    .join('\n')
    .trim();
  const content = afterTitle.replace(/^\s*---\s*\n/, '').trim();

  // Summary: first substantive paragraph (not a heading, separator, or code block)
  const paragraphs = content.split(/\n\n+/);
  const firstPara =
    paragraphs.find((p) => {
      const t = p.trim();
      return (
        t && !t.startsWith('#') && !t.startsWith('---') && !t.startsWith('```') && !t.startsWith('|') && t.length > 30
      );
    }) || '';
  const summary = data.summary ?? firstPara.replace(/\n/g, ' ').substring(0, 220) + (firstPara.length > 220 ? '…' : '');

  // Part number within the series: `part:` frontmatter, else the filename prefix ("01-mvvm-core.md" → 1)
  const numMatch = filename.match(/^(\d+)-/);
  const number = data.part ? parseInt(data.part, 10) : numMatch ? parseInt(numMatch[1], 10) : 99;

  // Package name: backtick-wrapped @web-loom/... in the raw title
  // Using RegExp constructor to avoid backtick-in-template-literal issues
  const packageMatch = rawTitle.match(new RegExp('`(@web-loom/[\\w-]+)`'));
  const packageName = packageMatch ? packageMatch[1] : null;

  const series = resolveBlogSeries(data.series, filename);

  return { title, content, summary, number, packageName, series };
}

export type BlogPage = ReturnType<typeof getBlogPages>[number];

// ─── Book helpers ──────────────────────────────────────────────────────────────

const BOOK_SECTION_FALLBACKS: Record<string, string> = {
  chapter11: 'View Layer Implementations',
  chapter13: 'The GreenWatch Case Study',
  chapter14: 'The GreenWatch Case Study',
  chapter16: 'The GreenWatch Case Study',
  chapter21: 'Enterprise Scale',
};

export type BookPage = {
  slug: string;
  number: number;
  title: string;
  section: string;
  content: string;
};

export function getBookPages(): BookPage[] {
  const dir = path.join(process.cwd(), 'content/book/chapters');
  return fs
    .readdirSync(dir)
    .filter((f) => path.extname(f) === '.mdx')
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const nb = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return na - nb;
    })
    .map((file) => {
      const slug = path.basename(file, '.mdx');
      const number = parseInt(slug.match(/\d+/)?.[0] ?? '0', 10);
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const {
        data: { title: fmTitle, section: fmSection },
        content,
      } = splitFrontmatter(raw);

      let title: string;
      if (fmTitle) {
        title = fmTitle;
      } else {
        const headingLine = raw.split('\n').find((l) => /^#{1,2}\s/.test(l));
        const rawTitle = headingLine ? headingLine.replace(/^#{1,2}\s+/, '') : `Chapter ${number}`;
        title = rawTitle.replace(/^(Chapter\s+\d+[:.]\s*|Conclusion[:.]\s*)/i, '').trim();
      }

      const section = fmSection ?? BOOK_SECTION_FALLBACKS[slug] ?? 'Uncategorized';
      return { slug, number, title, section, content };
    });
}

// ─── Blog helpers ─────────────────────────────────────────────────────────────

/** All blog posts, grouped by series (in BLOG_SERIES order) and ordered by part within each series. */
export function getBlogPages() {
  const dir = path.join(process.cwd(), 'content/blog');
  return getMarkdownFiles(dir)
    .filter((file) => file !== 'medium-intro.md') // exclude the intro essay
    .map((file) => {
      const rawContent = fs.readFileSync(path.join(dir, file), 'utf-8');
      const slug = path.basename(file, '.md');
      return { slug, ...parseBlogContent(rawContent, file) };
    })
    .sort((a, b) => BLOG_SERIES_ORDER.indexOf(a.series) - BLOG_SERIES_ORDER.indexOf(b.series) || a.number - b.number);
}

/** Non-empty blog series with their posts, for the blog index. */
export function getBlogSeries() {
  const posts = getBlogPages();
  return BLOG_SERIES_ORDER.map((id) => ({
    id,
    ...BLOG_SERIES[id],
    posts: posts.filter((post) => post.series === id),
  })).filter((series) => series.posts.length > 0);
}
