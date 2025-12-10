# Tabs Component

Accessible tabs component for organizing content in tabbed panels with support for multiple types, positions, keyboard navigation, and editable functionality.

## Features

- ✅ **Multiple Tab Types**: Line (default), Card, and Editable Card
- ✅ **Four Positions**: Top, Bottom, Left, and Right
- ✅ **Three Sizes**: Small, Middle (default), and Large
- ✅ **Keyboard Navigation**: Full arrow key, Home, and End support
- ✅ **Editable Tabs**: Add and remove tabs dynamically
- ✅ **Controlled/Uncontrolled**: Flexible state management
- ✅ **Accessibility**: Full ARIA support and keyboard navigation
- ✅ **TypeScript**: Complete type safety
- ✅ **Responsive**: Works across all screen sizes
- ✅ **Dark Theme**: Built-in dark theme support

## Installation

The Tabs component is part of the `@web-loom/ui-react` package.

```bash
npm install @web-loom/ui-react
```

## Basic Usage

```tsx
import { Tabs } from '@web-loom/ui-react';

function App() {
  return (
    <Tabs defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab="Tab 1">
        Content of Tab 1
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Tab 2">
        Content of Tab 2
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Tab 3">
        Content of Tab 3
      </Tabs.TabPane>
    </Tabs>
  );
}
```

## API Reference

### Tabs

Main tabs container component.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeKey` | `string` | - | Currently active tab key (controlled mode) |
| `defaultActiveKey` | `string` | First tab key | Default active tab key (uncontrolled mode) |
| `type` | `'line' \| 'card' \| 'editable-card'` | `'line'` | Tab type variant |
| `size` | `'large' \| 'middle' \| 'small'` | `'middle'` | Tab size |
| `tabPosition` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Position of tabs |
| `onChange` | `(activeKey: string) => void` | - | Callback when active tab changes |
| `onEdit` | `(targetKey: string, action: 'add' \| 'remove') => void` | - | Callback for editable tabs (add/remove) |
| `className` | `string` | - | Additional CSS class name |

### Tabs.TabPane

Individual tab pane component.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabKey` | `string` | - | **Required.** Unique key for the tab pane |
| `tab` | `ReactNode` | - | **Required.** Tab label/title |
| `disabled` | `boolean` | `false` | Whether the tab is disabled |
| `closable` | `boolean` | `true` | Whether the tab is closable (only for editable-card type) |
| `children` | `ReactNode` | - | Tab pane content |

## Examples

### Card Type

```tsx
<Tabs type="card" defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab="Card Tab 1">
    Content of Card Tab 1
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="2" tab="Card Tab 2">
    Content of Card Tab 2
  </Tabs.TabPane>
</Tabs>
```

### Editable Card

```tsx
function EditableTabs() {
  const [tabs, setTabs] = useState([
    { key: '1', tab: 'Tab 1', content: 'Content 1' },
    { key: '2', tab: 'Tab 2', content: 'Content 2' },
  ]);
  const [activeKey, setActiveKey] = useState('1');

  const handleEdit = (targetKey: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      const newKey = `${Date.now()}`;
      setTabs([...tabs, {
        key: newKey,
        tab: 'New Tab',
        content: 'New Content'
      }]);
      setActiveKey(newKey);
    } else {
      const newTabs = tabs.filter((tab) => tab.key !== targetKey);
      setTabs(newTabs);
      if (activeKey === targetKey && newTabs.length > 0) {
        setActiveKey(newTabs[0].key);
      }
    }
  };

  return (
    <Tabs
      type="editable-card"
      activeKey={activeKey}
      onChange={setActiveKey}
      onEdit={handleEdit}
    >
      {tabs.map((tab) => (
        <Tabs.TabPane key={tab.key} tabKey={tab.key} tab={tab.tab}>
          {tab.content}
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
}
```

### Different Positions

```tsx
// Top position (default)
<Tabs tabPosition="top" defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab="Tab 1">Content 1</Tabs.TabPane>
</Tabs>

// Bottom position
<Tabs tabPosition="bottom" defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab="Tab 1">Content 1</Tabs.TabPane>
</Tabs>

// Left position
<Tabs tabPosition="left" defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab="Tab 1">Content 1</Tabs.TabPane>
</Tabs>

// Right position
<Tabs tabPosition="right" defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab="Tab 1">Content 1</Tabs.TabPane>
</Tabs>
```

### Disabled Tab

```tsx
<Tabs defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab="Tab 1">
    Content 1
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="2" tab="Tab 2 (Disabled)" disabled>
    Content 2
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="3" tab="Tab 3">
    Content 3
  </Tabs.TabPane>
</Tabs>
```

### Controlled Mode

```tsx
function ControlledTabs() {
  const [activeKey, setActiveKey] = useState('1');

  return (
    <div>
      <div>
        <button onClick={() => setActiveKey('1')}>Tab 1</button>
        <button onClick={() => setActiveKey('2')}>Tab 2</button>
      </div>
      <Tabs activeKey={activeKey} onChange={setActiveKey}>
        <Tabs.TabPane tabKey="1" tab="Tab 1">Content 1</Tabs.TabPane>
        <Tabs.TabPane tabKey="2" tab="Tab 2">Content 2</Tabs.TabPane>
      </Tabs>
    </div>
  );
}
```

### With Icons

```tsx
<Tabs defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab={<span>🏠 Home</span>}>
    Home content
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="2" tab={<span>⚙️ Settings</span>}>
    Settings content
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="3" tab={<span>👤 Profile</span>}>
    Profile content
  </Tabs.TabPane>
</Tabs>
```

### Different Sizes

```tsx
// Small
<Tabs size="small" defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab="Small Tab">Content</Tabs.TabPane>
</Tabs>

// Middle (default)
<Tabs size="middle" defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab="Middle Tab">Content</Tabs.TabPane>
</Tabs>

// Large
<Tabs size="large" defaultActiveKey="1">
  <Tabs.TabPane tabKey="1" tab="Large Tab">Content</Tabs.TabPane>
</Tabs>
```

### Non-Closable Tabs in Editable Card

```tsx
function EditableWithFixedTab() {
  const [tabs, setTabs] = useState([
    { key: 'home', tab: 'Home', content: 'Home', closable: false },
    { key: '1', tab: 'Tab 1', content: 'Content 1', closable: true },
  ]);
  const [activeKey, setActiveKey] = useState('home');

  const handleEdit = (targetKey: string, action: 'add' | 'remove') => {
    // ... edit logic
  };

  return (
    <Tabs
      type="editable-card"
      activeKey={activeKey}
      onChange={setActiveKey}
      onEdit={handleEdit}
    >
      {tabs.map((tab) => (
        <Tabs.TabPane
          key={tab.key}
          tabKey={tab.key}
          tab={tab.tab}
          closable={tab.closable}
        >
          {tab.content}
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
}
```

## Keyboard Navigation

The Tabs component supports full keyboard navigation:

- **Arrow Left/Up**: Navigate to previous tab (wraps around)
- **Arrow Right/Down**: Navigate to next tab (wraps around)
- **Home**: Navigate to first tab
- **End**: Navigate to last tab
- **Enter/Space**: Activate focused tab
- **Tab**: Move focus to next focusable element

## Accessibility

The Tabs component follows WAI-ARIA best practices:

- `role="tablist"` on the tab navigation container
- `role="tab"` on each tab
- `role="tabpanel"` on each tab content panel
- `aria-selected` indicates the selected tab
- `aria-disabled` indicates disabled tabs
- `aria-hidden` hides inactive tab panels from screen readers
- `aria-orientation` indicates horizontal or vertical layout
- `tabIndex` management for keyboard navigation

## Styling

The Tabs component uses CSS custom properties from the design system:

### Colors
- `--color-base-primary`: Active tab color
- `--color-neutral-gray-*`: Borders, backgrounds, and text colors
- `--color-neutral-white`: White backgrounds

### Typography
- `--typography-font-size-*`: Font sizes for different sizes
- `--typography-font-weight-*`: Font weights

### Spacing
- `--spacing-*`: Padding and margins

### Border
- `--border-width-1`: Border widths
- `--radius-*`: Border radius

### Timing
- `--timing-fast`: Transition duration
- `--timing-normal`: Animation duration

### Dark Theme

The component automatically supports dark theme via `[data-theme='dark']` attribute:

```tsx
<div data-theme="dark">
  <Tabs defaultActiveKey="1">
    <Tabs.TabPane tabKey="1" tab="Tab 1">Dark theme content</Tabs.TabPane>
  </Tabs>
</div>
```

## Best Practices

### 1. Use Unique Keys

Always provide unique `tabKey` values for each TabPane:

```tsx
// ✅ Good
<Tabs.TabPane tabKey="unique-1" tab="Tab 1">...</Tabs.TabPane>
<Tabs.TabPane tabKey="unique-2" tab="Tab 2">...</Tabs.TabPane>

// ❌ Bad
<Tabs.TabPane tabKey="1" tab="Tab 1">...</Tabs.TabPane>
<Tabs.TabPane tabKey="1" tab="Tab 2">...</Tabs.TabPane>
```

### 2. Controlled vs Uncontrolled

Choose the appropriate mode based on your needs:

```tsx
// Uncontrolled - for simple cases
<Tabs defaultActiveKey="1">...</Tabs>

// Controlled - when you need to manage state externally
<Tabs activeKey={activeKey} onChange={setActiveKey}>...</Tabs>
```

### 3. Handle Editable Tabs Properly

When implementing editable tabs, always handle both add and remove actions:

```tsx
const handleEdit = (targetKey: string, action: 'add' | 'remove') => {
  if (action === 'add') {
    // Add new tab logic
  } else {
    // Remove tab logic
    // Remember to update activeKey if removing the active tab
  }
};
```

### 4. Set Appropriate Position

Choose tab position based on layout:

- `top`: Standard horizontal navigation (most common)
- `bottom`: Alternative horizontal layout
- `left`: Vertical sidebar navigation
- `right`: Alternative vertical layout

### 5. Use Descriptive Tab Labels

Provide clear, concise tab labels:

```tsx
// ✅ Good
<Tabs.TabPane tabKey="1" tab="Account Settings">...</Tabs.TabPane>

// ❌ Bad
<Tabs.TabPane tabKey="1" tab="Tab 1">...</Tabs.TabPane>
```

### 6. Consider Tab Count

- **Line type**: Works well with 3-7 tabs
- **Card type**: Better for 2-5 tabs
- **Editable card**: Dynamic tab count

### 7. Responsive Design

For responsive layouts, consider changing tab position or type based on screen size.

## Common Use Cases

### 1. Application Settings

```tsx
<Tabs type="line" defaultActiveKey="profile">
  <Tabs.TabPane tabKey="profile" tab="Profile">
    <ProfileSettings />
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="security" tab="Security">
    <SecuritySettings />
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="notifications" tab="Notifications">
    <NotificationSettings />
  </Tabs.TabPane>
</Tabs>
```

### 2. Document Viewer

```tsx
<Tabs type="card" defaultActiveKey="preview">
  <Tabs.TabPane tabKey="preview" tab="Preview">
    <DocumentPreview />
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="source" tab="Source Code">
    <SourceCode />
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="comments" tab="Comments">
    <Comments />
  </Tabs.TabPane>
</Tabs>
```

### 3. Multi-Document Editor

```tsx
<Tabs type="editable-card" activeKey={activeDoc} onChange={setActiveDoc} onEdit={handleEdit}>
  {documents.map(doc => (
    <Tabs.TabPane key={doc.id} tabKey={doc.id} tab={doc.name}>
      <Editor content={doc.content} />
    </Tabs.TabPane>
  ))}
</Tabs>
```

### 4. Sidebar Navigation

```tsx
<Tabs tabPosition="left" defaultActiveKey="dashboard">
  <Tabs.TabPane tabKey="dashboard" tab="📊 Dashboard">
    <Dashboard />
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="analytics" tab="📈 Analytics">
    <Analytics />
  </Tabs.TabPane>
  <Tabs.TabPane tabKey="reports" tab="📄 Reports">
    <Reports />
  </Tabs.TabPane>
</Tabs>
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Related Components

- **Menu**: For hierarchical navigation
- **Breadcrumb**: For navigation hierarchy
- **Divider**: For visual separation within tabs

## Troubleshooting

### Tab content not updating

Ensure you're using unique `tabKey` values and the correct controlled/uncontrolled mode.

### Tabs not visible

Check that parent container has sufficient width (for horizontal tabs) or height (for vertical tabs).

### Keyboard navigation not working

Ensure the tabs container can receive focus and no other element is preventing event propagation.

### Editable tabs not working

Verify you've implemented the `onEdit` callback and are managing the tabs state correctly.

## Performance Tips

1. **Lazy Loading**: Load tab content only when the tab is activated
2. **Memoization**: Use `React.memo` for expensive tab content components
3. **Virtual Scrolling**: For tabs with very long content lists

## License

MIT
