# Chapter Learning Objectives - MVVM Book Rewrite

This document provides detailed learning objectives for all 23 chapters in the rewritten MVVM book.

## Section 1: Foundations (Chapters 1-3)

### Chapter 1: The Frontend Architecture Crisis

**Learning Objectives:**
- Understand the challenges of modern frontend development
- Identify common architectural problems in frontend applications
- Recognize the need for structured architectural patterns
- Learn why separation of concerns matters in frontend code

**Core Concepts:**
- Frontend complexity growth over time
- Tight coupling between UI and business logic
- Testing challenges in tightly coupled code
- Maintenance difficulties in unstructured applications
- The cost of technical debt in frontend projects

**Real-World Examples:**
- Problems in real applications without architectural patterns
- Maintenance nightmares from tightly coupled code
- Testing difficulties when business logic is embedded in UI components

**Prerequisites:** None (introductory chapter)

---

### Chapter 2: Why MVVM Matters for Modern Frontend

**Learning Objectives:**
- Understand what MVVM is and why it exists
- Learn how MVVM solves frontend architectural problems
- See concrete examples of problems MVVM addresses
- Understand the benefits of framework-agnostic business logic

**Core Concepts:**
- MVVM as a solution to frontend complexity
- Separation of concerns in practice
- Framework independence benefits
- Testability improvements with MVVM
- Reusability of business logic across frameworks

**Real-World Examples:**
- GreenWatch system as example of MVVM benefits
- Same ViewModels used across React, Vue, Angular, Lit, Vanilla JS
- Testing ViewModels in isolation

**Prerequisites:** Chapter 1

---

### Chapter 3: MVVM Pattern Fundamentals

**Learning Objectives:**
- Understand the three layers of MVVM (Model, View, ViewModel)
- Learn the responsibilities of each layer
- Understand how data flows through MVVM layers
- See a complete MVVM example with GreenWatch domain

**Core Concepts:**
- Model layer: domain logic and data
- ViewModel layer: presentation logic
- View layer: UI rendering
- Unidirectional data flow
- Layer boundaries and contracts
- Reactive state flow from Model → ViewModel → View

**Real-World Examples:**
- GreenWatch domain model (Greenhouse, Sensor, SensorReading, ThresholdAlert)
- Complete MVVM flow for a sensor reading feature
- Code examples from packages/mvvm-core

**Prerequisites:** Chapter 2

---

## Section 2: Core Patterns (Chapters 4-7)

### Chapter 4: Building Framework-Agnostic Models

**Learning Objectives:**
- Understand Model layer responsibilities
- Learn how to build framework-agnostic Models
- Implement domain logic in Models
- Use Zod for validation in Models
- Understand BaseModel and RestfulApiModel patterns

**Core Concepts:**
- Model as domain logic container
- Framework independence in Models
- Validation with Zod schemas
- BaseModel pattern with reactive state (RxJS BehaviorSubject)
- RestfulApiModel for API operations
- Error handling in Models
- Validation error propagation

**Real-World Examples:**
- GreenWatch Model implementations (Sensor, SensorReading, Greenhouse, ThresholdAlert)
- Code from packages/mvvm-core/src/models/
- Zod schemas for domain validation
- API integration with RestfulApiModel

**Prerequisites:** Chapter 3

---

### Chapter 5: ViewModels and Reactive State

**Learning Objectives:**
- Understand ViewModel layer responsibilities
- Learn how ViewModels connect Models to Views
- Implement reactive state with RxJS observables
- Manage ViewModel lifecycle
- Understand BaseViewModel and RestfulApiViewModel patterns

**Core Concepts:**
- ViewModel as presentation logic layer
- Reactive state with RxJS BehaviorSubject and Observable
- ViewModel lifecycle management (creation, mounting, unmounting)
- BaseViewModel pattern
- RestfulApiViewModel with CRUD operations
- Subscription cleanup with takeUntil pattern
- Exposing observables to Views (data$, isLoading$, error$, validationErrors$)

**Real-World Examples:**
- GreenWatch ViewModel implementations (GreenHouseViewModel, SensorViewModel, SensorReadingViewModel, ThresholdAlertViewModel)
- Code from packages/view-models/
- Code from packages/mvvm-core/src/viewmodels/
- Introduction to reactive state patterns (detailed in Chapter 13)

**Prerequisites:** Chapter 4

---

### Chapter 6: The View Layer Contract

**Learning Objectives:**
- Understand View layer responsibilities
- Learn the 'dumb view' philosophy
- Understand how Views consume ViewModels
- See View implementations across multiple frameworks
- Learn View layer best practices

**Core Concepts:**
- View as pure presentation layer
- Dumb view philosophy (no business logic in Views)
- View-ViewModel contract
- Subscribing to ViewModel observables
- Framework-specific View patterns
- Comparison of View implementations across frameworks
- When Views should (and shouldn't) contain logic

**Real-World Examples:**
- GreenWatch View implementations across frameworks
- Code from apps/mvvm-react, apps/mvvm-vue, apps/mvvm-angular
- Same ViewModel consumed by different View implementations
- Demonstrating framework independence

**Prerequisites:** Chapter 5

---

### Chapter 7: Dependency Injection and Lifecycle Management

**Learning Objectives:**
- Understand dependency injection patterns for ViewModels
- Learn ViewModel lifecycle management
- Implement DI container for MVVM
- Manage subscriptions and cleanup
- Understand framework-specific DI approaches

**Core Concepts:**
- Dependency injection for ViewModels
- DI container implementation
- ViewModel lifecycle (creation, mounting, unmounting)
- Subscription cleanup with takeUntil pattern
- Framework-specific DI (Angular DI, React Context, Vue provide/inject)
- Service locator pattern vs dependency injection
- Singleton vs transient ViewModels

**Real-World Examples:**
- Code from packages/mvvm-core/src/core/di-container.ts
- Angular DI for ViewModels
- React Context for ViewModel sharing
- Vue provide/inject for ViewModel injection
- Lifecycle management across frameworks

**Prerequisites:** Chapter 6

---

## Section 3: Framework Implementations (Chapters 8-12)

### Chapter 8: React Implementation with Hooks

**Learning Objectives:**
- Implement MVVM in React using hooks
- Subscribe to ViewModel observables in React components
- Manage ViewModel lifecycle in React
- Build GreenWatch UI in React
- Understand React-specific MVVM patterns

**Core Concepts:**
- React hooks for ViewModel consumption
- useEffect for observable subscriptions
- Custom hooks for ViewModel integration
- React component lifecycle with ViewModels
- Cleanup in useEffect return function
- useState for local UI state vs ViewModel state

**Real-World Examples:**
- GreenWatch React implementation
- Code from apps/mvvm-react
- Custom hooks for ViewModel integration
- Sensor dashboard component in React
- Real-time sensor reading updates

**Prerequisites:** Chapters 5, 6, 7

---

### Chapter 9: Vue Implementation with Composition API

**Learning Objectives:**
- Implement MVVM in Vue using Composition API
- Subscribe to ViewModel observables in Vue components
- Manage ViewModel lifecycle in Vue
- Build GreenWatch UI in Vue
- Compare Vue implementation with React

**Core Concepts:**
- Vue Composition API for ViewModel consumption
- watchEffect for observable subscriptions
- Composables for ViewModel integration
- Vue component lifecycle with ViewModels
- onUnmounted for cleanup
- ref/reactive for local UI state vs ViewModel state

**Real-World Examples:**
- GreenWatch Vue implementation
- Code from apps/mvvm-vue
- Composables for ViewModel integration
- Sensor dashboard component in Vue
- Framework independence demonstrated through same ViewModels

**Prerequisites:** Chapters 5, 6, 7, 8

---

### Chapter 10: Angular Implementation with DI

**Learning Objectives:**
- Implement MVVM in Angular using dependency injection
- Subscribe to ViewModel observables using async pipe
- Manage ViewModel lifecycle in Angular
- Build GreenWatch UI in Angular
- Compare Angular implementation with React and Vue

**Core Concepts:**
- Angular dependency injection for ViewModels
- Async pipe for observable subscriptions
- Angular services as ViewModel containers
- Angular component lifecycle with ViewModels
- OnDestroy for cleanup
- Native RxJS integration benefits in Angular

**Real-World Examples:**
- GreenWatch Angular implementation
- Code from apps/mvvm-angular
- Angular services wrapping ViewModels
- Sensor dashboard component in Angular
- Async pipe eliminating manual subscriptions

**Prerequisites:** Chapters 5, 6, 7, 8, 9

---

### Chapter 11: Lit Web Components Implementation

**Learning Objectives:**
- Implement MVVM in Lit web components
- Subscribe to ViewModel observables in Lit
- Manage ViewModel lifecycle in Lit
- Build GreenWatch UI with Lit
- Understand web components with MVVM

**Core Concepts:**
- Lit decorators and reactive properties
- Reactive controllers for ViewModel integration
- Web components lifecycle with ViewModels
- @state decorator for reactive properties
- disconnectedCallback for cleanup
- Standards-based web components with MVVM

**Real-World Examples:**
- GreenWatch Lit implementation
- Code from apps/mvvm-lit
- Reactive controllers for ViewModel integration
- Sensor dashboard web component
- Framework-agnostic web components

**Prerequisites:** Chapters 5, 6, 7, 8, 9, 10

---

### Chapter 12: Vanilla JavaScript Implementation

**Learning Objectives:**
- Implement MVVM without any framework
- Subscribe to ViewModel observables in vanilla JS
- Manage ViewModel lifecycle manually
- Build GreenWatch UI with vanilla JS and EJS templates
- Understand framework-free MVVM

**Core Concepts:**
- Direct observable subscriptions in vanilla JS
- Manual DOM manipulation with ViewModels
- EJS templates for rendering
- Manual lifecycle management
- Subscription cleanup without framework helpers
- Framework independence fully demonstrated

**Real-World Examples:**
- GreenWatch vanilla JS implementation
- Code from apps/mvvm-vanilla
- EJS templates for sensor dashboard
- Manual subscription management
- Proving MVVM works without frameworks

**Prerequisites:** Chapters 5, 6, 7, 8, 9, 10, 11

---

## Section 4: Framework-Agnostic Patterns (Chapters 13-17)

**Section Philosophy:** This section teaches patterns and principles in general terms first, then uses Web Loom libraries as concrete examples of how to implement these patterns. The emphasis is on transferable knowledge - readers should be able to apply these patterns using any library or build their own implementations.

### Chapter 13: Reactive State Management Patterns

**Learning Objectives:**
- Understand reactive state patterns in general terms
- Learn why reactive state matters for MVVM
- Explore signals pattern with signals-core as example
- Explore observable store pattern with store-core as example
- Compare alternative approaches (RxJS, native Proxy)
- Choose appropriate reactive state approach for your needs

**Core Concepts:**
- Reactive state patterns (signals, observables, stores)
- Why reactive state enables MVVM architecture
- Signals pattern: writable signals, computed values, effects
- Observable store pattern: minimal state management
- Alternative implementations: RxJS, native Proxy-based reactivity
- When to use each approach
- Patterns are transferable across libraries

**Real-World Examples:**
- Signals-core as example of signals pattern
- Store-core as example of observable store pattern
- RxJS BehaviorSubject as alternative
- Native Proxy-based reactivity
- Code from packages/signals-core and packages/store-core
- Comparison of different reactive state approaches

**Prerequisites:** Chapter 5

---

### Chapter 14: Event-Driven Communication

**Learning Objectives:**
- Understand event-driven architecture patterns
- Learn why event-driven communication matters for MVVM
- Explore pub/sub pattern with event-bus-core as example
- Implement cross-component communication
- Compare alternative approaches (native EventTarget, other libraries)
- Choose appropriate event communication approach

**Core Concepts:**
- Event-driven architecture patterns
- Pub/sub pattern for decoupled communication
- Domain events in frontend applications
- Cross-component and cross-context communication
- Event-bus-core as example implementation
- Alternative implementations: native EventTarget, other event libraries
- When to use event-driven communication

**Real-World Examples:**
- Event-bus-core as example of pub/sub pattern
- Domain events in GreenWatch (ThresholdAlertTriggered, SensorReadingReceived)
- Code from packages/event-bus-core
- Native EventTarget as alternative
- Cross-context communication in GreenWatch

**Prerequisites:** Chapter 5

---

### Chapter 15: Data Fetching and Caching Strategies

**Learning Objectives:**
- Understand data fetching patterns in general terms
- Learn why data fetching patterns matter for MVVM
- Explore async state management with query-core as example
- Implement caching and invalidation strategies
- Compare alternative approaches (React Query, SWR, native fetch)
- Choose appropriate data fetching approach

**Core Concepts:**
- Data fetching patterns: async state, caching, invalidation
- Why data fetching patterns enable MVVM ViewModels
- Query-core as framework-agnostic example
- Caching strategies and cache invalidation
- Alternative implementations: React Query, SWR, native fetch with caching
- When to use each approach
- Framework-agnostic data fetching benefits

**Real-World Examples:**
- Query-core as example of data fetching pattern
- Code from packages/query-core
- Sensor reading data fetching in GreenWatch
- Caching sensor data
- React Query as alternative
- Native fetch with manual caching

**Prerequisites:** Chapter 5

---

### Chapter 16: Headless UI Behaviors

**Learning Objectives:**
- Understand headless UI pattern in general terms
- Learn why headless UI patterns matter for MVVM
- Explore atomic behaviors with ui-core as example
- Implement framework-agnostic UI logic
- Understand behavior composition
- Compare alternative approaches

**Core Concepts:**
- Headless UI pattern: separation of behavior from presentation
- Why headless UI enables framework-agnostic MVVM
- Atomic behaviors: Dialog, Form, List Selection, Roving Focus, Disclosure
- Ui-core as example implementation
- Behavior composition into larger patterns
- Framework-agnostic UI logic benefits
- Alternative implementations where applicable

**Real-World Examples:**
- Ui-core as example of headless UI pattern
- Code from packages/ui-core
- Dialog behavior for sensor configuration
- List selection for sensor list
- Roving focus for keyboard navigation
- Form behavior for sensor data entry

**Prerequisites:** Chapter 6

---

### Chapter 17: Composed UI Patterns

**Learning Objectives:**
- Understand composed UI patterns in general terms
- Learn why composed patterns matter for MVVM
- Explore pattern composition with ui-patterns as example
- Implement Master-Detail, Wizard, Modal, Command Palette patterns
- Understand event-driven pattern communication
- Build framework-agnostic UI patterns

**Core Concepts:**
- Composed UI patterns: Master-Detail, Wizard, Modal, Command Palette, Tabbed Interface, Sidebar Shell, Toast Queue
- Why composed patterns enable reusable MVVM components
- Pattern composition from atomic behaviors
- Ui-patterns as example implementation
- Event-driven pattern communication
- Framework-agnostic pattern implementations
- How patterns integrate with ViewModels

**Real-World Examples:**
- Ui-patterns as example of composed patterns
- Code from packages/ui-patterns
- Master-Detail pattern for sensor list and detail view
- Wizard pattern for greenhouse setup
- Modal pattern for sensor configuration
- Command Palette pattern for quick actions
- Toast Queue for alert notifications

**Prerequisites:** Chapter 16

---

## Section 5: Advanced Topics (Chapters 18-21)

### Chapter 18: Domain-Driven Design for Frontend

**Learning Objectives:**
- Understand DDD principles applied to frontend
- Learn bounded contexts in frontend applications
- Implement aggregates and domain events
- Apply DDD to GreenWatch domain model
- Understand ubiquitous language in frontend

**Core Concepts:**
- DDD principles for frontend
- Bounded contexts and context mapping
- Aggregates and entities
- Domain events in frontend
- Ubiquitous language
- GreenWatch as DDD example (Greenhouse, Sensor, SensorReading, ThresholdAlert)
- Value objects and domain services
- Repository pattern for data access

**Real-World Examples:**
- GreenWatch domain model as DDD example
- Bounded contexts in GreenWatch (Monitoring, Alerting, Configuration)
- Aggregates: Greenhouse aggregate, Sensor aggregate
- Domain events: ThresholdAlertTriggered, SensorReadingReceived
- Code from packages/mvvm-core and packages/view-models

**Prerequisites:** Chapters 4, 5, 14

---

### Chapter 19: Testing MVVM Applications

**Learning Objectives:**
- Understand testing strategies for MVVM layers
- Learn unit testing for ViewModels
- Learn unit testing for Models with Zod validation
- Implement integration testing across layers
- Use Vitest for MVVM testing
- Understand testing benefits of MVVM separation

**Core Concepts:**
- Testing strategies for Models, ViewModels, Views
- Unit testing ViewModels in isolation
- Testing Models with Zod validation
- Integration testing across MVVM layers
- Vitest configuration and usage
- Testing benefits of separation of concerns
- Mocking strategies for MVVM
- Testing reactive state with RxJS

**Real-World Examples:**
- Real test examples from monorepo
- Testing GreenHouseViewModel
- Testing SensorViewModel
- Testing Models with Zod validation
- Integration tests for complete features
- Code from test files in packages/mvvm-core and packages/view-models

**Prerequisites:** Chapters 4, 5, 6

---

### Chapter 20: Plugin Architecture and Extensibility

**Learning Objectives:**
- Understand plugin architecture patterns
- Learn PluginRegistry and lifecycle management
- Implement FrameworkAdapter abstraction
- Use PluginManifest for plugin configuration
- Implement PluginSDK for host-plugin communication
- Build runtime-extensible applications

**Core Concepts:**
- Plugin architecture patterns
- PluginRegistry: framework-agnostic plugin management
- Plugin lifecycle states (registered → loading → loaded → mounted → unmounted)
- FrameworkAdapter: mounting plugins in different frameworks
- PluginManifest: Zod-validated declarative configuration
- PluginSDK: API for host communication
- Security considerations for plugins
- Plugin isolation and sandboxing

**Real-World Examples:**
- Real examples from plugin-core and apps/plugin-react
- Code from packages/plugin-core
- PluginRegistry implementation
- FrameworkAdapter for React
- Plugin examples from apps/plugin-react
- PluginManifest validation with Zod

**Prerequisites:** Chapters 5, 7

---

### Chapter 21: Design Systems and Theming

**Learning Objectives:**
- Understand design token and theming patterns
- Learn why design systems matter for MVVM applications
- Explore design token system with design-core as example
- Implement CSS custom properties generation
- Build dynamic theming with light/dark mode
- Create framework-agnostic design systems

**Core Concepts:**
- Design token and theming patterns in general terms
- Why design systems matter for MVVM applications
- Design-core as example implementation
- CSS custom properties for theming
- Dynamic theming and mode switching
- Framework-agnostic design systems benefits
- Alternative approaches where applicable
- Typography and color utilities

**Real-World Examples:**
- Design-core as example of design token system
- Code from packages/design-core
- Code from packages/typography-core
- CSS custom properties generation
- Light/dark mode implementation
- GreenWatch theming examples

**Prerequisites:** Chapter 6

---

## Section 6: Real-World Applications (Chapters 22-23)

### Chapter 22: Complete Case Studies

**Learning Objectives:**
- See complete GreenWatch implementation across all frameworks
- Understand e-commerce application as secondary case study
- Learn how all MVVM patterns come together
- Compare different domain implementations
- Apply MVVM to your own projects

**Core Concepts:**
- Complete GreenWatch implementation walkthrough
- GreenWatch architecture and bounded contexts
- Multi-framework implementation showcase
- E-commerce application patterns
- Contrasting different domain patterns
- How all patterns integrate in real applications
- Comprehensive code examples from monorepo

**Real-World Examples:**
- Complete GreenWatch implementation across React, Vue, Angular, Lit, Vanilla JS
- E-commerce application as secondary case study
- Code from all apps/mvvm-* directories
- Code from packages/view-models
- Architecture diagrams and flow charts
- Performance considerations

**Prerequisites:** All previous chapters

---

### Chapter 23: Conclusion and Best Practices

**Learning Objectives:**
- Summarize key MVVM patterns and principles
- Understand when to use MVVM
- Learn architectural tradeoffs
- Apply best practices for MVVM applications
- Continue learning and growing

**Core Concepts:**
- Summary of MVVM patterns and principles
- When to use MVVM (and when not to)
- Architectural tradeoffs and decisions
- Best practices for MVVM applications
- Common pitfalls and how to avoid them
- Framework-agnostic thinking
- Patterns over libraries philosophy
- Next steps for readers

**Real-World Examples:**
- Recap of GreenWatch case study
- Lessons learned from real implementations
- Common mistakes and how to avoid them
- Resources for continued learning

**Prerequisites:** All previous chapters

---

## Summary

**Total Chapters:** 23
**Total Sections:** 6

**Section Breakdown:**
- Foundations: 3 chapters
- Core Patterns: 4 chapters
- Framework Implementations: 5 chapters
- Framework-Agnostic Patterns: 5 chapters
- Advanced Topics: 4 chapters
- Real-World Applications: 2 chapters

**Key Principles:**
- Patterns over libraries: Teach general patterns first, then show specific implementations
- Framework-agnostic: Emphasize transferable knowledge across frameworks
- Real code: All examples from actual working implementations in Web Loom monorepo
- GreenWatch as primary case study: Consistent example throughout the book
- Progressive learning: Each chapter builds on previous chapters
