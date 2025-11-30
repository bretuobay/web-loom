# Floating Action Button Pattern

## Overview

The Floating Action Button (FAB) pattern manages the visibility and behavior of a primary action button based on scroll position and direction. It's commonly used for actions like "Create New", "Scroll to Top", or "Compose" that should be easily accessible but not always visible. The pattern intelligently shows/hides the button based on scroll behavior and configurable thresholds.

**Key Features:**

- Scroll position tracking
- Scroll direction detection (up/down)
- Threshold-based visibility control
- Hide-on-scroll-down behavior
- Show-on-scroll-up behavior
- Event-driven visibility updates
- Configurable scroll threshold
- Performance-optimized for scroll events

## Installation

```bash
npm install @web-loom/ui-patterns
```

## Basic Usage

```typescript
import { createFloatingActionButton } from '@web-loom/ui-patterns';

// Create the FAB pattern
const fab = createFloatingActionButton({
  scrollThreshold: 200, // Show after scrolling 200px
  hideOnScrollDown: true, // Hide when scrolling down
  onVisibilityChange: (visible) => {
    console.log(`FAB is now ${visible ? 'visible' : 'hidden'}`);
  },
});

// Update scroll position (typically from scroll event)
window.addEventListener('scroll', () => {
  fab.actions.setScrollPosition(window.scrollY);
});

// Subscribe to state changes
const unsubscribe = fab.subscribe((state) => {
  console.log('FAB visible:', state.isVisible);
  console.log('Scroll direction:', state.scrollDirection);
});

// Manually control visibility
fab.actions.show();
fab.actions.hide();
fab.actions.toggle();

// Clean up when done
unsubscribe();
fab.destroy();
```

## API Reference

### `createFloatingActionButton(options?)`

Creates a floating action button pattern instance.

**Parameters:**

- `options` (optional): Configuration options
  - `scrollThreshold?: number` - Scroll position threshold for showing FAB (default: 100)
  - `hideOnScrollDown?: boolean` - Hide FAB when scrolling down (default: false)
  - `onVisibilityChange?: (visible: boolean) => void` - Callback when visibility changes

**Returns:** `FloatingActionButtonBehavior`

### State Interface

```typescript
interface FABState {
  isVisible: boolean; // Whether FAB is visible
  scrollPosition: number; // Current scroll position
  scrollDirection: 'up' | 'down' | null; // Scroll direction
  scrollThreshold: number; // Threshold for showing FAB
  hideOnScrollDown: boolean; // Whether to hide on scroll down
}
```

### Actions Interface

```typescript
interface FABActions {
  show: () => void;
  hide: () => void;
  setScrollPosition: (position: number) => void;
  setScrollThreshold: (threshold: number) => void;
  toggle: () => void;
  setHideOnScrollDown: (hide: boolean) => void;
}
```

## Advanced Usage

### Scroll-to-Top Button

Classic scroll-to-top FAB that appears after scrolling down:

```typescript
const scrollToTopFab = createFloatingActionButton({
  scrollThreshold: 300,
  hideOnScrollDown: false, // Always visible once threshold is reached
  onVisibilityChange: (visible) => {
    console.log(`Scroll to top button ${visible ? 'shown' : 'hidden'}`);
  },
});

// Track scroll position
window.addEventListener('scroll', () => {
  scrollToTopFab.actions.setScrollPosition(window.scrollY);
});

// Handle click
function handleScrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

### Hide-on-Scroll-Down Behavior

FAB that hides when scrolling down and shows when scrolling up:

```typescript
const smartFab = createFloatingActionButton({
  scrollThreshold: 100,
  hideOnScrollDown: true, // Hide when scrolling down
  onVisibilityChange: (visible) => {
    // Animate FAB in/out
    animateFab(visible);
  },
});

// Throttle scroll events for performance
import { throttle } from 'lodash';

const handleScroll = throttle(() => {
  smartFab.actions.setScrollPosition(window.scrollY);
}, 100);

window.addEventListener('scroll', handleScroll);
```

### Dynamic Threshold

Adjust threshold based on content or user behavior:

```typescript
const fab = createFloatingActionButton({
  scrollThreshold: 200,
});

// Adjust threshold based on viewport height
function adjustThreshold() {
  const viewportHeight = window.innerHeight;
  fab.actions.setScrollThreshold(viewportHeight * 0.5); // 50% of viewport
}

window.addEventListener('resize', adjustThreshold);
adjustThreshold();
```

### Multiple FABs

Manage multiple FABs with different behaviors:

```typescript
// Primary action FAB (always visible after threshold)
const primaryFab = createFloatingActionButton({
  scrollThreshold: 100,
  hideOnScrollDown: false,
});

// Secondary action FAB (hides on scroll down)
const secondaryFab = createFloatingActionButton({
  scrollThreshold: 200,
  hideOnScrollDown: true,
});

// Update both on scroll
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  primaryFab.actions.setScrollPosition(scrollY);
  secondaryFab.actions.setScrollPosition(scrollY);
});
```

### Event-Driven Updates

Listen to FAB events:

```typescript
const fab = createFloatingActionButton({
  scrollThreshold: 200,
  hideOnScrollDown: true,
});

// Listen for visibility changes
fab.eventBus.on('fab:shown', () => {
  console.log('FAB shown');
  // Trigger animation, analytics, etc.
});

fab.eventBus.on('fab:hidden', () => {
  console.log('FAB hidden');
  // Trigger animation, analytics, etc.
});
```

### Conditional Visibility

Control FAB visibility based on additional conditions:

```typescript
const fab = createFloatingActionButton({
  scrollThreshold: 200,
});

// Hide FAB when modal is open
let isModalOpen = false;

fab.subscribe((state) => {
  if (isModalOpen && state.isVisible) {
    fab.actions.hide();
  }
});

// Show/hide based on user permissions
const hasPermission = checkUserPermission();
if (!hasPermission) {
  fab.actions.hide();
}
```

## Framework Integration

### React

```typescript
import { useFloatingActionButton } from '@web-loom/ui-patterns/react';
import { useEffect, useState } from 'react';

function ScrollToTopButton() {
  const fab = useFloatingActionButton({
    scrollThreshold: 300,
    hideOnScrollDown: false,
  });

  const state = fab.getState();

  useEffect(() => {
    const handleScroll = () => {
      fab.actions.setScrollPosition(window.scrollY);
    };

    // Throttle for performance
    const throttledScroll = throttle(handleScroll, 100);

    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!state.isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fab"
      aria-label="Scroll to top"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        transition: 'opacity 0.3s ease',
      }}
    >
      ↑
    </button>
  );
}

// With hide-on-scroll-down
function CreateButton() {
  const fab = useFloatingActionButton({
    scrollThreshold: 100,
    hideOnScrollDown: true,
  });

  const state = fab.getState();

  useEffect(() => {
    const handleScroll = throttle(() => {
      fab.actions.setScrollPosition(window.scrollY);
    }, 100);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      onClick={() => console.log('Create new item')}
      className="fab"
      aria-label="Create new item"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        opacity: state.isVisible ? 1 : 0,
        transform: state.isVisible ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.3s ease',
      }}
    >
      +
    </button>
  );
}
```

### Vue

```typescript
import { useFloatingActionButton } from '@web-loom/ui-patterns/vue';
import { computed, onMounted, onUnmounted } from 'vue';
import { throttle } from 'lodash';

export default {
  setup() {
    const fab = useFloatingActionButton({
      scrollThreshold: 300,
      hideOnScrollDown: false,
    });

    const state = computed(() => fab.getState());

    const handleScroll = throttle(() => {
      fab.actions.setScrollPosition(window.scrollY);
    }, 100);

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    onMounted(() => {
      window.addEventListener('scroll', handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });

    return {
      state,
      scrollToTop,
    };
  },
  template: `
    <button
      v-if="state.isVisible"
      @click="scrollToTop"
      class="fab"
      aria-label="Scroll to top"
      :style="{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      }"
    >
      ↑
    </button>
  `,
};
```

### Angular

```typescript
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FloatingActionButtonService } from '@web-loom/ui-patterns/angular';
import { throttle } from 'lodash';

@Component({
  selector: 'app-scroll-to-top',
  template: `
    <button
      *ngIf="state.isVisible"
      (click)="scrollToTop()"
      class="fab"
      aria-label="Scroll to top"
      [style.position]="'fixed'"
      [style.bottom]="'2rem'"
      [style.right]="'2rem'"
    >
      ↑
    </button>
  `,
  providers: [FloatingActionButtonService],
})
export class ScrollToTopComponent implements OnInit, OnDestroy {
  state: any;
  private handleScroll: () => void;

  constructor(private fab: FloatingActionButtonService) {
    this.handleScroll = throttle(() => {
      this.fab.setScrollPosition(window.scrollY);
    }, 100);
  }

  ngOnInit() {
    this.fab.initialize({
      scrollThreshold: 300,
      hideOnScrollDown: false,
    });

    this.fab.state$.subscribe((state) => {
      this.state = state;
    });

    window.addEventListener('scroll', this.handleScroll);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.handleScroll);
    this.fab.destroy();
  }
}
```

## Accessibility Guidelines

### ARIA Attributes

Provide clear labels for screen readers:

```html
<button class="fab" aria-label="Scroll to top" aria-hidden="false">
  <span aria-hidden="true">↑</span>
</button>
```

### Keyboard Accessibility

Ensure FAB is keyboard accessible:

```typescript
// FAB should be focusable and activatable with keyboard
<button
  className="fab"
  onClick={handleAction}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAction();
    }
  }}
>
  +
</button>
```

### Focus Management

Manage focus when FAB appears/disappears:

```typescript
fab.eventBus.on('fab:shown', () => {
  // Don't automatically focus FAB - let user continue their flow
  // Only focus if user explicitly requested it
});

fab.eventBus.on('fab:hidden', () => {
  // If FAB had focus, move focus to appropriate element
  if (document.activeElement === fabButton) {
    document.body.focus();
  }
});
```

### Visibility Announcements

Announce FAB visibility changes (use sparingly):

```typescript
function announceVisibility(visible: boolean) {
  // Only announce if it's important for the user to know
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = visible ? 'Quick action button available' : 'Quick action button hidden';
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

// Use sparingly - don't announce every scroll change
fab.eventBus.once('fab:shown', () => {
  announceVisibility(true);
});
```

### Reduced Motion

Respect user's motion preferences:

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const fabStyle = {
  transition: prefersReducedMotion ? 'none' : 'all 0.3s ease',
};
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  FABState,
  FABActions,
  FloatingActionButtonBehavior,
  FloatingActionButtonOptions,
} from '@web-loom/ui-patterns';

// Type-safe options
const options: FloatingActionButtonOptions = {
  scrollThreshold: 200,
  hideOnScrollDown: true,
  onVisibilityChange: (visible: boolean) => {
    console.log(`Visible: ${visible}`);
  },
};

const fab: FloatingActionButtonBehavior = createFloatingActionButton(options);
```

## Performance Considerations

### Throttle Scroll Events

Always throttle scroll events to prevent performance issues:

```typescript
import { throttle } from 'lodash';

// Good: Throttled scroll handler
const handleScroll = throttle(() => {
  fab.actions.setScrollPosition(window.scrollY);
}, 100); // Update at most every 100ms

window.addEventListener('scroll', handleScroll);

// Bad: Unthrottled scroll handler (don't do this)
window.addEventListener('scroll', () => {
  fab.actions.setScrollPosition(window.scrollY);
});
```

### Use RequestAnimationFrame

For smoother animations, use requestAnimationFrame:

```typescript
let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      fab.actions.setScrollPosition(window.scrollY);
      ticking = false;
    });
    ticking = true;
  }
});
```

### CSS Transitions

Use CSS transitions for smooth animations:

```css
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fab.hidden {
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}
```

### Passive Event Listeners

Use passive event listeners for better scroll performance:

```typescript
window.addEventListener('scroll', handleScroll, { passive: true });
```

## Common Patterns

### Scroll to Top

```typescript
const scrollToTop = createFloatingActionButton({
  scrollThreshold: 300,
  hideOnScrollDown: false,
  onVisibilityChange: (visible) => {
    console.log(`Scroll to top ${visible ? 'shown' : 'hidden'}`);
  },
});

function handleScrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

### Create/Compose Action

```typescript
const createFab = createFloatingActionButton({
  scrollThreshold: 100,
  hideOnScrollDown: true,
  onVisibilityChange: (visible) => {
    // Animate FAB
    animateFab(visible);
  },
});

function handleCreate() {
  openCreateDialog();
}
```

### Context-Aware FAB

```typescript
const contextFab = createFloatingActionButton({
  scrollThreshold: 150,
  hideOnScrollDown: true,
});

// Change FAB action based on context
let currentContext = 'list';

function handleFabClick() {
  switch (currentContext) {
    case 'list':
      createNewItem();
      break;
    case 'detail':
      editItem();
      break;
    case 'search':
      clearSearch();
      break;
  }
}
```

### Multi-Action FAB (Speed Dial)

```typescript
const speedDialFab = createFloatingActionButton({
  scrollThreshold: 100,
  hideOnScrollDown: true,
});

const [isExpanded, setIsExpanded] = useState(false);

function toggleSpeedDial() {
  setIsExpanded(!isExpanded);
}

// Show secondary actions when expanded
{isExpanded && (
  <div className="speed-dial-actions">
    <button onClick={action1}>Action 1</button>
    <button onClick={action2}>Action 2</button>
    <button onClick={action3}>Action 3</button>
  </div>
)}
```

## Bundle Size

- Gzipped: ~0.9KB
- Tree-shakeable: Import only what you need
- Dependencies: @web-loom/store-core, @web-loom/event-bus-core

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (requires modern JavaScript)

## Related Patterns

- **Modal**: For overlay dialogs
- **Toast Queue**: For notifications
- **Command Palette**: For keyboard-driven actions

## Best Practices

1. **Always throttle scroll events** - Prevents performance issues
2. **Use CSS transitions** - Smoother animations than JavaScript
3. **Respect reduced motion** - Check user preferences
4. **Provide clear labels** - Essential for accessibility
5. **Don't overuse** - One primary FAB per page is usually enough
6. **Consider mobile** - Ensure FAB doesn't block content
7. **Test on devices** - Verify touch targets are large enough (min 44x44px)

## License

MIT

---

## Framework-Specific Examples

For comprehensive framework-specific implementation examples, see:

- **[React Examples](./examples/REACT_EXAMPLES.md#floating-action-button)** - Complete React implementations including:
  - Scroll-aware FAB with hide-on-scroll-down behavior
  - Create new item FAB with dialog integration
  - Throttled scroll event handling
- **[Vue Examples](./examples/VUE_EXAMPLES.md#floating-action-button)** - Vue 3 Composition API examples with:
  - Reactive visibility state
  - Scroll position tracking
  - Smooth animations

- **[Angular Examples](./examples/ANGULAR_EXAMPLES.md#floating-action-button)** - Angular service-based examples featuring:
  - Observable-based visibility state
  - RxJS scroll event handling
  - Animation integration

These examples demonstrate performance optimization, smooth animations, and accessibility best practices for floating action buttons.
