Below is a **full, comprehensive PRD** for the UI Core and UI Patterns packages within the Web Loom project.
It is structured like a real product specification, including architecture, package layout, API design principles, roadmap, and integration with existing Web Loom packages.

This PRD assumes:

- **TypeScript as the core language**
- **Turborepo as the monorepo tooling** (already in use)
- **Two new primary packages:**
  - `@web-loom/ui-core` (the micro-interaction logic layer)
  - `@web-loom/ui-patterns` (macro UI patterns composed from core behaviors)
- **Integration with existing Web Loom packages:**
  - `@web-loom/store-core` (for state management instead of third-party libraries)
  - `@web-loom/event-bus-core` (for cross-component communication)
  - `@web-loom/mvvm-core` (for optional MVVM patterns)

- A focus on **framework-agnostic, headless, small-footprint** behavior modules

---

# 📘 **Product Requirements Document (PRD)**

**Project Name:** **Web Loom UI Core & UI Patterns**
**Tagline:** _The universal headless behavior layer for modern frontend development, integrated into the Web Loom ecosystem._
**Version:** 1.0
**Last Updated:** 2025-11-15

---

# 1. 🎯 **Mission**

Modern frontend ecosystems have 100 tools for components and styling—but almost none that unify **UI interaction logic**. Teams rebuild the same behaviors (tabs, modals, wizards, form logic, selection models) across projects and frameworks.

**The Web Loom UI Core and UI Patterns packages solve this by extracting interaction logic into a universal layer** that integrates seamlessly with the existing Web Loom architecture:

- Framework-agnostic
- Headless (no styling or DOM assumptions)
- Composable
- Accessible by default
- Behavior-first, view-last

This creates a portable UI logic standard that can be used in:

- React
- Vue
- Svelte
- SolidJS
- Web Components
- Vanilla JS

---

# 2. 📦 **Project Structure (Web Loom Monorepo)**

The Web Loom monorepo already has a well-established structure. The new UI packages will integrate as follows:

```
web-loom/
  apps/
    mvvm-react/              # Existing - Can demo UI behaviors with React
    mvvm-angular/            # Existing - Can demo UI behaviors with Angular
    mvvm-vue/                # Existing - Can demo UI behaviors with Vue
    mvvm-vanilla/            # Existing - Can demo UI behaviors with Vanilla JS
    plugin-react/            # Existing
    ui-patterns-playground/  # NEW - Interactive playground for UI patterns
    ui-docs/                 # NEW - Documentation site for UI Core & Patterns
    api/                     # Existing
    docs/                    # Existing
  packages/
    # NEW UI PACKAGES
    ui-core/                 # NEW - @web-loom/ui-core (micro-interaction logic)
    ui-patterns/             # NEW - @web-loom/ui-patterns (macro UI patterns)

    # EXISTING PACKAGES (to be used by UI packages)
    store-core/              # Existing - State management (replaces nanostores)
    event-bus-core/          # Existing - Event communication
    mvvm-core/               # Existing - Optional MVVM integration
    query-core/              # Existing - Data fetching/caching
    design-core/             # Existing - Theme utilities
    view-models/             # Existing - Shared ViewModels
    models/                  # Existing - Data models
    plugin-core/             # Existing - Plugin architecture
    prose-scriber/           # Existing - Text/color utilities
    @repo/ui/                # Existing - React components
    @repo/shared/            # Existing - Shared utilities
    @repo/eslint-config/     # Existing
    @repo/typescript-config/ # Existing
```

Each package is fully typed, tested, and published independently following Web Loom conventions.

---

# 3. 🧩 **Packages Overview**

## **A. @web-loom/ui-core**

Low-level, reusable, atomic interaction logic built on top of Web Loom's existing packages.

### Core Behaviors Include:

- `createDialogBehavior` - Modal/dialog state management
- `createFormBehavior` - Form validation and state
- `createTabsBehavior` - Tab interface logic
- `createRovingFocus` - Keyboard navigation
- `createListSelection` - Single/multi/range selection
- `createKeyboardShortcuts` - Keyboard shortcut engine
- `createUndoRedoStack` - Undo/redo state management
- `createDisclosureBehavior` - Accordion/disclosure logic
- `createToastQueue` - Toast notification queue
- `createCommandPalette` - Command palette behavior
- `createDragDrop` - Drag-and-drop logic

### Characteristics

- **No DOM access** - Pure logic only
- **No styling** - Headless design
- **No rendering logic** - Framework-agnostic
- **Built on @web-loom/store-core** - Uses existing state management
- **Integrates with @web-loom/event-bus-core** - For cross-behavior communication
- **Pure state/event machines** - Deterministic behavior
- **Typed APIs** - Full TypeScript support
- **Extensible** - Easy to compose and extend
- **Lightweight** - <2KB per behavior (gzipped)

### Dependencies

```json
{
  "dependencies": {
    "@web-loom/store-core": "0.0.4",
    "@web-loom/event-bus-core": "0.0.2"
  }
}
```

---

## **B. @web-loom/ui-patterns**

Higher-level patterns assembled from core behaviors, integrating with Web Loom's architecture.

### Pattern Categories:

#### Navigation & Layout Patterns

- **Sidebar Shell** - Collapsible sidebar with route awareness
- **Tabbed Interface** - Tab navigation with panel management
- **Hub-and-Spoke Navigation** - Central hub with spoke activation
- **Fixed Header/Footer** - Sticky header/footer with scroll detection
- **Breadcrumb Navigation** - Hierarchical navigation path

#### Data & Content Patterns

- **Master–Detail (Split View)** - List selection with detail sync
- **Card/Grid Layout** - Responsive grid with keyboard nav
- **Accordion** - Expandable/collapsible content sections
- **Data Table** - Sortable, filterable, paginated tables
- **Infinite Scroll** - Virtualized list with lazy loading

#### Flow & Focus Patterns

- **Modal/Dialog** - Focus-trapped modal with stacking support
- **Wizard/Stepper** - Multi-step flow with validation gates
- **Floating Action Button (FAB)** - Scroll-aware primary action
- **Toast/Notification System** - Queue-based notifications
- **Command Palette** - Fuzzy search command interface
- **Dropdown/Menu** - Keyboard-navigable dropdowns

### Pattern Characteristics

Each pattern exposes:

- **State machines** - Deterministic state transitions
- **Event APIs** - Publish/subscribe event system using @web-loom/event-bus-core
- **Lifecycle rules** - Setup and teardown logic
- **Accessibility guidance** - ARIA patterns and keyboard navigation
- **Integration points** - Hooks for @web-loom/mvvm-core ViewModels
- **Theme support** - Compatible with @web-loom/design-core

### Dependencies

```json
{
  "dependencies": {
    "@web-loom/ui-core": "^1.0.0",
    "@web-loom/store-core": "0.0.4",
    "@web-loom/event-bus-core": "0.0.2"
  },
  "peerDependencies": {
    "@web-loom/mvvm-core": "^0.5.0",
    "@web-loom/query-core": "^0.0.2"
  }
}
```

---

# 4. 🏛️ **High-Level Architecture**

The UI Core and UI Patterns packages integrate seamlessly with Web Loom's existing architecture, leveraging established patterns and packages.

### Architecture Pillars:

### 1. **State Management with @web-loom/store-core**

All behaviors use `@web-loom/store-core` as the foundational state management layer, eliminating the need for external dependencies like nanostores.

```ts
import { createStore } from '@web-loom/store-core';

// Example: Dialog behavior state
const dialogStore = createStore(
  { isOpen: false, content: null },
  (set, get, actions) => ({
    open: (content) => set((state) => ({ ...state, isOpen: true, content })),
    close: () => set((state) => ({ ...state, isOpen: false, content: null })),
    toggle: () => set((state) => ({ ...state, isOpen: !state.isOpen })),
  })
);
```

**Benefits:**
- Consistent state management across all UI behaviors
- Minimal footprint (store-core is lightweight)
- Type-safe state and actions
- Subscription-based reactivity

### 2. **Event Communication with @web-loom/event-bus-core**

Cross-behavior communication uses the existing event bus for loose coupling:

```ts
import { createEventBus } from '@web-loom/event-bus-core';

const uiEventBus = createEventBus();

// Behaviors can emit and listen to events
uiEventBus.emit('dialog:opened', { dialogId: 'settings' });
uiEventBus.on('dialog:opened', (payload) => {
  // Handle dialog opened event
});
```

### 3. **State Machines (Lightweight, Deterministic)**

Each behavior is modeled as a deterministic state machine:

```ts
type DialogState = {
  status: 'idle' | 'opening' | 'open' | 'closing' | 'closed';
  isOpen: boolean;
  content: any;
};

type DialogEvents =
  | { type: 'OPEN'; payload: any }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' };
```

**We avoid heavy state machine libraries** and implement simple, focused state machines using `@web-loom/store-core`.

### 4. **Framework-Agnostic Reactive Primitives**

Behaviors expose simple, framework-agnostic APIs:

- `getState()` - Snapshot getter
- `subscribe(listener)` - Subscription function
- `actions` - Event dispatcher object
- `destroy()` - Cleanup function

### 5. **Serializable State**

All states are JSON-serializable for:
- Server-side rendering (SSR)
- State persistence
- Time-travel debugging
- State hydration

### 6. **Pure Functions & Side-Effect Isolation**

Core behaviors are pure functions with no side effects:
- No direct DOM manipulation
- No focus handling (delegated to adapters)
- No element lookups
- Predictable, testable behavior

### 7. **Accessibility-First Design**

Accessibility rules are encoded in behavior models:

- **Dialogs:** Focus trapping logic, escape key handling
- **Tabs:** Roving tabindex, arrow key navigation
- **Lists:** Selection announcements, keyboard shortcuts
- **Forms:** Validation error announcements

### 8. **Optional MVVM Integration**

Behaviors can optionally integrate with `@web-loom/mvvm-core`:

```ts
import { BaseViewModel } from '@web-loom/mvvm-core';
import { createDialogBehavior } from '@web-loom/ui-core';

class DialogViewModel extends BaseViewModel {
  private dialogBehavior = createDialogBehavior();

  get isOpen() {
    return this.dialogBehavior.getState().isOpen;
  }

  openDialog(content: any) {
    this.dialogBehavior.actions.open(content);
  }
}
```

---

# 5. 🧱 **Detailed Requirements**

---

# 5.1 **Core Package Requirements**

## **5.1.1 Core Patterns (Atomic Behaviors)**

### 1. **Dialog Behavior**

- `open()`, `close()`, `toggle()`
- `isOpen` store
- disallow background scroll
- focus trap rules (provided as callbacks)

### 2. **Disclosure/Accordion Behavior**

- ARIA attribute mapping suggestion
- Expand/collapse events
- Multi-panel vs single-panel modes

### 3. **Roving Focus**

Required by:

- menu bars
- tab lists
- lists with keyboard navigation
- carousels

### 4. **Selection Model Behavior**

Use cases:

- single selection
- multi selection
- range selection (Shift+click)
- toggle selection (Ctrl/Cmd+click)

### 5. **Form Behavior**

- field registry
- validation pipeline
- async validation
- touched/dirty states
- onSubmit state machine

### 6. **Stepper/Wizard Behavior**

- step activation
- branching (optional)
- back/next logic

### 7. **Undo/Redo Stack**

- stack of immutable states
- pointer
- limit max length

### 8. **Keyboard Shortcuts**

- event matching
- prevent default control
- scoped listener
- global listener

Each behavior must be <2KB gzipped.

---

# 5.2 **Patterns Package Requirements**

These combine multiple core behaviors.

### 1. **Sidebar Shell**

- expansion behavior
- active route behavior
- keyboard nav support
- persistent vs collapsible

### 2. **Tabbed Interface**

Uses:

- roving focus
- tab-state machine
- panel management

### 3. **Hub & Spoke Navigation**

- central hub state
- spoke activation
- breadcrumbs optional

### 4. **Master–Detail**

- list selection
- detail synchronization
- selection fallback behavior

### 5. **Grid/Card Layout**

- responsive breakpoint model (no CSS, pure logic)
- keyboard nav engine
- item selection model

### 6. **Modal/Dialog**

- composed from core dialog
- extended to include stacked modals

### 7. **Wizard/Flow**

- stepper core
- validation gates

### 8. **Floating Action Button**

- visibility rules (scroll threshold)
- scroll direction-aware

---

# 6. 📚 **Documentation Requirements**

### 6.1 Tutorials

- Getting started with React
- Using web-loom in Vue
- Using pure HTML with no framework

### 6.2 Playground Apps

- React playground
- Svelte playground

### 6.3 Patterns Cookbook

Code recipes for:

- Building a custom date picker
- Building a file explorer
- Building a multi-step form
- Building command palette

---

# 7. 🧪 **Testing Requirements**

### Unit Tests

- Vitest recommended

### Integration Tests

- Framework adaptors (React/Vue) tested with Playwright

### Accessibility

- Axe-core integrated

---

# 8. ⚙️ **Dependencies Strategy**

The UI Core and UI Patterns packages leverage Web Loom's existing infrastructure to minimize external dependencies.

## **A. Primary Dependencies (Web Loom Packages)**

### **State Management**
- **`@web-loom/store-core@0.0.4`** - Primary state management
  - Lightweight subscription-based store
  - Type-safe state and actions
  - Already proven in Web Loom ecosystem
  - **No need for nanostores or Zustand**

### **Event Communication**
- **`@web-loom/event-bus-core@0.0.2`** - Cross-behavior events
  - Pub/sub pattern for loose coupling
  - Framework-agnostic
  - Already integrated in Web Loom

### **Optional Integrations**
- **`@web-loom/mvvm-core@^0.5.0`** (peer dependency) - MVVM patterns
- **`@web-loom/query-core@^0.0.2`** (peer dependency) - Data fetching
- **`@web-loom/design-core@^0.0.2`** (peer dependency) - Theming

## **B. Minimal Third-Party Dependencies**

### **Accessibility Helpers (Adapter Layer Only)**
These are **optional** and only used in framework adapters, NOT in core:

- **`focus-trap`** (2.3kb) - Focus trapping for dialogs (optional)
- **`tabbable`** (1.5kb) - Finding focusable elements (optional)

### **Why We Avoid State Machine Libraries**
- ❌ **XState** - Too heavy (10kb+), unnecessary complexity
- ❌ **@xstate/fsm** - Still adds dependency overhead
- ✅ **Custom implementation** using `@web-loom/store-core` - Lightweight, sufficient

## **C. Development & Build Tooling (Already in Web Loom)**

- **Turborepo** - Monorepo orchestration (existing)
- **Vite** - Build tool for packages (existing)
- **Vitest** - Testing framework (existing)
- **TypeScript 5.8.2** - Type system (existing)
- **vite-plugin-dts** - TypeScript declaration generation (existing)
- **ESLint + Prettier** - Code quality (existing configs)

## **D. Zero New Build Dependencies**

The new packages will use the **exact same build setup** as existing Web Loom packages:
- Same `vite.config.ts` pattern
- Same `tsconfig.json` structure
- Same `vitest.config.js` setup
- Same `package.json` scripts

**This ensures:**
- Consistency across monorepo
- No learning curve for contributors
- Reduced maintenance burden
- Faster build times with Turbo cache

---

# 9. 🧭 **Design Principles**

These principles align with and extend Web Loom's existing architectural philosophy:

1. **Behavior over appearance** - Pure logic, no styling
2. **Framework-agnostic** - Works with React, Vue, Angular, Svelte, Vanilla JS
3. **Composable from small to large** - Atomic behaviors compose into patterns
4. **Typed from the core outward** - Full TypeScript coverage
5. **Minimal dependencies** - Leverage existing Web Loom packages
6. **Side-effect free core** - Pure functions, predictable behavior
7. **Developer-friendly APIs** - Intuitive, consistent interfaces
8. **Integration over isolation** - Works seamlessly with existing Web Loom packages
9. **Test-driven development** - Vitest tests for all behaviors
10. **Accessibility-first** - WCAG compliance built-in
11. **Performance-conscious** - <2KB per behavior, tree-shakeable
12. **Consistency with Web Loom patterns** - Follow established conventions

---

# 10. 🚀 **MVP Roadmap**

This roadmap integrates seamlessly with the existing Web Loom development workflow.

## **Phase 1: Package Setup & Core Foundations (3 Weeks)**

### Week 1: Package Infrastructure
- ✅ Create `packages/ui-core` with standard Web Loom structure
- ✅ Create `packages/ui-patterns` with standard Web Loom structure
- ✅ Set up `vite.config.ts`, `tsconfig.json`, `vitest.config.js`
- ✅ Configure dependencies on `@web-loom/store-core` and `@web-loom/event-bus-core`
- ✅ Add packages to Turborepo pipeline
- ✅ Set up test infrastructure (Vitest + jsdom)

### Week 2-3: Core Behaviors (ui-core)
- Implement `createDialogBehavior` with store-core
- Implement `createRovingFocus` (keyboard navigation)
- Implement `createListSelection` (single/multi/range selection)
- Implement `createDisclosureBehavior` (accordion/collapse)
- Implement `createFormBehavior` (validation pipeline)
- Write comprehensive tests for each behavior
- Document behavior APIs with TSDoc

**Deliverable:** `@web-loom/ui-core@0.1.0` with 5 core behaviors

## **Phase 2: Essential Patterns (4 Weeks)**

### Week 4-5: Navigation & Layout Patterns
- Implement Tabbed Interface (uses roving focus + disclosure)
- Implement Sidebar Shell (uses disclosure + event bus)
- Implement Modal/Dialog (uses dialog behavior + focus trap)
- Implement Accordion (uses disclosure behavior)

### Week 6-7: Data & Flow Patterns
- Implement Master-Detail (uses list selection)
- Implement Wizard/Stepper (uses form behavior + validation)
- Implement Toast Queue (uses event bus)
- Implement Command Palette (uses keyboard shortcuts + filtering)

**Deliverable:** `@web-loom/ui-patterns@0.1.0` with 8 patterns

## **Phase 3: Framework Adapters & Integration (4 Weeks)**

### Week 8-9: React Adapter
- Create React hooks for ui-core behaviors
- Integrate with existing `apps/mvvm-react`
- Add examples to existing React apps
- Test with React 19

### Week 10: Vue & Angular Adapters
- Create Vue composables for ui-core behaviors
- Create Angular services for ui-core behaviors
- Integrate with existing `apps/mvvm-vue` and `apps/mvvm-angular`
- Add examples to existing Vue and Angular apps

### Week 11: Vanilla JS & Documentation
- Add vanilla JS examples to `apps/mvvm-vanilla`
- Ensure patterns work without any framework
- Create adapter documentation

**Deliverable:** Framework adapters for React, Vue, Angular, Vanilla JS

## **Phase 4: Playground & Documentation (3 Weeks)**

### Week 12-13: Playground App
- Create `apps/ui-patterns-playground` (React-based)
- Interactive demos for all behaviors and patterns
- Live code editor with syntax highlighting
- Accessibility checker integration
- Responsive preview modes

### Week 14: Documentation Site
- Create `apps/ui-docs` (Next.js, like existing docs)
- API documentation auto-generated from TSDoc
- Tutorial series: "Building a Dashboard with UI Patterns"
- Integration guides for each framework
- Accessibility guidelines

**Deliverable:** Interactive playground and comprehensive documentation

## **Phase 5: Production Hardening & Launch (2 Weeks)**

### Week 15: Testing & Quality
- Increase test coverage to >90%
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Accessibility audits with axe-core and manual testing
- Performance profiling and optimization
- Bundle size analysis (ensure <2KB per behavior)

### Week 16: Launch Preparation
- Final API review and stabilization
- Migration guide from manual implementations
- Changelog and release notes
- npm publish scripts
- Version 1.0.0 release

**Deliverable:** Production-ready `@web-loom/ui-core@1.0.0` and `@web-loom/ui-patterns@1.0.0`

## **Post-Launch Roadmap (Future)**

### Advanced Behaviors
- Drag-and-drop system
- Infinite scroll with virtualization
- Advanced data table (sorting, filtering, pagination)
- Complex form flows with branching logic
- Rich text editor behaviors

### Additional Patterns
- Multi-level navigation (breadcrumbs + sidebar)
- Split pane with resizable panels
- Tree view with lazy loading
- Kanban board pattern
- Calendar/date picker pattern

### Ecosystem Integration
- Storybook integration
- Figma plugin for design-to-code
- DevTools for debugging behaviors
- VS Code extension for code generation

---

# 11. ✨ **Example API Design**

This section demonstrates how the UI behaviors integrate with Web Loom packages and work across frameworks.

## **Example 1: Dialog Behavior (Core)**

### Core Implementation (Framework-Agnostic)

```ts
// packages/ui-core/src/behaviors/dialog.ts
import { createStore } from '@web-loom/store-core';

export interface DialogState {
  isOpen: boolean;
  content: any;
  id: string | null;
}

export interface DialogBehaviorOptions {
  id?: string;
  onOpen?: (content: any) => void;
  onClose?: () => void;
}

export function createDialogBehavior(options: DialogBehaviorOptions = {}) {
  const store = createStore<DialogState, DialogActions>(
    { isOpen: false, content: null, id: options.id || null },
    (set, get, actions) => ({
      open: (content: any) => {
        set((state) => ({ ...state, isOpen: true, content }));
        options.onOpen?.(content);
      },
      close: () => {
        set((state) => ({ ...state, isOpen: false, content: null }));
        options.onClose?.();
      },
      toggle: (content?: any) => {
        const { isOpen } = get();
        if (isOpen) {
          actions.close();
        } else {
          actions.open(content);
        }
      },
    })
  );

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: store.destroy,
  };
}
```

## **Example 2: React Integration**

### React Hook Adapter

```tsx
// packages/ui-core/src/adapters/react/useDialogBehavior.ts
import { useEffect, useState } from 'react';
import { createDialogBehavior, DialogBehaviorOptions } from '../../behaviors/dialog';

export function useDialogBehavior(options?: DialogBehaviorOptions) {
  const [behavior] = useState(() => createDialogBehavior(options));
  const [state, setState] = useState(behavior.getState());

  useEffect(() => {
    const unsubscribe = behavior.subscribe((newState) => {
      setState(newState);
    });
    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, [behavior]);

  return {
    isOpen: state.isOpen,
    content: state.content,
    open: behavior.actions.open,
    close: behavior.actions.close,
    toggle: behavior.actions.toggle,
  };
}
```

### React Component Usage

```tsx
// Example usage in apps/mvvm-react
import { useDialogBehavior } from '@web-loom/ui-core/react';

function SettingsDialog() {
  const dialog = useDialogBehavior({
    id: 'settings-dialog',
    onOpen: (content) => console.log('Dialog opened:', content),
    onClose: () => console.log('Dialog closed'),
  });

  return (
    <>
      <button onClick={() => dialog.open({ tab: 'general' })}>
        Open Settings
      </button>

      {dialog.isOpen && (
        <div role="dialog" aria-modal="true">
          <h2>Settings</h2>
          <p>Active tab: {dialog.content?.tab}</p>
          <button onClick={dialog.close}>Close</button>
        </div>
      )}
    </>
  );
}
```

## **Example 3: Vue Integration**

### Vue Composable

```ts
// packages/ui-core/src/adapters/vue/useDialogBehavior.ts
import { ref, onUnmounted } from 'vue';
import { createDialogBehavior, DialogBehaviorOptions } from '../../behaviors/dialog';

export function useDialogBehavior(options?: DialogBehaviorOptions) {
  const behavior = createDialogBehavior(options);
  const state = ref(behavior.getState());

  const unsubscribe = behavior.subscribe((newState) => {
    state.value = newState;
  });

  onUnmounted(() => {
    unsubscribe();
    behavior.destroy();
  });

  return {
    isOpen: computed(() => state.value.isOpen),
    content: computed(() => state.value.content),
    open: behavior.actions.open,
    close: behavior.actions.close,
    toggle: behavior.actions.toggle,
  };
}
```

## **Example 4: Angular Integration**

### Angular Service

```ts
// packages/ui-core/src/adapters/angular/dialog-behavior.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createDialogBehavior, DialogState, DialogBehaviorOptions } from '../../behaviors/dialog';

@Injectable()
export class DialogBehaviorService implements OnDestroy {
  private behavior = createDialogBehavior();
  private state$ = new BehaviorSubject<DialogState>(this.behavior.getState());

  constructor() {
    this.behavior.subscribe((newState) => {
      this.state$.next(newState);
    });
  }

  getState$(): Observable<DialogState> {
    return this.state$.asObservable();
  }

  open(content: any): void {
    this.behavior.actions.open(content);
  }

  close(): void {
    this.behavior.actions.close();
  }

  toggle(content?: any): void {
    this.behavior.actions.toggle(content);
  }

  ngOnDestroy(): void {
    this.behavior.destroy();
    this.state$.complete();
  }
}
```

## **Example 5: Integration with MVVM Pattern**

### Using Dialog Behavior in a ViewModel

```ts
// packages/view-models/src/SettingsViewModel.ts
import { BaseViewModel } from '@web-loom/mvvm-core';
import { createDialogBehavior } from '@web-loom/ui-core';

export class SettingsViewModel extends BaseViewModel {
  private dialogBehavior = createDialogBehavior({
    id: 'settings-dialog',
  });

  constructor() {
    super();

    // Subscribe to dialog state changes
    this.dialogBehavior.subscribe((state) => {
      if (state.isOpen) {
        this.loadSettings();
      }
    });
  }

  get isDialogOpen(): boolean {
    return this.dialogBehavior.getState().isOpen;
  }

  openSettings(tab: string): void {
    this.dialogBehavior.actions.open({ tab });
  }

  closeSettings(): void {
    this.dialogBehavior.actions.close();
  }

  private loadSettings(): void {
    // Load settings data
  }

  dispose(): void {
    this.dialogBehavior.destroy();
    super.dispose();
  }
}
```

## **Example 6: Pattern Composition**

### Master-Detail Pattern Using Multiple Behaviors

```ts
// packages/ui-patterns/src/master-detail.ts
import { createStore } from '@web-loom/store-core';
import { createListSelection } from '@web-loom/ui-core';
import { createEventBus } from '@web-loom/event-bus-core';

export interface MasterDetailOptions<T> {
  items: T[];
  getId: (item: T) => string;
  onSelectionChange?: (selected: T | null) => void;
}

export function createMasterDetail<T>(options: MasterDetailOptions<T>) {
  const eventBus = createEventBus();
  const selection = createListSelection({
    mode: 'single',
    items: options.items.map(options.getId),
  });

  const store = createStore(
    {
      items: options.items,
      selectedItem: null as T | null,
      detailView: 'default' as string,
    },
    (set, get) => ({
      selectItem: (item: T) => {
        selection.actions.select(options.getId(item));
        set((state) => ({ ...state, selectedItem: item }));
        eventBus.emit('item:selected', item);
        options.onSelectionChange?.(item);
      },
      clearSelection: () => {
        selection.actions.clearSelection();
        set((state) => ({ ...state, selectedItem: null }));
        eventBus.emit('selection:cleared');
        options.onSelectionChange?.(null);
      },
      setDetailView: (view: string) => {
        set((state) => ({ ...state, detailView: view }));
      },
    })
  );

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    eventBus,
    destroy: () => {
      store.destroy();
      selection.destroy();
      eventBus.clear();
    },
  };
}
```

---

# 12. 🏁 **Success Metrics**

### Technical Goals

- **Bundle Size:**
  - < 2KB per individual behavior (gzipped)
  - < 20KB total for @web-loom/ui-core (gzipped)
  - < 30KB total for @web-loom/ui-patterns (gzipped)
  - Tree-shakeable exports (only import what you use)

- **Performance:**
  - State updates < 1ms (in 95th percentile)
  - Zero layout thrashing (no DOM access in core)
  - Support for 10,000+ list items with virtualization

- **Framework Compatibility:**
  - Works with React 18+, Vue 3+, Angular 14+, Svelte 4+
  - Vanilla JavaScript support (no framework required)
  - SSR-compatible (Next.js, Nuxt, SvelteKit)

- **Type Safety:**
  - 100% TypeScript coverage
  - Zero `any` types in public APIs
  - Comprehensive JSDoc for all exports

- **Testing:**
  - >90% code coverage (Vitest)
  - All behaviors tested in isolation
  - Integration tests for patterns
  - Accessibility tests with axe-core

### Developer Experience Metrics

- **Adoption:**
  - Used in all existing Web Loom demo apps (React, Vue, Angular, Vanilla)
  - >5 real-world projects using the packages
  - >100 npm downloads per week (after 3 months)

- **Developer Productivity:**
  - 50% reduction in time to implement common UI patterns
  - 70% reduction in UI interaction bugs
  - Code reuse across multiple frameworks
  - Smaller cognitive load (documented, predictable APIs)

- **Documentation Quality:**
  - Complete API documentation (auto-generated from TSDoc)
  - >10 interactive examples in playground
  - >5 comprehensive tutorials
  - <5 minutes to first implementation (from docs)

- **Ecosystem Integration:**
  - Seamless integration with existing Web Loom packages
  - Compatible with @web-loom/mvvm-core patterns
  - Works with @web-loom/query-core for data fetching
  - Integrates with @web-loom/design-core themes

### Accessibility Goals

- **WCAG Compliance:**
  - All patterns meet WCAG 2.1 Level AA
  - Keyboard navigation for all interactive patterns
  - Screen reader announcements for state changes
  - Focus management for modals and complex patterns

- **Accessibility Testing:**
  - Zero critical axe-core violations
  - Manual screen reader testing (NVDA, JAWS, VoiceOver)
  - Keyboard-only navigation testing
  - High contrast mode support

---

# 13. More notes

1. Micro-Interaction Behaviors

(Fine-grained, logic-only, framework-agnostic modules)
Examples:

Selection models

Form validation logic

Keyboard navigation logic

Drag-and-drop rules

Command palette behavior

Dialog open/close state with focus trapping

Toast queueing

Undo/redo state machines

These are the smallest atomic interaction units.

🏛️ 2. Macro-UI Patterns (Your List)

(Large, composed UI architecture patterns with predictable behavior models)
These are higher-level structural or flow patterns like:

Side bar → page (App shell)

Fixed header/footer

Tabs

Hub-and-spoke navigation

Master-detail (Split view)

Accordion

Modal

Wizard

Floating Action Button (FAB)

These patterns combine:

Layout conventions

Expected navigation rules

Interaction constraints

Focus management

State transitions

Macro-patterns are assemblies of micro-interaction behaviors.

✅ So yes: They can all belong in the same project — if we classify them properly.

Below is a clean classification that keeps the architecture scalable.

🧩 Proposed Classification System
A. Core Behaviors (Low-Level / Universal)

Framework-agnostic state machines or logic modules:

createTabsBehavior()

createModalBehavior()

createAccordionBehavior()

createStepperBehavior()

createListSelectionBehavior()

createFormBehavior()

createKeyboardNavBehavior()

These define:

State transitions

Events & actions

Accessibility rules

Keyboard bindings

Open/close/select logic

These are “headless” and reusable anywhere.

B. Composite Interaction Patterns (Mid-Level)

These combine multiple behaviors into functional units:

Navigation & Layout

Sidebar Shell Behavior

Contains: collapse/expand, focus rules, active section logic

Fixed Header/Footer Behavior

Supports: sticky behavior, scroll detection, elevation changes

Tab Interface Behavior

Based on: roving tabindex, panel switching state machine

Hub-and-Spoke Behavior

Routing transitions + page activation logic

Data & Content

Master–Detail Behavior

Selection behavior + detail-sync behavior

Card/Grid Behavior

Responsive layout logic + selection + action overlay logic

Accordion Behavior

Expand/collapse rules + keyboard semantics

Flow & Focus

Modal/Dialog Behavior

Focus trap + escape handling + overlay logic

Wizard Flow Behavior

Step state machine + validation gating + branching

Floating Action Button (FAB) Behavior

Visibility on scroll + priority action binding

# 14. 📦 **Package Configuration Examples**

### packages/ui-core/package.json

```json
{
  "name": "@web-loom/ui-core",
  "description": "Framework-agnostic UI interaction behaviors for Web Loom",
  "author": "Festus Yeboah <festus.yeboah@hotmail.com>",
  "license": "MIT",
  "private": false,
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/ui-core.umd.js",
  "module": "./dist/ui-core.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/ui-core.es.js",
      "require": "./dist/ui-core.umd.js"
    },
    "./react": {
      "types": "./dist/adapters/react/index.d.ts",
      "import": "./dist/adapters/react/index.js"
    },
    "./vue": {
      "types": "./dist/adapters/vue/index.d.ts",
      "import": "./dist/adapters/vue/index.js"
    },
    "./angular": {
      "types": "./dist/adapters/angular/index.d.ts",
      "import": "./dist/adapters/angular/index.js"
    }
  },
  "keywords": [
    "ui-behaviors",
    "headless-ui",
    "framework-agnostic",
    "state-management",
    "accessibility",
    "web-loom",
    "react",
    "vue",
    "angular",
    "typescript"
  ],
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest --watch=false",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext .ts,.js",
    "lint:fix": "eslint . --ext .ts,.js --fix",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@web-loom/store-core": "0.0.4",
    "@web-loom/event-bus-core": "0.0.2"
  },
  "devDependencies": {
    "@types/node": "^20.x.x",
    "@typescript-eslint/eslint-plugin": "^7.13.0",
    "@typescript-eslint/parser": "^7.13.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "jsdom": "^26.1.0",
    "prettier": "^3.3.2",
    "typescript": "~5.8.2",
    "vite": "^6.1.1",
    "vite-plugin-dts": "^4.5.4",
    "vitest": "^3.2.4"
  }
}
```

### packages/ui-patterns/package.json

```json
{
  "name": "@web-loom/ui-patterns",
  "description": "High-level UI patterns built on Web Loom UI Core",
  "author": "Festus Yeboah <festus.yeboah@hotmail.com>",
  "license": "MIT",
  "private": false,
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/ui-patterns.umd.js",
  "module": "./dist/ui-patterns.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/ui-patterns.es.js",
      "require": "./dist/ui-patterns.umd.js"
    }
  },
  "keywords": [
    "ui-patterns",
    "master-detail",
    "wizard",
    "accordion",
    "tabs",
    "modal",
    "web-loom",
    "typescript"
  ],
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest --watch=false",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext .ts,.js",
    "lint:fix": "eslint . --ext .ts,.js --fix",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@web-loom/ui-core": "^1.0.0",
    "@web-loom/store-core": "0.0.4",
    "@web-loom/event-bus-core": "0.0.2"
  },
  "peerDependencies": {
    "@web-loom/mvvm-core": "^0.5.0",
    "@web-loom/query-core": "^0.0.2"
  },
  "peerDependenciesMeta": {
    "@web-loom/mvvm-core": {
      "optional": true
    },
    "@web-loom/query-core": {
      "optional": true
    }
  },
  "devDependencies": {
    "@types/node": "^20.x.x",
    "@typescript-eslint/eslint-plugin": "^7.13.0",
    "@typescript-eslint/parser": "^7.13.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "jsdom": "^26.1.0",
    "prettier": "^3.3.2",
    "typescript": "~5.8.2",
    "vite": "^6.1.1",
    "vite-plugin-dts": "^4.5.4",
    "vitest": "^3.2.4"
  }
}
```

---

# 15. 🎉 **Final Summary**

The **Web Loom UI Core and UI Patterns** packages represent a strategic expansion of the Web Loom ecosystem, adding a universal headless behavior layer for modern frontend development.

## **Key Differentiators**

1. **Deep Integration with Web Loom:**
   - Built on `@web-loom/store-core` instead of external state libraries
   - Uses `@web-loom/event-bus-core` for cross-behavior communication
   - Optional integration with `@web-loom/mvvm-core` for MVVM patterns
   - Follows established Web Loom conventions and patterns

2. **Zero External Dependencies (for core logic):**
   - No nanostores, XState, or other external libraries
   - Leverages existing Web Loom infrastructure
   - Minimal bundle size impact

3. **Framework-Agnostic by Design:**
   - Works with React, Vue, Angular, Svelte, and Vanilla JS
   - Same business logic across all frameworks
   - Framework adapters provided for convenience

4. **Production-Ready:**
   - Comprehensive testing with Vitest
   - Accessibility-first design (WCAG 2.1 AA)
   - Type-safe APIs with full TypeScript coverage
   - Performance-optimized (<2KB per behavior)

5. **Complete Ecosystem:**
   - Core behaviors (atomic interactions)
   - Patterns (composed macro interactions)
   - Framework adapters (React, Vue, Angular)
   - Interactive playground
   - Comprehensive documentation

## **What This PRD Provides**

- ✅ Full architecture aligned with Web Loom philosophy
- ✅ Package design leveraging existing Web Loom packages
- ✅ API guidance with concrete examples
- ✅ Zero new external dependencies strategy
- ✅ 16-week implementation roadmap
- ✅ Testing and quality strategies
- ✅ Success metrics (technical, UX, accessibility)
- ✅ Integration examples for all supported frameworks
- ✅ MVVM pattern integration examples

## **Next Steps**

1. **Review & Approval:** Stakeholder review of this PRD
2. **Phase 1 Kickoff:** Set up package infrastructure (Week 1)
3. **Iterative Development:** Follow the 16-week roadmap
4. **Community Engagement:** Gather feedback from Web Loom users
5. **Launch:** Publish v1.0.0 to npm and announce to community

**This is not just another UI library—it's a fundamental expansion of the Web Loom philosophy: universal, framework-agnostic, behavior-first development.**
