# Card Component

A versatile card component for displaying content in a contained, structured layout. The Card component supports various configurations including borders, hover effects, loading states, cover images, actions, and can even be rendered as a clickable link.

## Features

- ✨ Multiple variants (bordered, borderless)
- 🎨 Customizable size (default, small)
- 🔗 Link support (renders as anchor tag)
- 🖼️ Cover image/media support
- ⚡ Loading skeleton state
- 🎯 Action buttons
- 🎭 Hover effects (optional)
- 🌙 Dark theme support
- ♿ Semantic HTML (article/anchor)
- 📱 Responsive design

## Installation

The Card component is part of the `@web-loom/ui-react` package.

```bash
npm install @web-loom/ui-react
```

## Basic Usage

```tsx
import { Card } from '@web-loom/ui-react';

function App() {
  return (
    <Card
      title="Card Title"
      description="This is a simple card with a title and description."
    />
  );
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `ReactNode` | - | Card title (appears in header) |
| `description` | `ReactNode` | - | Card description/body content |
| `children` | `ReactNode` | - | Alternative to description |
| `badge` | `ReactNode` | - | Badge displayed at the top of the card |
| `footer` | `ReactNode` | - | Footer content |
| `extra` | `ReactNode` | - | Extra content to display in the header (top-right) |
| `bordered` | `boolean` | `true` | Whether to show border |
| `hoverable` | `boolean` | `true` | Whether card has hover lift effect |
| `loading` | `boolean` | `false` | Show loading skeleton |
| `size` | `'default' \| 'small'` | `'default'` | Card size |
| `cover` | `ReactNode` | - | Cover image or media content |
| `actions` | `ReactNode[]` | - | Array of action elements displayed at the bottom |
| `href` | `string` | - | Makes card a clickable link |
| `rel` | `string` | `'noreferrer noopener'` | Link rel attribute (when href is provided) |
| `target` | `HTMLAttributeAnchorTarget` | `'_blank'` | Link target attribute (when href is provided) |

All standard HTML attributes for `<article>` or `<a>` elements are also supported.

## Examples

### Basic Card

```tsx
<Card
  title="Basic Card"
  description="A simple card with title and description."
/>
```

### Card with Badge and Footer

```tsx
<Card
  title="New Feature"
  description="Check out our latest release!"
  badge="New"
  footer={
    <>
      Learn more <span aria-hidden="true">→</span>
    </>
  }
/>
```

### Card with Extra Content

```tsx
<Card
  title="Settings"
  description="Configure your preferences"
  extra={<button onClick={() => alert('Settings')}>⚙️</button>}
/>
```

### Small Card

```tsx
<Card
  title="Small Card"
  description="Compact size with reduced padding."
  size="small"
/>
```

### Borderless Card

```tsx
<Card
  title="Borderless"
  description="Card without border, only shadow."
  bordered={false}
/>
```

### Non-Hoverable Card

```tsx
<Card
  title="Static Card"
  description="No hover effects on this card."
  hoverable={false}
/>
```

### Card with Cover Image

```tsx
<Card
  title="Beautiful Landscape"
  description="A stunning view captured at sunset."
  cover={
    <img
      src="/path/to/image.jpg"
      alt="Landscape"
      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
    />
  }
/>
```

### Card with Actions

```tsx
<Card
  title="User Profile"
  description="Manage your account"
  actions={[
    <button key="edit">Edit</button>,
    <button key="share">Share</button>,
    <button key="delete">Delete</button>,
  ]}
/>
```

### Card as Link

```tsx
<Card
  title="Documentation"
  description="Read our comprehensive guides"
  href="https://docs.example.com"
  footer="Opens in new tab"
/>
```

### Loading Card

```tsx
<Card
  title="Loading..."
  description="Content is being loaded"
  loading={true}
/>
```

### Complex Card (All Features)

```tsx
<Card
  title="Project Dashboard"
  description="Track your project progress in real-time."
  badge="Premium"
  extra={<span style={{ color: 'green' }}>● Active</span>}
  cover={
    <div style={{
      height: '150px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
    }}>
      📊 Analytics
    </div>
  }
  footer={
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <span>Last updated: 2 hours ago</span>
      <span>12 members</span>
    </div>
  }
  actions={[
    <button key="view">View</button>,
    <button key="report">Report</button>,
  ]}
/>
```

### Custom Title (ReactNode)

```tsx
<Card
  title={
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>🎨</span>
      <span>Custom Title</span>
    </div>
  }
  description="Title can be any React node"
/>
```

### Card Grid Layout

```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
  <Card title="Analytics" description="View dashboard" />
  <Card title="Reports" description="Generate reports" size="small" />
  <Card title="Settings" description="Configure app" hoverable={false} />
</div>
```

## Styling

The Card component uses CSS custom properties (CSS variables) from the Web Loom design system. You can customize the appearance by overriding these variables:

### CSS Variables Used

- `--spacing-*`: Padding and gap spacing
- `--radius-*`: Border radius
- `--color-*`: Colors for background, border, text
- `--shadow-*`: Box shadow values
- `--timing-*`: Transition durations
- `--border-*`: Border styles
- `--typography-*`: Font sizes and weights

### Custom Styling

```tsx
<Card
  title="Custom Styled Card"
  className="my-custom-card"
  style={{ maxWidth: '400px' }}
/>
```

```css
.my-custom-card {
  --color-base-primary: #3b82f6;
  border: 2px solid var(--color-base-primary);
}
```

## Accessibility

The Card component follows accessibility best practices:

- Uses semantic HTML (`<article>` or `<a>`)
- Proper heading structure (h3 for title when string)
- Keyboard navigable when used as link
- Focus indicators for interactive states
- ARIA attributes where appropriate

## Dark Theme Support

The Card component automatically adapts to dark theme when the `data-theme="dark"` attribute is present on a parent element:

```tsx
<div data-theme="dark">
  <Card title="Dark Theme Card" description="Automatically styled for dark mode" />
</div>
```

## TypeScript

The Card component is fully typed with TypeScript:

```tsx
import { Card, type CardProps } from '@web-loom/ui-react';

const cardProps: CardProps = {
  title: 'Typed Card',
  description: 'Full TypeScript support',
  size: 'small',
  bordered: true,
};

<Card {...cardProps} />
```

## Browser Support

The Card component works in all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Related Components

- **Layout** - For page-level layouts
- **Grid (Row/Col)** - For responsive grid layouts
- **Space** - For consistent spacing between elements

## Performance

The Card component is optimized for performance:

- Minimal re-renders
- CSS-based animations (GPU accelerated)
- Lazy loading support for images
- Small bundle size

## Best Practices

1. **Use semantic titles**: Prefer string titles for better SEO and accessibility
2. **Optimize images**: Use appropriate image sizes for cover images
3. **Limit actions**: Keep action count to 2-4 for better UX
4. **Loading state**: Show loading state when fetching data
5. **Hover feedback**: Keep `hoverable={true}` for interactive cards
6. **Consistent sizing**: Use consistent card sizes within the same context

## Examples in Storybook

For interactive examples and live editing, check out the Card stories in Storybook:

```bash
npm run storybook
```

Navigate to **Components → Card** to explore all variants.

## License

MIT License - Part of the Web Loom UI library.
