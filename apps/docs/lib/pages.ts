import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "apps/docs/content");

function getPagesRecursive(dir: string): any[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const pages = entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getPagesRecursive(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);
      const slug = path
        .relative(contentDirectory, fullPath)
        .replace(/\.mdx$/, "");

      return {
        slug,
        title: data.title || slug,
        ...data,
      };
    }
    return [];
  });
  return pages;
}

export function getPages() {
  return getPagesRecursive(contentDirectory);
}
