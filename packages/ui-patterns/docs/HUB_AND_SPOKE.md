# Hub & Spoke Navigation Pattern

## Overview

The Hub & Spoke Navigation pattern provides a centralized navigation structure where users start at a central "hub" page and navigate to independent "spoke" pages. This pattern is ideal for applications with distinct sections that don't need to maintain state between each other, such as settings interfaces, dashboards with independent modules, or multi-section applications.

**Key Features:**
- Central hub as the main entry point
- Independent spoke pages with isolated state
- Automatic breadcrumb tracking
- Navigation history management
- Support for nested spokes (spokes within spokes)
- Event-driven navigation updates
- Optional browser history integration

## Installation

```bash
npm install @web-loom/ui-patterns
```

## Basic Usage

```typescript
import { createHubAndSpoke } from '@web-loom/ui-patterns';

// Define your spokes
const spokes = [
  { id: 'profile', label: 'Profile Settings', icon: 'user' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'billing', label: 'Billing', icon: 'credit-card' },
];

// Create the navigation pattern
const navigation = createHubAndSpoke({
  spokes,
  onSpokeActivate: (spokeId) => {
    console.log(`Navigated to: ${spokeId}`);
  },
  onReturnToHub: () => {
    console.log('Returned to hub');
  },
});

// Navigate to a spoke
navigation.actions.activateSpoke('profile');

// Check current state
console.log(navigation.getState().isOnHub); // false
console.log(navigation.getState().activeSpoke); // 'profile'
console.log(navigation.getState().breadcrumbs); // ['hub', 'profile']

// Return to hub
navigation.actions.returnToHub();

// Subscribe to state changes
const unsubscribe = navigation.subscribe((state) => {
  console.log('Navigation state:', state);
});

// Clean up when done
unsubscribe();
navigation.destroy();
```

## API Reference

### `createHubAndSpoke(options)`

Creates a hub-and-spoke navigation pattern instance.

**Parameters:**
- `options`: Configuration options
  - `spokes: Spoke[]` - Array of spoke definitions
  - `onSpokeActivate?: (spokeId: string) => void` - Callback when a spoke is activated
  - `onReturnToHub?: () => void` - Callback when returning to hub
  - `enableBrowserHistory?: boolean` - Enable browser history API integration (default: false)

**Returns:** `HubAndSpokeBehavior`

### State Interface

```typescript
interface HubAndSpokeState {
  isOnHub: boolean;              // Whether currently on hub page
  activeSpoke: string | null;    // ID of active spoke, or null if on hub
  spokes: Spoke[];               // Array of all spokes
  breadcrumbs: string[];         // Navigation breadcrumb trail
  navigationHistory: string[];   // Full navigation history
}
```

### Actions Interface

```typescript
interface HubAndSpokeActions {
  activateSpoke: (spokeId: string) => void;
  returnToHub: () => void;
  goBack: () => void;
  updateBreadcrumbs: (breadcrumbs: string[]) => void;
  addSpoke: (spoke: Spoke) => void;
  removeSpoke: (spokeId: string) => void;
}
```

### Spoke Configuration

```typescript
interface Spoke {
  id: string;                    // Unique identifier
  label: string;                 // Display label
  icon?: string;                 // Optional icon identifier
  subSpokes?: Spoke[];          // Optional nested spokes
}
```

## Advanced Usage

### Nested Spokes

Create hierarchical navigation with spokes that have their own sub-spokes:

```typescript
const spokes = [
  {
    id: 'account',
    label: 'Account Settings',
    subSpokes: [
      { id: 'profile', label: 'Profile' },
      { id: 'privacy', label: 'Privacy' },
      { id: 'preferences', label: 'Preferences' },
    ],
  },
  {
    id: 'team',
    label: 'Team Settings',
    subSpokes: [
      { id: 'members', label: 'Members' },
      { id: 'roles', label: 'Roles & Permissions' },
    ],
  },
];

const navigation = createHubAndSpoke({ spokes });

// Navigate to a nested spoke
navigation.actions.activateSpoke('account');
// Then navigate to a sub-spoke
navigation.actions.activateSpoke('profile');

// Breadcrumbs will show: ['hub', 'account', 'profile']
```

### Browser History Integration

Enable URL-based navigation with browser history:

```typescript
const navigation = createHubAndSpoke({
  spokes,
  enableBrowserHistory: true,
  onSpokeActivate: (spokeId) => {
    // URL will automatically update to /spoke/{spokeId}
    console.log(`Navigated to: ${spokeId}`);
  },
});

// Browser back/forward buttons will work automatically
```

### Dynamic Spoke Management

Add or remove spokes dynamically:

```typescript
const navigation = createHubAndSpoke({ spokes: [] });

// Add spokes dynamically
navigation.actions.addSpoke({
  id: 'new-feature',
  label: 'New Feature',
  icon: 'star',
});

// Remove a spoke
navigation.actions.removeSpoke('old-feature');
```

### Navigation History

Track and navigate through history:

```typescript
const navigation = createHubAndSpoke({ spokes });

navigation.actions.activateSpoke('profile');
navigation.actions.activateSpoke('security');
navigation.actions.activateSpoke('billing');

// Go back to previous spoke
navigation.actions.goBack(); // Returns to 'security'
navigation.actions.goBack(); // Returns to 'profile'
navigation.actions.goBack(); // Returns to hub

// Check navigation history
const state = navigation.getState();
console.log(state.navigationHistory); // ['hub', 'profile', 'security', 'billing']
```

### Event-Driven Updates

Listen to navigation events:

```typescript
const navigation = createHubAndSpoke({ spokes });

// Listen for spoke activation
navigation.eventBus.on('spoke:activated', (spokeId) => {
  console.log(`Spoke activated: ${spokeId}`);
  // Update analytics, load data, etc.
});

// Listen for hub return
navigation.eventBus.on('hub:returned', () => {
  console.log('Returned to hub');
  // Reset state, clear data, etc.
});
```

## Framework Integration

### React

```typescript
import { useHubAndSpoke } from '@web-loom/ui-patterns/react';
import { useState, useEffect } from 'react';

function SettingsApp() {
  const navigation = useHubAndSpoke({
    spokes: [
      { id: 'profile', label: 'Profile' },
      { id: 'security', label: 'Security' },
      { id: 'notifications', label: 'Notifications' },
    ],
  });

  const state = navigation.getState();

  return (
    <div>
      {state.isOnHub ? (
        <Hub spokes={state.spokes} onSpokeClick={navigation.actions.activateSpoke} />
      ) : (
        <Spoke
          spokeId={state.activeSpoke}
          breadcrumbs={state.breadcrumbs}
          onBack={navigation.actions.returnToHub}
        />
      )}
    </div>
  );
}

function Hub({ spokes, onSpokeClick }) {
  return (
    <div className="hub">
      <h1>Settings</h1>
      <nav>
        {spokes.map((spoke) => (
          <button key={spoke.id} onClick={() => onSpokeClick(spoke.id)}>
            {spoke.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

### Vue

```typescript
import { useHubAndSpoke } from '@web-loom/ui-patterns/vue';
import { computed } from 'vue';

export default {
  setup() {
    const navigation = useHubAndSpoke({
      spokes: [
        { id: 'profile', label: 'Profile' },
        { id: 'security', label: 'Security' },
        { id: 'notifications', label: 'Notifications' },
      ],
    });

    const state = computed(() => navigation.getState());

    return {
      state,
      activateSpoke: navigation.actions.activateSpoke,
      returnToHub: navigation.actions.returnToHub,
    };
  },
  template: `
    <div>
      <div v-if="state.isOnHub" class="hub">
        <h1>Settings</h1>
        <nav>
          <button
            v-for="spoke in state.spokes"
            :key="spoke.id"
            @click="activateSpoke(spoke.id)"
          >
            {{ spoke.label }}
          </button>
        </nav>
      </div>
      <div v-else class="spoke">
        <button @click="returnToHub">← Back to Hub</button>
        <h2>{{ state.activeSpoke }}</h2>
      </div>
    </div>
  `,
};
```

### Angular

```typescript
import { Component, OnInit } from '@angular/core';
import { HubAndSpokeService } from '@web-loom/ui-patterns/angular';

@Component({
  selector: 'app-settings',
  template: `
    <div *ngIf="state.isOnHub" class="hub">
      <h1>Settings</h1>
      <nav>
        <button
          *ngFor="let spoke of state.spokes"
          (click)="activateSpoke(spoke.id)"
        >
          {{ spoke.label }}
        </button>
      </nav>
    </div>
    <div *ngIf="!state.isOnHub" class="spoke">
      <button (click)="returnToHub()">← Back to Hub</button>
      <h2>{{ state.activeSpoke }}</h2>
    </div>
  `,
  providers: [HubAndSpokeService],
})
export class SettingsComponent implements OnInit {
  state: any;

  constructor(private navigation: HubAndSpokeService) {}

  ngOnInit() {
    this.navigation.initialize({
      spokes: [
        { id: 'profile', label: 'Profile' },
        { id: 'security', label: 'Security' },
        { id: 'notifications', label: 'Notifications' },
      ],
    });

    this.navigation.state$.subscribe((state) => {
      this.state = state;
    });
  }

  activateSpoke(spokeId: string) {
    this.navigation.activateSpoke(spokeId);
  }

  returnToHub() {
    this.navigation.returnToHub();
  }
}
```

## Accessibility Guidelines

### Semantic HTML

Use proper semantic HTML for navigation:

```html
<nav aria-label="Main Navigation">
  <ul role="list">
    <li>
      <a href="#hub" aria-current="page">Hub</a>
    </li>
    <li>
      <a href="#profile">Profile Settings</a>
    </li>
    <li>
      <a href="#security">Security</a>
    </li>
  </ul>
</nav>
```

### Breadcrumb Navigation

Implement accessible breadcrumbs:

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="#hub">Home</a></li>
    <li><a href="#account">Account</a></li>
    <li aria-current="page">Profile</li>
  </ol>
</nav>
```

### Screen Reader Announcements

Announce navigation changes:

```typescript
function announceNavigation(location: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = `Navigated to ${location}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

navigation.eventBus.on('spoke:activated', (spokeId) => {
  const spoke = spokes.find((s) => s.id === spokeId);
  announceNavigation(spoke?.label || spokeId);
});
```

### Keyboard Navigation

Ensure keyboard accessibility:

```typescript
// Add keyboard shortcuts for navigation
import { createKeyboardShortcuts } from '@web-loom/ui-core';

const shortcuts = createKeyboardShortcuts();

// Alt+H to return to hub
shortcuts.actions.registerShortcut({
  key: 'Alt+H',
  handler: () => navigation.actions.returnToHub(),
  description: 'Return to hub',
});

// Alt+Left to go back
shortcuts.actions.registerShortcut({
  key: 'Alt+ArrowLeft',
  handler: () => navigation.actions.goBack(),
  description: 'Go back',
});
```

### Focus Management

Manage focus when navigating:

```typescript
navigation.eventBus.on('spoke:activated', (spokeId) => {
  // Focus the main heading of the spoke
  const heading = document.querySelector(`#${spokeId}-heading`);
  if (heading instanceof HTMLElement) {
    heading.focus();
  }
});

navigation.eventBus.on('hub:returned', () => {
  // Focus the hub heading
  const hubHeading = document.querySelector('#hub-heading');
  if (hubHeading instanceof HTMLElement) {
    hubHeading.focus();
  }
});
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  Spoke,
  HubAndSpokeState,
  HubAndSpokeActions,
  HubAndSpokeBehavior,
  HubAndSpokeOptions,
} from '@web-loom/ui-patterns';

// Type-safe spoke configuration
const spokes: Spoke[] = [
  { id: 'profile', label: 'Profile Settings' },
  { id: 'security', label: 'Security' },
];

// Type-safe options
const options: HubAndSpokeOptions = {
  spokes,
  onSpokeActivate: (spokeId: string) => console.log(spokeId),
  enableBrowserHistory: true,
};
```

## Performance Considerations

### Lazy Loading Spokes

Load spoke content only when needed:

```typescript
const navigation = createHubAndSpoke({ spokes });

navigation.eventBus.on('spoke:activated', async (spokeId) => {
  // Lazy load spoke component
  const SpokeComponent = await import(`./spokes/${spokeId}`);
  renderSpoke(SpokeComponent);
});
```

### State Cleanup

Clean up spoke state when returning to hub:

```typescript
navigation.eventBus.on('hub:returned', () => {
  // Clear spoke-specific state
  clearSpokeData();
  // Reset any spoke-specific subscriptions
  unsubscribeFromSpokeEvents();
});
```

### Memory Management

Always clean up when components unmount:

```typescript
// React example
useEffect(() => {
  const navigation = createHubAndSpoke({ spokes });

  return () => navigation.destroy(); // Clean up
}, []);
```

## Common Patterns

### Settings Interface

```typescript
const settingsNav = createHubAndSpoke({
  spokes: [
    { id: 'general', label: 'General' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'privacy', label: 'Privacy & Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'advanced', label: 'Advanced' },
  ],
  onSpokeActivate: (spokeId) => {
    // Load settings for this section
    loadSettings(spokeId);
  },
});
```

### Dashboard Modules

```typescript
const dashboardNav = createHubAndSpoke({
  spokes: [
    { id: 'analytics', label: 'Analytics', icon: 'chart' },
    { id: 'reports', label: 'Reports', icon: 'file' },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'cog' },
  ],
  onSpokeActivate: (spokeId) => {
    // Load module data
    loadModuleData(spokeId);
  },
});
```

### Multi-Section Application

```typescript
const appNav = createHubAndSpoke({
  spokes: [
    {
      id: 'projects',
      label: 'Projects',
      subSpokes: [
        { id: 'active', label: 'Active Projects' },
        { id: 'archived', label: 'Archived Projects' },
      ],
    },
    {
      id: 'team',
      label: 'Team',
      subSpokes: [
        { id: 'members', label: 'Team Members' },
        { id: 'invites', label: 'Pending Invites' },
      ],
    },
  ],
  enableBrowserHistory: true,
});
```

## Bundle Size

- Gzipped: ~1.9KB
- Tree-shakeable: Import only what you need
- Dependencies: @web-loom/ui-core, @web-loom/store-core, @web-loom/event-bus-core

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (requires modern JavaScript)

## Related Patterns

- **Tabbed Interface**: For related content that shares state
- **Wizard**: For sequential, step-by-step flows
- **Master-Detail**: For list-detail views with synchronized state

## License

MIT
