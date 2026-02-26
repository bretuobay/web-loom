#!/usr/bin/env tsx
/**
 * Update Chapter Metadata Script
 * 
 * This script updates the frontmatter in all chapter MDX files based on the
 * chapter-mapping.json file created in task 2.2.
 * 
 * It will:
 * 1. Read the chapter-mapping.json file
 * 2. For each chapter file, update or add frontmatter with:
 *    - id (kebab-case)
 *    - title (from mapping)
 *    - section (from mapping)
 * 3. Preserve existing chapter content
 * 4. Handle chapters with missing frontmatter
 */

import fs from 'fs';
import path from 'path';

interface ChapterMapping {
  oldChapterNumber: number | null;
  newChapterNumber: number;
  action: string;
  oldTitle: string | null;
  newTitle: string;
  oldSection: string | null;
  newSection: string;
  oldFileName: string | null;
  newFileName: string;
  renamingReason: string | null;
  contentChanges: string;
}

interface NewChapter {
  newChapterNumber: number;
  title: string;
  section: string;
  fileName: string;
}

interface ChapterMappingData {
  mappings: ChapterMapping[];
  newChapters: NewChapter[];
}

// Convert title to kebab-case id
function titleToId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Extract frontmatter and content from MDX file
function parseMdxFile(content: string): { frontmatter: string | null; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    return {
      frontmatter: match[1],
      body: match[2]
    };
  }
  
  return {
    frontmatter: null,
    body: content
  };
}

// Create frontmatter string
function createFrontmatter(id: string, title: string, section: string): string {
  return `---
id: "${id}"
title: ${title}
section: ${section}
---`;
}

// Update a single chapter file
function updateChapterFile(
  filePath: string,
  id: string,
  title: string,
  section: string
): void {
  console.log(`Updating ${path.basename(filePath)}...`);
  
  // Read existing file
  const content = fs.readFileSync(filePath, 'utf-8');
  const { body } = parseMdxFile(content);
  
  // Create new frontmatter
  const newFrontmatter = createFrontmatter(id, title, section);
  
  // Combine frontmatter and body
  const newContent = `${newFrontmatter}\n\n${body.trim()}\n`;
  
  // Write updated file
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`  ✓ Updated frontmatter: id="${id}", title="${title}", section="${section}"`);
}

// Main function
function main() {
  console.log('Starting chapter metadata update...\n');
  
  // Read chapter-mapping.json
  const mappingPath = path.join(process.cwd(), '.kiro/specs/mvvm-book-rewrite/chapter-mapping.json');
  const mappingData: ChapterMappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  
  const chaptersDir = path.join(process.cwd(), 'apps/docs/content/book/chapters');
  
  // Process existing chapters that are being kept/renamed/moved
  const processedChapters = new Set<number>();
  
  for (const mapping of mappingData.mappings) {
    // Skip removed chapters
    if (mapping.action === 'remove' || mapping.newChapterNumber === null) {
      console.log(`Skipping removed chapter: ${mapping.oldTitle || 'Unknown'}`);
      continue;
    }
    
    const fileName = mapping.newFileName;
    const filePath = path.join(chaptersDir, fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ File not found: ${fileName} (will be created in later tasks)`);
      continue;
    }
    
    const id = titleToId(mapping.newTitle);
    updateChapterFile(filePath, id, mapping.newTitle, mapping.newSection);
    processedChapters.add(mapping.newChapterNumber);
  }
  
  // Handle special cases: old chapter files that need metadata but will be reorganized later
  // Old chapter 11 → becomes new chapter 9 (already processed above as chapter9.mdx)
  // Old chapter 13 → duplicate, will be removed (skip)
  // Old chapter 21 → becomes new chapter 23 (already processed above as chapter23.mdx)
  
  // Update old chapter 11 with temporary metadata (it's a duplicate of chapter 9)
  const oldChapter11Path = path.join(chaptersDir, 'chapter11.mdx');
  if (fs.existsSync(oldChapter11Path)) {
    console.log('\nUpdating old chapter11.mdx (duplicate Vue chapter)...');
    const id = titleToId('Vue Implementation with Composition API');
    updateChapterFile(oldChapter11Path, id, 'Vue Implementation with Composition API', 'Framework Implementations');
    console.log('  Note: This is a duplicate that will be removed in later tasks');
  }
  
  // Update old chapter 13 with temporary metadata (it's a duplicate of chapter 9)
  const oldChapter13Path = path.join(chaptersDir, 'chapter13.mdx');
  if (fs.existsSync(oldChapter13Path)) {
    console.log('\nUpdating old chapter13.mdx (duplicate Vue chapter)...');
    const id = titleToId('Vue Implementation with Composition API');
    updateChapterFile(oldChapter13Path, id, 'Vue Implementation with Composition API', 'Framework Implementations');
    console.log('  Note: This is a duplicate that will be removed in later tasks');
  }
  
  // Update old chapter 21 with new metadata (becomes chapter 23)
  const oldChapter21Path = path.join(chaptersDir, 'chapter21.mdx');
  if (fs.existsSync(oldChapter21Path)) {
    console.log('\nUpdating old chapter21.mdx (becomes chapter 23)...');
    const id = titleToId('Conclusion and Best Practices');
    updateChapterFile(oldChapter21Path, id, 'Conclusion and Best Practices', 'Real-World Applications');
    console.log('  Note: This file will be renamed to chapter23.mdx in later tasks');
  }
  
  console.log('\n✓ Chapter metadata update complete!');
  console.log(`\nProcessed ${processedChapters.size} existing chapters.`);
  console.log(`Note: New chapters (4, 11, 12, 13, 15, 16, 17, 20, 21) will be created in later tasks.`);
}

// Run the script
main();
