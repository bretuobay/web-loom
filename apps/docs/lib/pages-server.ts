import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type PageData = {
  slug: string;
  title: string;
  [key: string]: unknown;
};

const contentDirectory = path.join(process.cwd(), 'content');

function getPagesRecursive(dir: string): PageData[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const pages = entries.flatMap((entry): PageData[] => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getPagesRecursive(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);
      const slug = path.relative(contentDirectory, fullPath).replace(/\.mdx$/, '');

      return [
        {
          slug,
          title: (data.title as string) || slug,
          ...data,
        },
      ];
    }
    return [];
  });
  return pages;
}

export function getPages(): PageData[] {
  return getPagesRecursive(contentDirectory);
}
