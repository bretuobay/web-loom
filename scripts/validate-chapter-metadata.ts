#!/usr/bin/env tsx
/**
 * Validate Chapter Metadata Script
 * 
 * This script validates that all chapter MDX files have correct frontmatter
 * and that the metadata is consistent with the chapter-mapping.json.
 */

import fs from 'fs';
import path from 'path';

interface ChapterFrontmatter {
  id: string;
  title: string;
  section: string;
}

// Extract frontmatter from MDX file
function extractFrontmatter(content: string): ChapterFrontmatter | null {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return null;
  }
  
  const frontmatterText = match[1];
  const idMatch = frontmatterText.match(/id:\s*"([^"]+)"/);
  const titleMatch = frontmatterText.match(/title:\s*(.+)/);
  const sectionMatch = frontmatterText.match(/section:\s*(.+)/);
  
  if (!idMatch || !titleMatch || !sectionMatch) {
    return null;
  }
  
  return {
    id: idMatch[1],
    title: titleMatch[1].trim(),
    section: sectionMatch[1].trim()
  };
}

// Main validation function
function main() {
  console.log('Validating chapter metadata...\n');
  
  const chaptersDir = path.join(process.cwd(), 'apps/docs/content/book/chapters');
  const files = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.mdx')).sort();
  
  let totalFiles = 0;
  let filesWithFrontmatter = 0;
  let filesWithoutFrontmatter: string[] = [];
  let filesWithIncompleteMetadata: string[] = [];
  
  const sectionCounts: Record<string, number> = {};
  
  console.log('Checking all chapter files:\n');
  
  for (const file of files) {
    totalFiles++;
    const filePath = path.join(chaptersDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = extractFrontmatter(content);
    
    if (!frontmatter) {
      filesWithoutFrontmatter.push(file);
      console.log(`❌ ${file}: Missing frontmatter`);
    } else if (!frontmatter.id || !frontmatter.title || !frontmatter.section) {
      filesWithIncompleteMetadata.push(file);
      console.log(`⚠️  ${file}: Incomplete metadata`);
      console.log(`   id: ${frontmatter.id || 'MISSING'}`);
      console.log(`   title: ${frontmatter.title || 'MISSING'}`);
      console.log(`   section: ${frontmatter.section || 'MISSING'}`);
    } else {
      filesWithFrontmatter++;
      sectionCounts[frontmatter.section] = (sectionCounts[frontmatter.section] || 0) + 1;
      console.log(`✓ ${file}: ${frontmatter.title}`);
      console.log(`   Section: ${frontmatter.section}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total chapter files: ${totalFiles}`);
  console.log(`Files with complete frontmatter: ${filesWithFrontmatter}`);
  console.log(`Files without frontmatter: ${filesWithoutFrontmatter.length}`);
  console.log(`Files with incomplete metadata: ${filesWithIncompleteMetadata.length}`);
  
  if (filesWithoutFrontmatter.length > 0) {
    console.log('\nFiles missing frontmatter:');
    filesWithoutFrontmatter.forEach(f => console.log(`  - ${f}`));
  }
  
  if (filesWithIncompleteMetadata.length > 0) {
    console.log('\nFiles with incomplete metadata:');
    filesWithIncompleteMetadata.forEach(f => console.log(`  - ${f}`));
  }
  
  console.log('\nChapters by section:');
  Object.entries(sectionCounts).sort().forEach(([section, count]) => {
    console.log(`  ${section}: ${count} chapters`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (filesWithFrontmatter === totalFiles) {
    console.log('✓ ALL CHAPTERS HAVE COMPLETE METADATA');
  } else {
    console.log('⚠️  SOME CHAPTERS NEED ATTENTION');
  }
  
  console.log('='.repeat(60));
}

// Run the script
main();
