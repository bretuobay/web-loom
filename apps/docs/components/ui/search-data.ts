import type { SearchEntry } from '@repo/docs-theme';

export const DOCS_SEARCH_ENTRIES: SearchEntry[] = [
  {
    title: 'Getting Started',
    summary:
      'What Web Loom is, why framework-agnostic architecture matters, and how to install the packages and build your first ViewModel in minutes.',
    href: '/docs/getting-started',
    topic: 'Getting Started',
  },
  {
    title: 'Architecture Fundamentals',
    summary:
      'The core ideas behind Web Loom — why framework-agnostic architecture matters and how the MVVM pattern keeps business logic independent of the UI layer.',
    href: '/docs/fundamentals',
    topic: 'Getting Started',
  },
  {
    title: 'Core Concepts',
    summary:
      'The foundational ideas behind MVVM Core — how Models, ViewModels, Commands, and the dispose pattern work together to produce a testable, framework-agnostic architecture.',
    href: '/docs/core-concepts',
    topic: 'MVVM Core',
  },
  {
    title: 'Models',
    summary:
      'Deep dive into the Model layer — BaseModel, RestfulApiModel, QueryStateModel, and real-world implementations from the Web Loom example apps.',
    href: '/docs/models',
    topic: 'MVVM Core',
  },
  {
    title: 'ViewModels',
    summary:
      'Deep dive into the ViewModel layer — BaseViewModel, Commands, RestfulApiViewModel, FormViewModel, QueryableCollectionViewModel, and real-world implementations.',
    href: '/docs/viewmodels',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM in React',
    summary:
      "How React's rendering model works, why RxJS observables need a bridge, and practical patterns for wiring ViewModels into React 19 components.",
    href: '/docs/mvvm-react-use-case',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM in Vue',
    summary:
      "How Vue 3's reactivity system works, why RxJS observables need a composable bridge, and practical patterns for wiring ViewModels into Vue components.",
    href: '/docs/mvvm-vue-use-case',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM in Angular',
    summary:
      "How Angular's Zone.js change detection works, why the async pipe is the natural bridge to RxJS observables, and practical patterns for wiring ViewModels into Angular components.",
    href: '/docs/mvvm-angular-use-case',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM in Vanilla TypeScript',
    summary:
      'How to wire Web Loom ViewModels into a framework-free TypeScript app — manual DOM rendering, RxJS subscriptions, EJS templates, and imperative event listeners.',
    href: '/docs/mvvm-vanilla-use-case',
    topic: 'MVVM Core',
  },
  {
    title: 'MVVM Core',
    summary: 'A minimal MVVM framework for building reactive web applications.',
    href: '/docs/mvvm-core',
    topic: 'Published Packages',
  },
  {
    title: 'Store Core',
    summary: 'A minimal client state management library for building reactive web applications.',
    href: '/docs/store-core',
    topic: 'Published Packages',
  },
  {
    title: 'Signals Core',
    summary: 'Framework-agnostic reactive signals with computed values and effects.',
    href: '/docs/signals-core',
    topic: 'Published Packages',
  },
  {
    title: 'Event Bus Core',
    summary:
      'A lightweight, framework-agnostic Event Bus library for decoupled communication in modern web applications.',
    href: '/docs/event-bus-core',
    topic: 'Published Packages',
  },
  {
    title: 'Query Core',
    summary:
      'A minimal server state management library for managing asynchronous data fetching, caching, and state.',
    href: '/docs/query-core',
    topic: 'Published Packages',
  },
  {
    title: 'UI Core Behaviors',
    summary:
      'Eight framework-agnostic headless UI behaviors — Dialog, Disclosure, Form, List Selection, Roving Focus, Keyboard Shortcuts, Undo/Redo, and Drag-and-Drop.',
    href: '/docs/ui-core',
    topic: 'Published Packages',
  },
  {
    title: 'UI Patterns',
    summary:
      'Composed UI patterns built on Web Loom UI Core behaviors — Master-Detail, Wizard, Modal, Tabs, Sidebar, Toast Queue, Command Palette, Hub-and-Spoke, Grid Layout, and FAB.',
    href: '/docs/ui-patterns',
    topic: 'Published Packages',
  },
  {
    title: 'Design Core',
    summary:
      'Framework-agnostic design tokens, CSS custom properties, dynamic theming, and a pre-built component library.',
    href: '/docs/design-core',
    topic: 'Published Packages',
  },
  {
    title: 'Package Roadmap',
    summary:
      'All Web Loom packages that are implemented and used in the demo apps but not yet published to npm — Forms, Media, HTTP, Storage, Router, i18n, Notifications, Error, Platform, Typography, and Charts.',
    href: '/docs/packages-roadmap',
    topic: 'Published Packages',
  },
  {
    title: 'Event Emitter Core',
    summary:
      'A tiny, type-safe synchronous event emitter — the internal primitive behind Event Bus Core, Forms Core, Media Core, and Storage Core.',
    href: '/docs/event-emitter-core',
    topic: 'Published Packages',
  },
  {
    title: 'MVVM Patterns',
    summary:
      'Advanced ViewModel patterns — InteractionRequest for ViewModel-driven dialogs and notifications, and ActiveAwareViewModel for lifecycle-aware ViewModels.',
    href: '/docs/mvvm-patterns',
    topic: 'MVVM Core',
  },
];

export const DOCS_SEARCH_FEATURED_HREFS = [
  '/docs/getting-started',
  '/docs/core-concepts',
  '/docs/mvvm-core',
  '/docs/signals-core',
  '/docs/query-core',
  '/docs/ui-core',
];
