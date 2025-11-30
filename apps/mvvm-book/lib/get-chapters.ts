import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Chapter {
  id: string;
  title: string;
  section: string;
  content: string;
}

/**
 * Loads and parses all MDX chapter files from the content/chapters directory
 * @returns Array of Chapter objects sorted by filename number
 */
export async function getChapters(): Promise<Chapter[]> {
  const chaptersDir = path.join(process.cwd(), 'content/chapters');

  // Handle missing content directory gracefully
  if (!fs.existsSync(chaptersDir)) {
    console.error(`Chapters directory not found at: ${chaptersDir}`);
    return [];
  }

  try {
    // Read all files from the chapters directory
    const files = fs.readdirSync(chaptersDir);

    // Filter for .mdx files only
    const mdxFiles = files.filter((file) => file.endsWith('.mdx'));

    if (mdxFiles.length === 0) {
      console.warn('No MDX files found in chapters directory');
      return [];
    }

    // Parse each MDX file and collect chapters
    const chapters: Chapter[] = [];

    for (const filename of mdxFiles) {
      const chapter = parseChapterFile(chaptersDir, filename);
      if (chapter) {
        chapters.push(chapter);
      }
    }

    // Sort chapters by filename number (chapter1.mdx, chapter2.mdx, etc.)
    return sortChaptersByFilename(chapters, mdxFiles, chaptersDir);
  } catch (error) {
    console.error('Error reading chapters directory:', error);
    return [];
  }
}

/**
 * Parses a single MDX chapter file
 * @param chaptersDir - Directory containing chapter files
 * @param filename - Name of the file to parse
 * @returns Chapter object or null if parsing fails
 */
function parseChapterFile(chaptersDir: string, filename: string): Chapter | null {
  try {
    const filePath = path.join(chaptersDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter and content using gray-matter
    const { data, content } = matter(fileContent);

    // Validate required frontmatter fields
    if (!data.id || typeof data.id !== 'string') {
      console.warn(`Skipping ${filename}: missing or invalid 'id' field in frontmatter`);
      return null;
    }

    if (!data.title || typeof data.title !== 'string') {
      console.warn(`Skipping ${filename}: missing or invalid 'title' field in frontmatter`);
      return null;
    }

    if (!data.section || typeof data.section !== 'string') {
      console.warn(`Skipping ${filename}: missing or invalid 'section' field in frontmatter`);
      return null;
    }

    // Return chapter object matching the Chapter interface
    return {
      id: data.id,
      title: data.title,
      section: data.section,
      content: content.trim(),
    };
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Sorts chapters by their filename number
 * @param chapters - Array of parsed chapters
 * @param filenames - Original filenames for sorting reference
 * @param chaptersDir - Directory containing chapter files
 * @returns Sorted array of chapters
 */
function sortChaptersByFilename(chapters: Chapter[], filenames: string[], chaptersDir: string): Chapter[] {
  // Create a map of chapter id to filename for sorting
  const filenameMap = new Map<string, string>();

  filenames.forEach((filename) => {
    const filePath = path.join(chaptersDir, filename);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);
      if (data.id) {
        filenameMap.set(data.id, filename);
      }
    } catch {
      // Skip files that can't be read
    }
  });

  // Sort chapters by extracting the number from filename (e.g., chapter1.mdx -> 1)
  return chapters.sort((a, b) => {
    const filenameA = filenameMap.get(a.id) || '';
    const filenameB = filenameMap.get(b.id) || '';

    const numberA = extractChapterNumber(filenameA);
    const numberB = extractChapterNumber(filenameB);

    return numberA - numberB;
  });
}

/**
 * Extracts the chapter number from a filename
 * @param filename - Filename like "chapter1.mdx" or "chapter10.mdx"
 * @returns The chapter number, or Infinity if not found
 */
function extractChapterNumber(filename: string): number {
  const match = filename.match(/chapter(\d+)\.mdx/);
  return match && match[1] ? parseInt(match[1], 10) : Infinity;
}
