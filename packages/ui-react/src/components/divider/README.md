# Divider Component

A flexible divider component for creating visual separation between content sections. Supports horizontal and vertical orientations, text labels, and various styling options including dashed lines.

## Features

- 📏 Horizontal and vertical orientations
- 📝 Optional text labels with customizable alignment
- 〰️ Dashed line style support
- 🎨 Plain text variant for subtle labels
- 🌙 Dark theme support
- ♿ Semantic HTML with ARIA attributes
- 🎯 Fully customizable with CSS variables
- 📦 Minimal bundle size

## Installation

The Divider component is part of the `@web-loom/ui-react` package.

```bash
npm install @web-loom/ui-react
```

## Basic Usage

```tsx
import { Divider } from '@web-loom/ui-react';

function App() {
  return (
    <div>
      <p>Content above divider</p>
      <Divider />
      <p>Content below divider</p>
    </div>
  );
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'horizontal' \| 'vertical'` | `'horizontal'` | Type of divider |
| `orientation` | `'left' \| 'center' \| 'right'` | `'center'` | Text alignment (only for horizontal with text) |
| `dashed` | `boolean` | `false` | Whether to use dashed line style |
| `plain` | `boolean` | `false` | Whether to use plain text style (less emphasis) |
| `children` | `ReactNode` | - | Text or content to display in divider (only horizontal) |

All standard HTML div attributes are also supported (className, style, data-*, etc.).

## Examples

### Horizontal Divider (Default)

The default divider is a horizontal line.

```tsx
<div>
  <p>Section 1</p>
  <Divider />
  <p>Section 2</p>
</div>
```

### Divider with Text

Add text to the divider to label sections.

```tsx
<div>
  <p>Introduction content here...</p>
  <Divider>Chapter 1</Divider>
  <p>Chapter 1 content here...</p>
</div>
```

### Text Alignment

Control text position with the `orientation` prop.

#### Left Aligned

```tsx
<Divider orientation="left">Left Label</Divider>
```

#### Center Aligned (Default)

```tsx
<Divider orientation="center">Center Label</Divider>
```

#### Right Aligned

```tsx
<Divider orientation="right">Right Label</Divider>
```

### Dashed Style

Create dashed dividers for subtle separation.

```tsx
<Divider dashed />
```

With text:

```tsx
<Divider dashed>Optional Section</Divider>
```

### Plain Text

Use plain text style for less prominent labels.

```tsx
<Divider plain>Subtitle</Divider>
```

Combine with dashed:

```tsx
<Divider plain dashed>
  Less Important Section
</Divider>
```

### Vertical Divider

Use vertical dividers for inline content separation.

```tsx
<div>
  <span>Item 1</span>
  <Divider type="vertical" />
  <span>Item 2</span>
  <Divider type="vertical" />
  <span>Item 3</span>
</div>
```

**Note:** Vertical dividers ignore text content (children prop).

### Vertical Dashed

```tsx
<div>
  <a href="#link1">Link 1</a>
  <Divider type="vertical" dashed />
  <a href="#link2">Link 2</a>
</div>
```

### Custom Content

Dividers can contain any React node, not just text.

```tsx
<Divider>
  <span style={{
    background: '#1e40af',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px'
  }}>
    ⭐ Featured Section
  </span>
</Divider>
```

### Navigation Menu

Perfect for separating navigation items.

```tsx
<nav>
  <a href="#home">Home</a>
  <Divider type="vertical" />
  <a href="#about">About</a>
  <Divider type="vertical" />
  <a href="#contact">Contact</a>
</nav>
```

### Breadcrumb Navigation

```tsx
<div>
  <a href="#home">Home</a>
  <Divider type="vertical" />
  <a href="#products">Products</a>
  <Divider type="vertical" />
  <span>Current Page</span>
</div>
```

### Document Sections

Label sections in long documents.

```tsx
<article>
  <h1>Article Title</h1>

  <Divider orientation="left">
    <strong>📋 Summary</strong>
  </Divider>
  <p>Summary content...</p>

  <Divider orientation="left">
    <strong>📖 Details</strong>
  </Divider>
  <p>Detailed content...</p>

  <Divider orientation="left">
    <strong>✅ Conclusion</strong>
  </Divider>
  <p>Conclusion content...</p>
</article>
```

## Styling

The Divider component uses CSS custom properties from the Web Loom design system.

### CSS Variables Used

- `--spacing-*`: Margins and padding
- `--color-neutral-*`: Border and text colors
- `--border-width-*`: Line thickness
- `--typography-*`: Font properties

### Custom Styling

```tsx
<Divider
  className="my-divider"
  style={{ margin: '32px 0' }}
>
  Custom Styled
</Divider>
```

```css
.my-divider {
  --color-neutral-gray-200: #3b82f6;
  font-weight: bold;
}
```

## Accessibility

The Divider component follows accessibility best practices:

- Uses semantic `role="separator"` attribute
- Includes `aria-orientation` for screen readers
- Proper contrast ratios for text and lines
- Respects user's reduced motion preferences

## Dark Theme Support

The Divider automatically adapts to dark theme when `data-theme="dark"` is present:

```tsx
<div data-theme="dark">
  <Divider>Dark Theme Divider</Divider>
</div>
```

## Common Patterns

### Section Headers

```tsx
<Divider orientation="left">
  <h3 style={{ margin: 0 }}>Section Title</h3>
</Divider>
```

### Subtle Separators

```tsx
<Divider dashed plain>Optional Content Below</Divider>
```

### Inline Lists

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <span>Tag 1</span>
  <Divider type="vertical" />
  <span>Tag 2</span>
  <Divider type="vertical" />
  <span>Tag 3</span>
</div>
```

### Content Breaks

```tsx
<article>
  <p>Paragraph 1...</p>
  <p>Paragraph 2...</p>
  <Divider>* * *</Divider>
  <p>New section starts here...</p>
</article>
```

## TypeScript

The Divider component is fully typed:

```tsx
import { Divider, type DividerProps } from '@web-loom/ui-react';

const dividerProps: DividerProps = {
  type: 'horizontal',
  orientation: 'center',
  dashed: false,
  plain: false,
};

<Divider {...dividerProps}>Text</Divider>
```

## Browser Support

Works in all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

The Divider component is highly optimized:

- Pure CSS implementation (no JavaScript animations)
- Minimal DOM nodes
- Small bundle size (~1.5 kB)
- No re-render overhead

## Best Practices

1. **Use horizontal for section breaks**: Horizontal dividers work best for separating vertical content
2. **Use vertical for inline separation**: Vertical dividers are perfect for navigation menus and breadcrumbs
3. **Keep text concise**: Divider labels should be short and descriptive
4. **Use plain for subtle labels**: The plain prop reduces emphasis on less important sections
5. **Match spacing**: Adjust margins to match your content's vertical rhythm
6. **Avoid overuse**: Too many dividers can make content feel fragmented
7. **Consider alternatives**: Sometimes whitespace alone is sufficient

## Related Components

- **Card** - For contained content blocks
- **Layout** - For page-level structure
- **Space** - For consistent spacing

## Examples in Storybook

For interactive examples and live editing, check out the Divider stories in Storybook:

```bash
npm run storybook
```

Navigate to **Components → Divider** to explore all variants.

## Comparison with Native HR

While the HTML `<hr>` element provides basic horizontal rules, the Divider component offers:

- Vertical orientation support
- Text labels with alignment
- Dashed style option
- Theme integration
- Consistent design system integration
- TypeScript support
- Accessibility enhancements

## Migration from HR

Replace native `<hr>` with Divider:

```tsx
// Before
<hr />
<hr style={{ borderStyle: 'dashed' }} />

// After
<Divider />
<Divider dashed />
```

## License

MIT License - Part of the Web Loom UI library.
