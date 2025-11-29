# Grid/Card Layout Pattern

## Overview

The Grid/Card Layout pattern provides responsive grid layouts with keyboard navigation and selection support. It's perfect for photo galleries, product grids, dashboards, and any interface that displays items in a grid format. The pattern handles responsive breakpoints, 2D keyboard navigation (arrow keys), and both single and multi-selection modes.

**Key Features:**
- Responsive breakpoint-based column calculation
- 2D keyboard navigation (up, down, left, right)
- Single and multi-selection modes
- Wrapping support at grid boundaries
- Automatic viewport width tracking
- Focus management with roving focus
- Event-driven updates for focus and selection changes
- Accessibility-compliant grid navigation

## Installation

```bash
npm install @web-loom/ui-patterns
```

## Basic Usage

```typescript
import { createGridLayout } from '@web-loom/ui-patterns';

interface Photo {
  id: string;
  url: string;
  title: string;
}

const photos: Photo[] = [
  { id: '1', url: '/photo1.jpg', title: 'Sunset' },
  { id: '2', url: '/photo2.jpg', title: 'Mountains' },
  { id: '3', url: '/photo3.jpg', title: 'Ocean' },
  // ... more photos
];

// Create the grid layout
const grid = createGridLayout({
  items: photos,
  getId: (photo) => photo.id,
  breakpoints: [
    { minWidth: 0, columns: 1 },      // Mobile: 1 column
    { minWidth: 640, columns: 2 },    // Tablet: 2 columns
    { minWidth: 1024, columns: 3 },   // Desktop: 3 columns
    { minWidth: 1280, columns: 4 },   // Large: 4 columns
  ],
  selectionMode: 'single',
  wrap: true,
  onSelectionChange: (selected) => {
    console.log('Selected items:', selected);
  },
});

// Navigate with arrow keys
grid.actions.navigateRight(); // Move focus right
grid.actions.navigateDown();  // Move focus down
grid.actions.navigateLeft();  // Move focus left
grid.actions.navigateUp();    // Move focus up

// Select an item
grid.actions.selectItem('1');

// Update viewport width (typically on window resize)
grid.actions.updateViewportWidth(window.innerWidth);

// Subscribe to state changes
const unsubscribe = grid.subscribe((state) => {
  console.log('Focused index:', state.focusedIndex);
  console.log('Selected items:', state.selectedItems);
  console.log('Columns:', state.columns);
});

// Clean up when done
unsubscribe();
grid.destroy();
```

## API Reference

### `createGridLayout<T>(options)`

Creates a grid layout pattern instance.

**Parameters:**
- `options`: Configuration options
  - `items: T[]` - Array of items to display in the grid
  - `getId: (item: T) => string` - Function to extract unique ID from item
  - `breakpoints: Breakpoint[]` - Responsive breakpoint definitions
  - `selectionMode?: 'single' | 'multi'` - Selection mode (default: 'single')
  - `onSelectionChange?: (selected: T[]) => void` - Callback when selection changes
  - `wrap?: boolean` - Enable wrapping at grid boundaries (default: true)

**Returns:** `GridLayoutBehavior<T>`

### State Interface

```typescript
interface GridLayoutState<T> {
  items: T[];                    // All grid items
  columns: number;               // Current number of columns
  selectedItems: string[];       // IDs of selected items
  focusedIndex: number;          // Index of focused item
  breakpoint: Breakpoint;        // Current active breakpoint
  viewportWidth: number;         // Current viewport width
  selectionMode: 'single' | 'multi';
}
```

### Actions Interface

```typescript
interface GridLayoutActions<T> {
  selectItem: (itemId: string) => void;
  navigateUp: () => void;
  navigateDown: () => void;
  navigateLeft: () => void;
  navigateRight: () => void;
  setBreakpoints: (breakpoints: Breakpoint[]) => void;
  updateViewportWidth: (width: number) => void;
  setItems: (items: T[]) => void;
}
```

### Breakpoint Configuration

```typescript
interface Breakpoint {
  minWidth: number;              // Minimum viewport width for this breakpoint
  columns: number;               // Number of columns at this breakpoint
}
```

## Advanced Usage

### Responsive Breakpoints

Define custom breakpoints for your layout:

```typescript
const grid = createGridLayout({
  items: products,
  getId: (p) => p.id,
  breakpoints: [
    { minWidth: 0, columns: 1 },      // Extra small: 1 column
    { minWidth: 480, columns: 2 },    // Small: 2 columns
    { minWidth: 768, columns: 3 },    // Medium: 3 columns
    { minWidth: 1024, columns: 4 },   // Large: 4 columns
    { minWidth: 1440, columns: 5 },   // Extra large: 5 columns
    { minWidth: 1920, columns: 6 },   // 2K: 6 columns
  ],
});

// Listen for breakpoint changes
grid.eventBus.on('breakpoint:changed', (breakpoint) => {
  console.log(`Breakpoint changed: ${breakpoint.columns} columns`);
});
```

### Multi-Selection Mode

Enable multi-selection with Ctrl/Cmd and Shift keys:

```typescript
const grid = createGridLayout({
  items: files,
  getId: (f) => f.id,
  breakpoints: defaultBreakpoints,
  selectionMode: 'multi',
  onSelectionChange: (selected) => {
    console.log(`${selected.length} items selected`);
  },
});

// Select multiple items programmatically
grid.actions.selectItem('1'); // Select first item
grid.actions.selectItem('2'); // Add second item to selection
grid.actions.selectItem('3'); // Add third item to selection
```

### Dynamic Item Updates

Update grid items dynamically:

```typescript
const grid = createGridLayout({
  items: initialItems,
  getId: (item) => item.id,
  breakpoints: defaultBreakpoints,
});

// Add new items
const newItems = [...grid.getState().items, newItem];
grid.actions.setItems(newItems);

// Remove items
const filteredItems = grid.getState().items.filter((item) => item.id !== '5');
grid.actions.setItems(filteredItems);

// Sort items
const sortedItems = [...grid.getState().items].sort((a, b) =>
  a.title.localeCompare(b.title)
);
grid.actions.setItems(sortedItems);
```

### Viewport Tracking

Automatically update columns on window resize:

```typescript
const grid = createGridLayout({
  items,
  getId: (item) => item.id,
  breakpoints: defaultBreakpoints,
});

// Track viewport width
const handleResize = () => {
  grid.actions.updateViewportWidth(window.innerWidth);
};

window.addEventListener('resize', handleResize);

// Initial update
handleResize();

// Clean up
window.removeEventListener('resize', handleResize);
```

### Event-Driven Updates

Listen to grid events:

```typescript
const grid = createGridLayout({ /* ... */ });

// Listen for focus changes
grid.eventBus.on('item:focused', ({ index, itemId }) => {
  console.log(`Focused item ${itemId} at index ${index}`);
  // Update UI, load preview, etc.
});

// Listen for selection changes
grid.eventBus.on('item:selected', ({ itemId, selected }) => {
  console.log(`Item ${itemId} ${selected ? 'selected' : 'deselected'}`);
  // Update toolbar, show actions, etc.
});

// Listen for breakpoint changes
grid.eventBus.on('breakpoint:changed', (breakpoint) => {
  console.log(`Layout changed to ${breakpoint.columns} columns`);
  // Adjust UI, trigger animations, etc.
});
```

### Wrapping Behavior

Control wrapping at grid boundaries:

```typescript
// With wrapping (default)
const gridWithWrap = createGridLayout({
  items,
  getId: (item) => item.id,
  breakpoints: defaultBreakpoints,
  wrap: true, // Navigating right from last item goes to first
});

// Without wrapping
const gridNoWrap = createGridLayout({
  items,
  getId: (item) => item.id,
  breakpoints: defaultBreakpoints,
  wrap: false, // Navigating right from last item stays on last
});
```

## Framework Integration

### React

```typescript
import { useGridLayout } from '@web-loom/ui-patterns/react';
import { useState, useEffect } from 'react';

function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const grid = useGridLayout({
    items: photos,
    getId: (photo) => photo.id,
    breakpoints: [
      { minWidth: 0, columns: 1 },
      { minWidth: 640, columns: 2 },
      { minWidth: 1024, columns: 3 },
      { minWidth: 1280, columns: 4 },
    ],
    selectionMode: 'single',
  });

  const state = grid.getState();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      grid.actions.updateViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          grid.actions.navigateUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          grid.actions.navigateDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          grid.actions.navigateLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          grid.actions.navigateRight();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const focusedItem = state.items[state.focusedIndex];
          if (focusedItem) {
            grid.actions.selectItem(grid.getId(focusedItem));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.focusedIndex]);

  return (
    <div
      role="grid"
      aria-label="Photo Gallery"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${state.columns}, 1fr)`,
        gap: '1rem',
      }}
    >
      {state.items.map((photo, index) => (
        <div
          key={photo.id}
          role="gridcell"
          tabIndex={index === state.focusedIndex ? 0 : -1}
          aria-selected={state.selectedItems.includes(photo.id)}
          onClick={() => grid.actions.selectItem(photo.id)}
          style={{
            outline: index === state.focusedIndex ? '2px solid blue' : 'none',
          }}
        >
          <img src={photo.url} alt={photo.title} />
          <p>{photo.title}</p>
        </div>
      ))}
    </div>
  );
}
```

### Vue

```typescript
import { useGridLayout } from '@web-loom/ui-patterns/vue';
import { ref, computed, onMounted, onUnmounted } from 'vue';

export default {
  setup() {
    const photos = ref<Photo[]>([]);

    const grid = useGridLayout({
      items: photos.value,
      getId: (photo) => photo.id,
      breakpoints: [
        { minWidth: 0, columns: 1 },
        { minWidth: 640, columns: 2 },
        { minWidth: 1024, columns: 3 },
        { minWidth: 1280, columns: 4 },
      ],
      selectionMode: 'single',
    });

    const state = computed(() => grid.getState());

    const handleResize = () => {
      grid.actions.updateViewportWidth(window.innerWidth);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          grid.actions.navigateUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          grid.actions.navigateDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          grid.actions.navigateLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          grid.actions.navigateRight();
          break;
      }
    };

    onMounted(() => {
      window.addEventListener('resize', handleResize);
      window.addEventListener('keydown', handleKeyDown);
      handleResize();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    });

    return {
      state,
      selectItem: grid.actions.selectItem,
    };
  },
  template: `
    <div
      role="grid"
      aria-label="Photo Gallery"
      :style="{
        display: 'grid',
        gridTemplateColumns: \`repeat(\${state.columns}, 1fr)\`,
        gap: '1rem',
      }"
    >
      <div
        v-for="(photo, index) in state.items"
        :key="photo.id"
        role="gridcell"
        :tabindex="index === state.focusedIndex ? 0 : -1"
        :aria-selected="state.selectedItems.includes(photo.id)"
        @click="selectItem(photo.id)"
      >
        <img :src="photo.url" :alt="photo.title" />
        <p>{{ photo.title }}</p>
      </div>
    </div>
  `,
};
```

### Angular

```typescript
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { GridLayoutService } from '@web-loom/ui-patterns/angular';

@Component({
  selector: 'app-photo-gallery',
  template: `
    <div
      role="grid"
      aria-label="Photo Gallery"
      [style.display]="'grid'"
      [style.grid-template-columns]="'repeat(' + state.columns + ', 1fr)'"
      [style.gap]="'1rem'"
    >
      <div
        *ngFor="let photo of state.items; let i = index"
        role="gridcell"
        [tabindex]="i === state.focusedIndex ? 0 : -1"
        [attr.aria-selected]="state.selectedItems.includes(photo.id)"
        (click)="selectItem(photo.id)"
      >
        <img [src]="photo.url" [alt]="photo.title" />
        <p>{{ photo.title }}</p>
      </div>
    </div>
  `,
  providers: [GridLayoutService],
})
export class PhotoGalleryComponent implements OnInit, OnDestroy {
  state: any;

  constructor(private grid: GridLayoutService) {}

  ngOnInit() {
    this.grid.initialize({
      items: this.photos,
      getId: (photo) => photo.id,
      breakpoints: [
        { minWidth: 0, columns: 1 },
        { minWidth: 640, columns: 2 },
        { minWidth: 1024, columns: 3 },
        { minWidth: 1280, columns: 4 },
      ],
      selectionMode: 'single',
    });

    this.grid.state$.subscribe((state) => {
      this.state = state;
    });

    this.handleResize();
  }

  @HostListener('window:resize')
  handleResize() {
    this.grid.updateViewportWidth(window.innerWidth);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.grid.navigateUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.grid.navigateDown();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.grid.navigateLeft();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.grid.navigateRight();
        break;
    }
  }

  selectItem(itemId: string) {
    this.grid.selectItem(itemId);
  }

  ngOnDestroy() {
    this.grid.destroy();
  }
}
```

## Accessibility Guidelines

### ARIA Grid Role

Use proper ARIA roles for grid structure:

```html
<div role="grid" aria-label="Photo Gallery" aria-rowcount="10">
  <div role="row" aria-rowindex="1">
    <div role="gridcell" aria-colindex="1" tabindex="0">Item 1</div>
    <div role="gridcell" aria-colindex="2" tabindex="-1">Item 2</div>
    <div role="gridcell" aria-colindex="3" tabindex="-1">Item 3</div>
  </div>
  <div role="row" aria-rowindex="2">
    <div role="gridcell" aria-colindex="1" tabindex="-1">Item 4</div>
    <div role="gridcell" aria-colindex="2" tabindex="-1">Item 5</div>
    <div role="gridcell" aria-colindex="3" tabindex="-1">Item 6</div>
  </div>
</div>
```

### Focus Management

Only one gridcell should be focusable at a time:

```typescript
// Correct: Only focused item has tabindex="0"
<div
  role="gridcell"
  tabIndex={index === state.focusedIndex ? 0 : -1}
>
  {item.title}
</div>
```

### Screen Reader Announcements

Announce grid position and selection:

```typescript
function announceGridPosition(index: number, columns: number, total: number) {
  const row = Math.floor(index / columns) + 1;
  const col = (index % columns) + 1;
  const totalRows = Math.ceil(total / columns);

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `Row ${row} of ${totalRows}, Column ${col} of ${columns}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

grid.eventBus.on('item:focused', ({ index }) => {
  const state = grid.getState();
  announceGridPosition(index, state.columns, state.items.length);
});
```

### Selection Announcements

Announce selection changes:

```typescript
grid.eventBus.on('item:selected', ({ itemId, selected }) => {
  const item = grid.getState().items.find((i) => grid.getId(i) === itemId);
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = selected
    ? `${item.title} selected`
    : `${item.title} deselected`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
});
```

### Keyboard Shortcuts

Document keyboard shortcuts for users:

```typescript
// Add keyboard shortcut help
const shortcuts = [
  { key: 'Arrow Keys', description: 'Navigate grid' },
  { key: 'Enter/Space', description: 'Select item' },
  { key: 'Ctrl+A', description: 'Select all (multi-select mode)' },
  { key: 'Escape', description: 'Clear selection' },
];
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  Breakpoint,
  GridLayoutState,
  GridLayoutActions,
  GridLayoutBehavior,
  GridLayoutOptions,
} from '@web-loom/ui-patterns';

// Type-safe item interface
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

// Type-safe grid configuration
const options: GridLayoutOptions<Product> = {
  items: products,
  getId: (product) => product.id,
  breakpoints: [
    { minWidth: 0, columns: 1 },
    { minWidth: 768, columns: 3 },
  ],
  selectionMode: 'multi',
};

const grid: GridLayoutBehavior<Product> = createGridLayout(options);
```

## Performance Considerations

### Virtualization for Large Grids

For grids with many items, consider virtualization:

```typescript
// Use with react-window or similar virtualization library
import { FixedSizeGrid } from 'react-window';

function VirtualizedGrid() {
  const grid = useGridLayout({ /* ... */ });
  const state = grid.getState();

  return (
    <FixedSizeGrid
      columnCount={state.columns}
      columnWidth={200}
      height={600}
      rowCount={Math.ceil(state.items.length / state.columns)}
      rowHeight={200}
      width={800}
    >
      {({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * state.columns + columnIndex;
        const item = state.items[index];
        return item ? (
          <div style={style}>{/* Render item */}</div>
        ) : null;
      }}
    </FixedSizeGrid>
  );
}
```

### Debounced Resize Handling

Debounce resize events for better performance:

```typescript
import { debounce } from 'lodash';

const handleResize = debounce(() => {
  grid.actions.updateViewportWidth(window.innerWidth);
}, 150);

window.addEventListener('resize', handleResize);
```

### Memoization

Memoize expensive calculations:

```typescript
const gridStyle = useMemo(
  () => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${state.columns}, 1fr)`,
    gap: '1rem',
  }),
  [state.columns]
);
```

## Common Patterns

### Photo Gallery

```typescript
const photoGallery = createGridLayout({
  items: photos,
  getId: (photo) => photo.id,
  breakpoints: [
    { minWidth: 0, columns: 1 },
    { minWidth: 640, columns: 2 },
    { minWidth: 1024, columns: 3 },
    { minWidth: 1280, columns: 4 },
  ],
  selectionMode: 'single',
  onSelectionChange: (selected) => {
    if (selected.length > 0) {
      openLightbox(selected[0]);
    }
  },
});
```

### Product Grid

```typescript
const productGrid = createGridLayout({
  items: products,
  getId: (product) => product.id,
  breakpoints: [
    { minWidth: 0, columns: 1 },
    { minWidth: 480, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
  ],
  selectionMode: 'multi',
  onSelectionChange: (selected) => {
    updateCart(selected);
  },
});
```

### Dashboard Widgets

```typescript
const dashboard = createGridLayout({
  items: widgets,
  getId: (widget) => widget.id,
  breakpoints: [
    { minWidth: 0, columns: 1 },
    { minWidth: 768, columns: 2 },
    { minWidth: 1280, columns: 3 },
  ],
  selectionMode: 'single',
  wrap: false,
});
```

## Bundle Size

- Gzipped: ~2.8KB
- Tree-shakeable: Import only what you need
- Dependencies: @web-loom/ui-core, @web-loom/store-core, @web-loom/event-bus-core

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (requires modern JavaScript)

## Related Patterns

- **Master-Detail**: For list-detail views
- **Command Palette**: For keyboard-driven interfaces
- **Tabbed Interface**: For tabbed content organization

## License

MIT


---

## Framework-Specific Examples

For comprehensive framework-specific implementation examples, see:

- **[React Examples](./examples/REACT_EXAMPLES.md#gridcard-layout)** - Complete React implementations including:
  - Photo gallery with responsive grid and keyboard navigation
  - Product grid with selection management
  - Integration with viewport resize handling
  
- **[Vue Examples](./examples/VUE_EXAMPLES.md#gridcard-layout)** - Vue 3 Composition API examples with:
  - Reactive grid layout with breakpoints
  - Keyboard navigation implementation
  - Selection state management

- **[Angular Examples](./examples/ANGULAR_EXAMPLES.md#gridcard-layout)** - Angular service-based examples featuring:
  - Observable-based grid state
  - Responsive breakpoint handling
  - Accessibility-compliant keyboard navigation

These examples demonstrate responsive design patterns, keyboard accessibility, and performance optimization techniques.
