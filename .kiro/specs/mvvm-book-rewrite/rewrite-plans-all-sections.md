# Complete Rewrite Plans: All Remaining Sections (Chapters 8-23)

**Generated:** 2025-01-15  
**Phase:** 3.2-3.6 - Complete Rewrite Plan Generation  
**Sections:** Framework Implementations (8-12), Framework-Agnostic Patterns (13-17), Advanced Topics (18-21), Real-World Applications (22-23)  
**Purpose:** Comprehensive rewrite plans for all remaining chapters

---

## Section 3: Framework Implementations (Chapters 8-12)

### Overview
This section demonstrates MVVM implementation across five frameworks using the same GreenWatch ViewModels, proving framework independence.

**Key Principle:** Same business logic (ViewModels), different presentation layers (Views).

---

### Chapter 8: React Implementation with Hooks

**Metadata:**
- Chapter: 8 | File: `chapter8.mdx` | Section: Framework Implementations
- Old Chapter: 7 (renamed) | Prerequisites: 5, 6, 7

**Learning Objectives:**
- Implement MVVM in React using hooks
- Subscribe to ViewModel observables with useEffect
- Create custom hooks for ViewModel integration
- Build GreenWatch UI in React

**Core Concepts:**
- React hooks for ViewModel consumption (useEffect, useState)
- Custom hooks (useObservable, useViewModel)
- Component lifecycle with ViewModels
- Cleanup in useEffect return function

**Real Implementations:**
- `apps/mvvm-react/src/components/SensorDashboard.tsx`
- `apps/mvvm-react/src/components/SensorList.tsx`
- `apps/mvvm-react/src/hooks/useObservable.ts`
- ViewModels: SensorViewModel, GreenHouseViewModel

**Code Examples:**
1. useObservable custom hook
2. SensorDashboard component with ViewModel
3. Subscription cleanup pattern
4. Real-time sensor updates

**Content Structure:**
1. React and MVVM introduction
2. Custom hooks for ViewModels
3. Component implementation walkthrough
4. Lifecycle management
5. GreenWatch React examples
6. Best practices

---

### Chapter 9: Vue Implementation with Composition API

**Metadata:**
- Chapter: 9 | File: `chapter9.mdx` | Section: Framework Implementations
- Old Chapter: 11 (renamed) | Prerequisites: 5, 6, 7, 8

**Learning Objectives:**
- Implement MVVM in Vue using Composition API
- Subscribe to ViewModels with watchEffect
- Create composables for ViewModel integration
- Compare with React implementation

**Core Concepts:**
- Vue Composition API for ViewModels
- watchEffect for observable subscriptions
- Composables (useObservable, useViewModel)
- onUnmounted for cleanup
- Same ViewModels, different framework

**Real Implementations:**
- `apps/mvvm-vue/src/components/SensorDashboard.vue`
- `apps/mvvm-vue/src/components/SensorList.vue`
- `apps/mvvm-vue/src/composables/useObservable.ts`
- Same ViewModels as React

**Code Examples:**
1. useObservable composable
2. SensorDashboard.vue with ViewModel
3. watchEffect subscription pattern
4. Side-by-side comparison with React

**Content Structure:**
1. Vue and MVVM introduction
2. Composition API for ViewModels
3. Composables implementation
4. Component walkthrough
5. Comparison with React (Chapter 8)
6. Framework independence demonstrated

---

### Chapter 10: Angular Implementation with DI

**Metadata:**
- Chapter: 10 | File: `chapter10.mdx` | Section: Framework Implementations
- Old Chapter: 12 (renamed) | Prerequisites: 5, 6, 7, 8, 9

**Learning Objectives:**
- Implement MVVM in Angular using DI
- Use async pipe for observables
- Leverage Angular's native RxJS integration
- Compare with React and Vue

**Core Concepts:**
- Angular dependency injection for ViewModels
- InjectionTokens for ViewModel providers
- Async pipe eliminating manual subscriptions
- Angular services wrapping ViewModels
- OnDestroy for cleanup

**Real Implementations:**
- `apps/mvvm-angular/src/app/components/sensor-dashboard/`
- `apps/mvvm-angular/src/app/services/`
- `apps/mvvm-angular/src/app/tokens/viewmodel.tokens.ts`
- Same ViewModels as React and Vue

**Code Examples:**
1. InjectionToken for ViewModels
2. SensorDashboard component with async pipe
3. Service wrapping ViewModel
4. Comparison table: React vs Vue vs Angular

**Content Structure:**
1. Angular and MVVM introduction
2. Dependency injection setup
3. Async pipe benefits
4. Component implementation
5. Three-way comparison (React, Vue, Angular)
6. Native RxJS advantages

---

### Chapter 11: Lit Web Components Implementation

**Metadata:**
- Chapter: 11 | File: `chapter11.mdx` | Section: Framework Implementations
- Old Chapter: New | Prerequisites: 5, 6, 7, 8, 9, 10

**Learning Objectives:**
- Implement MVVM in Lit web components
- Use reactive controllers for ViewModels
- Build standards-based web components
- Compare with previous frameworks

**Core Concepts:**
- Lit decorators (@state, @property)
- Reactive controllers for ViewModel integration
- Web components lifecycle
- disconnectedCallback for cleanup
- Standards-based approach

**Real Implementations:**
- `apps/mvvm-lit/src/components/sensor-dashboard.ts`
- `apps/mvvm-lit/src/components/sensor-list.ts`
- `apps/mvvm-lit/src/controllers/viewmodel-controller.ts`
- Same ViewModels as all previous frameworks

**Code Examples:**
1. Reactive controller for ViewModel
2. sensor-dashboard web component
3. @state decorator with observables
4. Comparison with React, Vue, Angular

**Content Structure:**
1. Lit and web components introduction
2. Reactive controllers pattern
3. Component implementation
4. Lifecycle management
5. Four-way comparison
6. Standards-based benefits

---

### Chapter 12: Vanilla JavaScript Implementation

**Metadata:**
- Chapter: 12 | File: `chapter12.mdx` | Section: Framework Implementations
- Old Chapter: New | Prerequisites: 5, 6, 7, 8, 9, 10, 11

**Learning Objectives:**
- Implement MVVM without any framework
- Direct observable subscriptions
- Manual DOM manipulation with ViewModels
- Prove framework independence completely

**Core Concepts:**
- Direct observable subscriptions
- Manual DOM manipulation
- EJS templates for rendering
- Manual lifecycle management
- Framework-free MVVM

**Real Implementations:**
- `apps/mvvm-vanilla/src/views/sensor-dashboard.ejs`
- `apps/mvvm-vanilla/src/controllers/SensorDashboardController.ts`
- Same ViewModels as all frameworks

**Code Examples:**
1. Direct subscription to ViewModel
2. Manual DOM updates
3. EJS template rendering
4. Complete five-way comparison table

**Content Structure:**
1. Framework-free MVVM introduction
2. Direct subscriptions
3. Manual DOM manipulation
4. EJS templates
5. Five-way comparison (all frameworks)
6. Framework independence proven

---

## Section 4: Framework-Agnostic Patterns (Chapters 13-17)

### Overview
This section teaches patterns and principles in general terms, using Web Loom libraries as concrete examples, not prescriptive solutions.

**Key Principle:** Patterns over libraries. Teach the "why" and "what" before the "how."

---

### Chapter 13: Reactive State Management Patterns

**Metadata:**
- Chapter: 13 | File: `chapter13.mdx` | Section: Framework-Agnostic Patterns
- Old Chapter: New | Prerequisites: 5

**Learning Objectives:**
- Understand reactive state patterns in general
- Learn signals pattern with signals-core as example
- Learn observable store pattern with store-core as example
- Compare alternatives (RxJS, native Proxy)
- Choose appropriate approach

**Core Concepts:**
- Reactive state patterns (signals, observables, stores)
- Why reactive state enables MVVM
- Signals pattern: writable signals, computed, effects
- Observable store pattern: minimal state management
- Alternative implementations
- Patterns are transferable

**Real Implementations:**
- `packages/signals-core/` - Signals pattern example
- `packages/store-core/` - Observable store example
- RxJS BehaviorSubject as alternative
- Native Proxy-based reactivity

**Code Examples:**
1. Signals pattern with signals-core
2. Observable store with store-core
3. RxJS BehaviorSubject alternative
4. Native Proxy reactivity
5. Comparison table

**Content Structure:**
1. Reactive state patterns overview
2. Why reactive state matters for MVVM
3. Signals pattern (general concept)
4. signals-core as example implementation
5. Observable store pattern (general concept)
6. store-core as example implementation
7. Alternative approaches
8. Choosing an approach
9. Patterns are transferable

---

### Chapter 14: Event-Driven Communication

**Metadata:**
- Chapter: 14 | File: `chapter14.mdx` | Section: Framework-Agnostic Patterns
- Old Chapter: 5 (renamed) | Prerequisites: 5

**Learning Objectives:**
- Understand event-driven architecture patterns
- Learn pub/sub pattern with event-bus-core as example
- Implement cross-component communication
- Compare alternatives (EventTarget, other libraries)

**Core Concepts:**
- Event-driven architecture patterns
- Pub/sub pattern for decoupled communication
- Domain events in frontend
- Cross-component communication
- Alternative implementations

**Real Implementations:**
- `packages/event-bus-core/` - Pub/sub example
- Native EventTarget as alternative
- GreenWatch domain events (ThresholdAlertTriggered, SensorReadingReceived)

**Code Examples:**
1. Pub/sub pattern with event-bus-core
2. Domain events in GreenWatch
3. Native EventTarget alternative
4. Cross-context communication

**Content Structure:**
1. Event-driven patterns overview
2. Why events matter for MVVM
3. Pub/sub pattern (general concept)
4. event-bus-core as example
5. Domain events in GreenWatch
6. Alternative approaches
7. When to use event-driven communication

---

### Chapter 15: Data Fetching and Caching Strategies

**Metadata:**
- Chapter: 15 | File: `chapter15.mdx` | Section: Framework-Agnostic Patterns
- Old Chapter: New | Prerequisites: 5

**Learning Objectives:**
- Understand data fetching patterns
- Learn async state management with query-core as example
- Implement caching and invalidation
- Compare alternatives (React Query, SWR, native fetch)

**Core Concepts:**
- Data fetching patterns: async state, caching, invalidation
- Why data fetching patterns enable MVVM
- query-core as framework-agnostic example
- Caching strategies
- Alternative implementations

**Real Implementations:**
- `packages/query-core/` - Data fetching example
- React Query as alternative
- Native fetch with manual caching
- GreenWatch sensor data fetching

**Code Examples:**
1. Data fetching with query-core
2. Caching and invalidation
3. React Query alternative
4. Native fetch with cache

**Content Structure:**
1. Data fetching patterns overview
2. Why data fetching matters for MVVM
3. Async state management (general concept)
4. query-core as example
5. Caching strategies
6. Alternative approaches
7. Choosing an approach

---

### Chapter 16: Headless UI Behaviors

**Metadata:**
- Chapter: 16 | File: `chapter16.mdx` | Section: Framework-Agnostic Patterns
- Old Chapter: New | Prerequisites: 6

**Learning Objectives:**
- Understand headless UI pattern
- Learn atomic behaviors with ui-core as example
- Implement framework-agnostic UI logic
- Understand behavior composition

**Core Concepts:**
- Headless UI pattern: behavior from presentation
- Why headless UI enables framework-agnostic MVVM
- Atomic behaviors: Dialog, Form, List Selection, Roving Focus, Disclosure
- ui-core as example
- Behavior composition

**Real Implementations:**
- `packages/ui-core/` - Headless UI example
- Dialog, Form, List Selection behaviors
- GreenWatch sensor configuration dialog

**Code Examples:**
1. Dialog behavior with ui-core
2. List selection for sensor list
3. Form behavior for sensor data
4. Behavior composition

**Content Structure:**
1. Headless UI pattern overview
2. Why headless UI matters for MVVM
3. Atomic behaviors (general concept)
4. ui-core as example
5. Behavior composition
6. GreenWatch examples
7. Alternative approaches

---

### Chapter 17: Composed UI Patterns

**Metadata:**
- Chapter: 17 | File: `chapter17.mdx` | Section: Framework-Agnostic Patterns
- Old Chapter: New | Prerequisites: 16

**Learning Objectives:**
- Understand composed UI patterns
- Learn pattern composition with ui-patterns as example
- Implement Master-Detail, Wizard, Modal, Command Palette
- Build framework-agnostic UI patterns

**Core Concepts:**
- Composed UI patterns: Master-Detail, Wizard, Modal, Command Palette
- Why composed patterns enable reusable MVVM components
- Pattern composition from atomic behaviors
- ui-patterns as example
- Event-driven pattern communication

**Real Implementations:**
- `packages/ui-patterns/` - Composed patterns example
- Master-Detail for sensor list/detail
- Wizard for greenhouse setup
- Modal for sensor configuration

**Code Examples:**
1. Master-Detail pattern with ui-patterns
2. Wizard pattern for multi-step forms
3. Modal pattern for dialogs
4. Pattern composition from ui-core behaviors

**Content Structure:**
1. Composed patterns overview
2. Why composed patterns matter for MVVM
3. Pattern composition (general concept)
4. ui-patterns as example
5. GreenWatch pattern examples
6. Event-driven communication
7. Integration with ViewModels

---

## Section 5: Advanced Topics (Chapters 18-21)

### Overview
This section covers advanced MVVM topics: DDD, testing, plugin architecture, and design systems.

---

### Chapter 18: Domain-Driven Design for Frontend

**Metadata:**
- Chapter: 18 | File: `chapter18.mdx` | Section: Advanced Topics
- Old Chapter: 4 (moved) | Prerequisites: 4, 5, 14

**Learning Objectives:**
- Understand DDD principles for frontend
- Learn bounded contexts in frontend apps
- Implement aggregates and domain events
- Apply DDD to GreenWatch domain model

**Core Concepts:**
- DDD principles for frontend
- Bounded contexts and context mapping
- Aggregates and entities
- Domain events in frontend
- Ubiquitous language
- GreenWatch as DDD example

**Real Implementations:**
- GreenWatch domain model (Greenhouse, Sensor, SensorReading, ThresholdAlert)
- Bounded contexts: Monitoring, Alerting, Configuration
- Domain events: ThresholdAlertTriggered, SensorReadingReceived

**Code Examples:**
1. GreenWatch aggregates
2. Bounded contexts
3. Domain events
4. Ubiquitous language in code

**Content Structure:**
1. DDD principles overview
2. Bounded contexts in GreenWatch
3. Aggregates and entities
4. Domain events
5. Ubiquitous language
6. Value objects and services
7. Repository pattern

---

### Chapter 19: Testing MVVM Applications

**Metadata:**
- Chapter: 19 | File: `chapter19.mdx` | Section: Advanced Topics
- Old Chapter: 8 (renamed) | Prerequisites: 4, 5, 6

**Learning Objectives:**
- Understand testing strategies for MVVM layers
- Learn unit testing for ViewModels
- Learn unit testing for Models with Zod
- Implement integration testing across layers
- Use Vitest for MVVM testing

**Core Concepts:**
- Testing strategies for Models, ViewModels, Views
- Unit testing ViewModels in isolation
- Testing Models with Zod validation
- Integration testing across layers
- Vitest configuration
- Testing benefits of separation of concerns

**Real Implementations:**
- Test files from `packages/mvvm-core/`
- Test files from `packages/view-models/`
- GreenWatch ViewModel tests
- Model validation tests

**Code Examples:**
1. Testing SensorViewModel
2. Testing Model with Zod validation
3. Integration test across layers
4. Vitest configuration

**Content Structure:**
1. Testing strategies overview
2. Unit testing ViewModels
3. Testing Models with Zod
4. Integration testing
5. Vitest setup
6. Testing benefits of MVVM
7. Best practices

---

### Chapter 20: Plugin Architecture and Extensibility

**Metadata:**
- Chapter: 20 | File: `chapter20.mdx` | Section: Advanced Topics
- Old Chapter: New | Prerequisites: 5, 7

**Learning Objectives:**
- Understand plugin architecture patterns
- Learn PluginRegistry and lifecycle management
- Implement FrameworkAdapter abstraction
- Use PluginManifest for configuration
- Build runtime-extensible applications

**Core Concepts:**
- Plugin architecture patterns
- PluginRegistry: framework-agnostic plugin management
- Plugin lifecycle states
- FrameworkAdapter: mounting plugins in frameworks
- PluginManifest: Zod-validated configuration
- PluginSDK: host communication

**Real Implementations:**
- `packages/plugin-core/` - Plugin architecture
- `apps/plugin-react/` - React plugin host
- PluginRegistry, FrameworkAdapter, PluginManifest

**Code Examples:**
1. PluginRegistry implementation
2. FrameworkAdapter for React
3. PluginManifest validation
4. Plugin lifecycle management

**Content Structure:**
1. Plugin architecture overview
2. PluginRegistry
3. Plugin lifecycle
4. FrameworkAdapter
5. PluginManifest
6. PluginSDK
7. Security considerations

---

### Chapter 21: Design Systems and Theming

**Metadata:**
- Chapter: 21 | File: `chapter21.mdx` | Section: Advanced Topics
- Old Chapter: New | Prerequisites: 6

**Learning Objectives:**
- Understand design token and theming patterns
- Learn design token system with design-core as example
- Implement CSS custom properties generation
- Build dynamic theming with light/dark mode
- Create framework-agnostic design systems

**Core Concepts:**
- Design token and theming patterns
- Why design systems matter for MVVM
- design-core as example
- CSS custom properties for theming
- Dynamic theming and mode switching
- Framework-agnostic design systems

**Real Implementations:**
- `packages/design-core/` - Design token system
- `packages/typography-core/` - Typography utilities
- CSS custom properties
- GreenWatch theming

**Code Examples:**
1. Design tokens with design-core
2. CSS custom properties generation
3. Light/dark mode implementation
4. Typography and color utilities

**Content Structure:**
1. Design systems overview
2. Why design systems matter for MVVM
3. Design token pattern (general concept)
4. design-core as example
5. CSS custom properties
6. Dynamic theming
7. Alternative approaches

---

## Section 6: Real-World Applications (Chapters 22-23)

### Overview
This section brings everything together with complete case studies and best practices.

---

### Chapter 22: Complete Case Studies

**Metadata:**
- Chapter: 22 | File: `chapter22.mdx` | Section: Real-World Applications
- Old Chapter: 15 (renamed) | Prerequisites: All previous chapters

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
- How all patterns integrate

**Real Implementations:**
- Complete GreenWatch across React, Vue, Angular, Lit, Vanilla JS
- E-commerce application
- All ViewModels, Models, Views
- Architecture diagrams

**Code Examples:**
1. Complete GreenWatch architecture
2. Multi-framework showcase
3. E-commerce patterns
4. Performance considerations

**Content Structure:**
1. GreenWatch complete walkthrough
2. Architecture and bounded contexts
3. Multi-framework implementation
4. E-commerce case study
5. Contrasting domains
6. Performance and scalability
7. Lessons learned

---

### Chapter 23: Conclusion and Best Practices

**Metadata:**
- Chapter: 23 | File: `chapter23.mdx` | Section: Real-World Applications
- Old Chapter: 21 (kept) | Prerequisites: All previous chapters

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

**Content Structure:**
1. MVVM patterns recap
2. When to use MVVM
3. Architectural tradeoffs
4. Best practices
5. Common pitfalls
6. Framework-agnostic thinking
7. Patterns over libraries
8. Next steps for readers
9. Resources for continued learning

---

## Implementation Notes

### Code Extraction Strategy

For all chapters:
1. Use real, working code from monorepo
2. Keep examples focused and relevant
3. Provide file paths and context
4. Show complete examples for key concepts
5. Use proper syntax highlighting

### File Paths Reference

**Framework Implementations:**
- React: `apps/mvvm-react/`
- Vue: `apps/mvvm-vue/`
- Angular: `apps/mvvm-angular/`
- Lit: `apps/mvvm-lit/`
- Vanilla JS: `apps/mvvm-vanilla/`

**Framework-Agnostic Libraries:**
- signals-core: `packages/signals-core/`
- store-core: `packages/store-core/`
- event-bus-core: `packages/event-bus-core/`
- query-core: `packages/query-core/`
- ui-core: `packages/ui-core/`
- ui-patterns: `packages/ui-patterns/`
- design-core: `packages/design-core/`

**Plugin Architecture:**
- plugin-core: `packages/plugin-core/`
- plugin-react: `apps/plugin-react/`

### Pedagogical Flow

**Framework Implementations (8-12):**
- Progressive framework comparison
- Same ViewModels, different Views
- Framework independence proven

**Framework-Agnostic Patterns (13-17):**
- Patterns first, libraries as examples
- Multiple implementation approaches
- Transferable knowledge emphasized

**Advanced Topics (18-21):**
- DDD, testing, plugins, design systems
- Real-world complexity
- Production-ready patterns

**Real-World Applications (22-23):**
- Complete case studies
- All patterns integrated
- Best practices and next steps

### Writing Guidelines

1. **Patterns over libraries:** Teach general concepts first
2. **Show alternatives:** Present multiple implementation approaches
3. **Use real code:** GreenWatch examples throughout
4. **Build progressively:** Simple to complex
5. **Connect chapters:** Reference previous, preview future
6. **Include diagrams:** Visual aids for architecture
7. **Provide summaries:** Key takeaways at end of sections

---

## Summary

These comprehensive rewrite plans cover all remaining chapters (8-23):

**Framework Implementations (8-12):**
- React, Vue, Angular, Lit, Vanilla JS
- Same ViewModels across all frameworks
- Framework independence demonstrated

**Framework-Agnostic Patterns (13-17):**
- Reactive state, events, data fetching, UI behaviors, composed patterns
- Patterns taught first, Web Loom libraries as examples
- Alternative implementations shown
- Transferable knowledge emphasized

**Advanced Topics (18-21):**
- DDD, testing, plugin architecture, design systems
- Real-world complexity and production patterns

**Real-World Applications (22-23):**
- Complete GreenWatch and e-commerce case studies
- All patterns integrated
- Best practices and conclusion

**Ready for Phase 4: Chapter Rewriting**
