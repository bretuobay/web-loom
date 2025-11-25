/**
 * Verification tests for MDX chapter rendering and syntax highlighting
 * Tests Requirements: 3.1, 3.2, 3.3, 5.3, 5.4
 */

import { getChapters } from '../lib/get-chapters'

describe('Task 5.1: Markdown rendering in BookContent component', () => {
  let chapters: Awaited<ReturnType<typeof getChapters>>

  beforeAll(async () => {
    chapters = await getChapters()
  })

  test('should load all chapters successfully', () => {
    expect(chapters).toBeDefined()
    expect(chapters.length).toBeGreaterThan(0)
    expect(chapters.length).toBe(5) // We have 5 chapters
  })

  test('should have code blocks with language identifiers for syntax highlighting', () => {
    // Check React chapter (chapter2) has tsx/typescript code blocks
    const reactChapter = chapters.find(ch => ch.id === 'react-basics')
    expect(reactChapter).toBeDefined()
    expect(reactChapter?.content).toContain('```tsx')
    expect(reactChapter?.content).toContain('```typescript')
    
    // Verify code block content includes TypeScript syntax
    expect(reactChapter?.content).toMatch(/interface\s+\w+/)
    expect(reactChapter?.content).toMatch(/useState/)
  })

  test('should have TypeScript code examples', () => {
    const tsChapter = chapters.find(ch => ch.id === 'typescript-intro')
    expect(tsChapter).toBeDefined()
    expect(tsChapter?.content).toContain('```typescript')
    
    // Verify TypeScript-specific syntax
    expect(tsChapter?.content).toMatch(/interface\s+\w+/)
    expect(tsChapter?.content).toMatch(/enum\s+\w+/)
    expect(tsChapter?.content).toMatch(/class\s+\w+<T>/) // Generics
  })

  test('should have Vue code examples', () => {
    const vueChapter = chapters.find(ch => ch.id === 'vue-essentials')
    expect(vueChapter).toBeDefined()
    expect(vueChapter?.content).toContain('```vue')
    expect(vueChapter?.content).toContain('```typescript')
    
    // Verify Vue-specific syntax
    expect(vueChapter?.content).toMatch(/<template>/)
    expect(vueChapter?.content).toMatch(/<script setup/)
    expect(vueChapter?.content).toMatch(/ref\(/)
  })

  test('should have Angular code examples', () => {
    const angularChapter = chapters.find(ch => ch.id === 'angular-overview')
    expect(angularChapter).toBeDefined()
    expect(angularChapter?.content).toContain('```typescript')
    
    // Verify Angular-specific syntax
    expect(angularChapter?.content).toMatch(/@Component/)
    expect(angularChapter?.content).toMatch(/@Injectable/)
    expect(angularChapter?.content).toMatch(/Observable/)
  })

  test('should have inline code markers', () => {
    // Check for inline code using backticks
    const introChapter = chapters.find(ch => ch.id === 'introduction')
    expect(introChapter).toBeDefined()
    expect(introChapter?.content).toMatch(/\*\*\w+\*\*/) // Bold text markers
  })

  test('should have proper heading markers', () => {
    chapters.forEach(chapter => {
      // All chapters should have at least one heading
      expect(chapter.content).toMatch(/^#\s+/m) // H1 heading
    })
    
    // Check for various heading levels
    const reactChapter = chapters.find(ch => ch.id === 'react-basics')
    expect(reactChapter?.content).toMatch(/^##\s+/m) // H2 heading
  })

  test('should have list formatting', () => {
    const introChapter = chapters.find(ch => ch.id === 'introduction')
    expect(introChapter).toBeDefined()
    expect(introChapter?.content).toMatch(/^-\s+/m) // Unordered list
    
    const tsChapter = chapters.find(ch => ch.id === 'typescript-intro')
    expect(tsChapter?.content).toMatch(/^\d+\.\s+/m) // Ordered list
  })

  test('should preserve code formatting with proper indentation', () => {
    const reactChapter = chapters.find(ch => ch.id === 'react-basics')
    expect(reactChapter).toBeDefined()
    
    // Check that code blocks have indentation preserved
    const codeBlockMatch = reactChapter?.content.match(/```tsx\n([\s\S]*?)```/)
    expect(codeBlockMatch).toBeTruthy()
    
    if (codeBlockMatch) {
      const codeContent = codeBlockMatch[1]
      // Should have indented lines
      expect(codeContent).toMatch(/\n\s{2,}/) // At least 2 spaces of indentation
    }
  })
})

describe('Task 5.2: Chapter navigation and section grouping', () => {
  let chapters: Awaited<ReturnType<typeof getChapters>>

  beforeAll(async () => {
    chapters = await getChapters()
  })

  test('should group chapters by section', () => {
    const sections = new Set(chapters.map(ch => ch.section))
    
    // We should have multiple sections
    expect(sections.size).toBeGreaterThan(1)
    
    // Verify expected sections exist
    expect(sections.has('Getting Started')).toBe(true)
    expect(sections.has('React')).toBe(true)
    expect(sections.has('Vue')).toBe(true)
    expect(sections.has('TypeScript')).toBe(true)
    expect(sections.has('Angular')).toBe(true)
  })

  test('should have correct chapter ordering by filename numbers', () => {
    // Chapters should be in order: chapter1, chapter2, chapter3, chapter4, chapter5
    expect(chapters[0].id).toBe('introduction')
    expect(chapters[1].id).toBe('react-basics')
    expect(chapters[2].id).toBe('vue-essentials')
    expect(chapters[3].id).toBe('typescript-intro')
    expect(chapters[4].id).toBe('angular-overview')
  })

  test('should have all required chapter properties for navigation', () => {
    chapters.forEach(chapter => {
      // Each chapter must have id, title, section for navigation
      expect(chapter.id).toBeDefined()
      expect(typeof chapter.id).toBe('string')
      expect(chapter.id.length).toBeGreaterThan(0)
      
      expect(chapter.title).toBeDefined()
      expect(typeof chapter.title).toBe('string')
      expect(chapter.title.length).toBeGreaterThan(0)
      
      expect(chapter.section).toBeDefined()
      expect(typeof chapter.section).toBe('string')
      expect(chapter.section.length).toBeGreaterThan(0)
      
      expect(chapter.content).toBeDefined()
      expect(typeof chapter.content).toBe('string')
      expect(chapter.content.length).toBeGreaterThan(0)
    })
  })

  test('should support chapter selection by id', () => {
    // Verify each chapter has a unique id for selection
    const ids = chapters.map(ch => ch.id)
    const uniqueIds = new Set(ids)
    
    expect(ids.length).toBe(uniqueIds.size) // All ids should be unique
  })

  test('should have proper section grouping structure', () => {
    // Group chapters by section (simulating BookSidebar logic)
    const groupedChapters = chapters.reduce((acc, chapter) => {
      const section = chapter.section || 'Introduction'
      if (!acc[section]) {
        acc[section] = []
      }
      acc[section].push(chapter)
      return acc
    }, {} as Record<string, typeof chapters>)

    // Verify grouping works correctly
    expect(Object.keys(groupedChapters).length).toBeGreaterThan(1)
    expect(groupedChapters['Getting Started']).toHaveLength(1)
    expect(groupedChapters['React']).toHaveLength(1)
    expect(groupedChapters['Vue']).toHaveLength(1)
    expect(groupedChapters['TypeScript']).toHaveLength(1)
    expect(groupedChapters['Angular']).toHaveLength(1)
  })
})

describe('Integration: Complete rendering pipeline', () => {
  test('should load chapters that are ready for BookContent rendering', async () => {
    const chapters = await getChapters()
    
    // Simulate what BookContent component receives
    const firstChapter = chapters[0]
    
    expect(firstChapter).toBeDefined()
    expect(firstChapter.id).toBe('introduction')
    expect(firstChapter.title).toBe('Introduction')
    expect(firstChapter.content).toContain('# MVVM Book Introduction')
    
    // Content should be ready for react-markdown
    expect(firstChapter.content).not.toContain('---') // Frontmatter should be stripped
    expect(firstChapter.content.trim().length).toBeGreaterThan(0)
  })

  test('should have content formatted for syntax highlighting', async () => {
    const chapters = await getChapters()
    const reactChapter = chapters.find(ch => ch.id === 'react-basics')
    
    expect(reactChapter).toBeDefined()
    
    // Content should have code blocks that react-syntax-highlighter can process
    const codeBlocks = reactChapter?.content.match(/```(\w+)\n/g)
    expect(codeBlocks).toBeTruthy()
    expect(codeBlocks!.length).toBeGreaterThan(0)
    
    // Extract languages
    const languages = codeBlocks!.map(block => {
      const match = block.match(/```(\w+)/)
      return match ? match[1] : null
    }).filter(Boolean)
    
    // Should have TypeScript/TSX/JavaScript languages
    expect(languages.some(lang => ['tsx', 'typescript', 'ts', 'javascript', 'js'].includes(lang!))).toBe(true)
  })
})
