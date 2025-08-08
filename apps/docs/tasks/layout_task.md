# Documentation Website Layout Design Prompt

## Project Context

You are tasked with redesigning the layout for a documentation website built with Next.js 15+ and the following tech stack:

- **Framework**: Next.js 15.3.0 with App Router
- **Styling**: Tailwind CSS 4.x with Typography plugin
- **Content**: MDX with next-mdx-remote, gray-matter for frontmatter
- **UI Components**: Custom UI library (@repo/ui), Lucide React icons
- **Features**: Dark/light theme support (next-themes), syntax highlighting (rehype-prism-plus)

## Design Requirements

### Overall Layout Structure

Create a modern, professional documentation layout with these core components:

1. **Header/Navigation Bar**
   - Fixed position with backdrop blur effect
   - Logo/brand on the left
   - Main navigation links (horizontal on desktop, hamburger on mobile)
   - Theme toggle button and search icon on the right
   - Use `bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800`

2. **Sidebar Navigation**
   - Fixed sidebar on desktop (width ~280px), collapsible on mobile
   - Hierarchical navigation tree with expandable sections
   - Active page highlighting with subtle accent colors
   - Smooth scroll-to-top button at bottom
   - Use `bg-gray-50 dark:bg-gray-900` with subtle borders

3. **Main Content Area**
   - Responsive layout that adjusts to sidebar presence
   - Maximum content width of ~65ch for optimal readability
   - Proper spacing and typography hierarchy using @tailwindcss/typography
   - Breadcrumb navigation above content
   - Table of contents (TOC) for longer pages

4. **Right Sidebar (Table of Contents)**
   - Sticky positioning on desktop
   - Auto-generated from MDX headings
   - Smooth scrolling with active section highlighting
   - Hide on mobile/tablet to save space

### Responsive Breakpoints

- **Mobile (< 768px)**: Single column, collapsible sidebar overlay
- **Tablet (768px - 1024px)**: Collapsible sidebar, no right TOC
- **Desktop (> 1024px)**: Full three-column layout with fixed sidebars

### Typography and Content Styling

Use Tailwind Typography plugin with these customizations:

- Prose class: `prose prose-gray dark:prose-invert max-w-none`
- Code blocks: Enhanced styling with line numbers and copy buttons
- Callout boxes: Custom components for tips, warnings, notes
- Link styling: Consistent accent colors with hover effects

### Color Scheme

Implement a cohesive color palette:

- **Primary**: Blue-600 for links and accents
- **Background**: White/Gray-900 for main areas
- **Surface**: Gray-50/Gray-800 for sidebars and cards
- **Border**: Gray-200/Gray-700 for subtle separations
- **Text**: Gray-900/Gray-100 for high contrast

### Interactive Elements

- Smooth transitions for theme switching
- Hover states for navigation items
- Focus states for accessibility
- Loading states for dynamic content
- Scroll indicators for long content

## Technical Implementation Guidelines

### Component Structure

```
├── layout.tsx (root layout with theme provider)
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── TableOfContents.tsx
│   ├── MobileMenu.tsx
│   ├── SearchBar.tsx
│   └── ThemeToggle.tsx
|   |___ BreadCrumps.tsx
└── styles/
    └── globals.css (Tailwind imports + custom CSS)
```

### Key Features to Implement

1. **Search Integration**: Prepare structure for search functionality
2. **Navigation State**: Persist sidebar state in localStorage
3. **Scroll Restoration**: Maintain scroll position on navigation
4. **Keyboard Navigation**: Support arrow keys for sidebar navigation
5. **Print Styles**: Optimize layout for printing documentation

### Accessibility Requirements

- Semantic HTML structure with proper headings hierarchy
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast ratios for text
- Focus management for mobile menu
- Screen reader friendly navigation

### Performance Considerations

- Use CSS transforms for animations over layout properties
- Implement proper loading states
- Optimize bundle size with dynamic imports where appropriate
- Ensure smooth 60fps animations

## Specific Tailwind Classes to Utilize

- Layout: `grid grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_240px]`
- Positioning: `sticky top-16`, `fixed inset-y-0`
- Spacing: `space-y-4`, `py-6 px-4`, consistent margins
- Typography: `text-sm font-medium`, `text-gray-600 dark:text-gray-400`
- Borders: `border-l border-gray-200 dark:border-gray-800`
- Shadows: `shadow-sm`, `shadow-lg` for elevation
- Transitions: `transition-all duration-200 ease-in-out`

## Example Page Types to Design For

1. **Landing/Overview Page**: Hero section with getting started cards
2. **Guide Pages**: Step-by-step tutorials with code examples
3. **API Reference**: Function/component documentation with parameters
4. **Changelog**: Version history with collapsible entries

## Deliverables Expected

1. Complete layout components with TypeScript
2. Responsive design that works across all devices
3. Dark/light theme implementation
4. Proper integration with MDX content rendering
5. Clean, maintainable code following Next.js 15 best practices
6. Comments explaining key design decisions

Focus on creating a layout that feels modern, fast, and professional while maintaining excellent usability for both casual readers and developers who need to reference the documentation frequently.
