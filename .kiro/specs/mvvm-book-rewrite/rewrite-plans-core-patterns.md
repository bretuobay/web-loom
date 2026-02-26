# Rewrite Plans: Core Patterns Section (Chapters 4-7)

**Generated:** 2025-01-15  
**Phase:** 3.2 - Rewrite Plan Generation  
**Section:** Core Patterns (Chapters 4-7)  
**Purpose:** Detailed rewrite plans for the Core Patterns section covering Models, ViewModels, Views, and DI

---

## Overview

This document provides comprehensive rewrite plans for the Core Patterns section (Chapters 4-7). Each plan includes:

- Learning objectives
- Core concepts to teach
- Real implementations to reference
- Code examples to extract (with file paths)
- Dependencies on previous chapters
- Content structure outline
- Key teaching points

---

## Chapter 4: Building Framework-Agnostic Models

### Metadata
- **Chapter Number:** 4
- **File Name:** `chapter4.mdx`
- **Section:** Core Patterns
- **Old Chapter Number:** New chapter (content extracted from various sources)
- **Prerequisites:** Chapter 3 (MVVM Fundamentals)
- **Enables:** Chapters 5, 6, 18

### Learning Objectives
1. Understand Model layer responsibilities in MVVM
2. Learn how to build framework-agnostic Models
3. Implement domain logic in Models
4. Use Zod for validation in Models
5. Understand BaseModel and RestfulApiModel patterns
6. Learn reactive state management with RxJS in Models

### Core Concepts to Teach

1. **Model as domain logic container**
   - Models encapsulate business rules and data
   - Framework-independent implementation
   - Single source of truth for domain logic
   
2. **Framework independence in Models**
   - No framework dependencies
   - Pure TypeScript/JavaScript
   - Reusable across all platforms
   
3. **Validation with Zod schemas**
   - Type-safe validation
   - Runtime type checking
   - Validation error handling
   
4. **BaseModel pattern with reactive state**
   - RxJS BehaviorSubject for state
   - Observable streams (data$, isLoading$, error$)
   - Subscription management
   
5. **RestfulApiModel for API operations**
   - CRUD operations
   - Pagination support
   - Error handling
   
6. **GreenWatch Model implementations**
   - Sensor, SensorReading, Greenhouse, ThresholdAlert
   - Domain-specific validation
   - Real-world examples

### Real Implementations to Reference

**Core MVVM Models:**
- `packages/mvvm-core/src/models/BaseModel.ts` - Base Model implementation
- `packages/mvvm-core/src/models/RestfulApiModel.ts` - RESTful API Model
- `packages/mvvm-core/src/models/QueryStateModel.ts` - Query state Model

**GreenWatch Domain Models:**
- `packages/models/src/GreenHouseModel.ts` - Greenhouse entity
- `packages/models/src/SensorModel.ts` - Sensor entity
- `packages/models/src/ThresholdAlertModel.ts` - ThresholdAlert entity

**Zod Schemas:**
- `packages/models/src/schemas/` - Validation schemas


### Code Examples to Extract

**Example 1: BaseModel - Core Pattern**
```typescript
// File: packages/mvvm-core/src/models/BaseModel.ts
// Extract: Complete BaseModel showing:
// - BehaviorSubject for reactive state
// - data$, isLoading$, error$ observables
// - Zod validation integration
// - Framework-agnostic design
// - Lifecycle management
```

**Example 2: RestfulApiModel - API Integration**
```typescript
// File: packages/mvvm-core/src/models/RestfulApiModel.ts
// Extract: RestfulApiModel showing:
// - CRUD operations (create, read, update, delete)
// - Pagination support
// - Error handling
// - Loading state management
```

**Example 3: SensorModel - Domain Model**
```typescript
// File: packages/models/src/SensorModel.ts
// Extract: Complete Sensor model showing:
// - Domain entity structure
// - Zod schema for validation
// - Type definitions
// - Business rules
```

**Example 4: Zod Validation in Action**
```typescript
// File: packages/mvvm-core/src/models/BaseModel.ts
// Extract: Validation logic showing:
// - Zod schema validation
// - Error handling
// - Validation error propagation
```

### Content Structure Outline

1. **Introduction: The Model Layer**
   - Role of Models in MVVM
   - What belongs in a Model
   - Framework independence principle
   - Preview of GreenWatch Models

2. **BaseModel Pattern**
   - Core responsibilities
   - Reactive state with RxJS
   - BehaviorSubject vs Observable
   - data$, isLoading$, error$ observables
   - Code walkthrough of BaseModel
   - Why reactive state matters

3. **Validation with Zod**
   - Why validation in Models
   - Zod schema basics
   - Runtime type checking
   - Validation error handling
   - Example: Sensor validation
   - Benefits of type-safe validation

4. **RestfulApiModel Pattern**
   - Extending BaseModel
   - CRUD operations
   - Pagination support
   - Error handling strategies
   - Code walkthrough
   - When to use RestfulApiModel

5. **GreenWatch Domain Models**
   - Sensor Model implementation
   - SensorReading Model
   - Greenhouse Model
   - ThresholdAlert Model
   - Domain-specific validation
   - Relationships between entities

6. **Framework Independence**
   - No framework dependencies
   - Pure TypeScript implementation
   - Reusable across platforms
   - Testing benefits
   - Migration benefits

7. **Best Practices**
   - Keep Models focused
   - Validation at the boundary
   - Error handling patterns
   - Subscription management
   - When to create new Models

### Key Teaching Points

1. **Start with why:** Explain why Models should be framework-agnostic
2. **Show real code:** Use actual GreenWatch Models throughout
3. **Emphasize validation:** Highlight Zod's role in type safety
4. **Demonstrate reusability:** Show how Models work across frameworks
5. **Build progressively:** Start with BaseModel, then RestfulApiModel, then domain models

### Dependencies
- **Prerequisites:** Chapter 3 (MVVM Fundamentals)
- **Enables:** Chapter 5 (ViewModels), Chapter 18 (DDD)

---

## Chapter 5: ViewModels and Reactive State

### Metadata
- **Chapter Number:** 5
- **File Name:** `chapter5.mdx`
- **Section:** Core Patterns
- **Old Chapter Number:** 6 (renamed from "Reactive State Management with RxJS")
- **Prerequisites:** Chapter 4 (Models)
- **Enables:** Chapters 6, 7, 8-12, 13

### Learning Objectives
1. Understand ViewModel layer responsibilities
2. Learn how ViewModels connect Models to Views
3. Implement reactive state with RxJS observables
4. Manage ViewModel lifecycle
5. Understand BaseViewModel and RestfulApiViewModel patterns
6. Learn presentation logic separation

### Core Concepts to Teach

1. **ViewModel as presentation logic layer**
   - Connects Model to View
   - Transforms data for presentation
   - Handles user interactions
   - Manages UI state
   
2. **Reactive state with RxJS**
   - BehaviorSubject for state
   - Observable for read-only streams
   - Subscription management
   - takeUntil pattern for cleanup
   
3. **ViewModel lifecycle management**
   - Creation and initialization
   - Mounting and unmounting
   - Subscription cleanup
   - dispose() pattern
   
4. **BaseViewModel pattern**
   - Core ViewModel functionality
   - Observable state exposure
   - Lifecycle hooks
   - Framework-agnostic design
   
5. **RestfulApiViewModel with CRUD operations**
   - Extends BaseViewModel
   - CRUD method wrappers
   - Pagination support
   - Loading and error state
   
6. **GreenWatch ViewModel implementations**
   - GreenHouseViewModel
   - SensorViewModel
   - SensorReadingViewModel
   - ThresholdAlertViewModel
   
7. **Introduction to reactive state patterns**
   - Preview of Chapter 13
   - RxJS as one approach
   - Alternative patterns exist

### Real Implementations to Reference

**Core MVVM ViewModels:**
- `packages/mvvm-core/src/viewmodels/BaseViewModel.ts` - Base ViewModel
- `packages/mvvm-core/src/viewmodels/RestfulApiViewModel.ts` - RESTful API ViewModel
- `packages/mvvm-core/src/viewmodels/QueryStateViewModel.ts` - Query state ViewModel

**GreenWatch ViewModels:**
- `packages/view-models/src/GreenHouseViewModel.ts` - Greenhouse ViewModel
- `packages/view-models/src/SensorViewModel.ts` - Sensor ViewModel
- `packages/view-models/src/SensorReadingViewModel.ts` - SensorReading ViewModel
- `packages/view-models/src/ThresholdAlertViewModel.ts` - ThresholdAlert ViewModel

### Code Examples to Extract

**Example 1: BaseViewModel - Core Pattern**
```typescript
// File: packages/mvvm-core/src/viewmodels/BaseViewModel.ts
// Extract: Complete BaseViewModel showing:
// - Connection to Model
// - Observable state exposure
// - Lifecycle management (dispose)
// - takeUntil pattern for cleanup
// - Framework-agnostic design
```

**Example 2: SensorViewModel - Complete ViewModel**
```typescript
// File: packages/view-models/src/SensorViewModel.ts
// Extract: Complete ViewModel showing:
// - Extends BaseViewModel or RestfulApiViewModel
// - Presentation logic
// - User action handlers
// - Observable state for UI
// - Real-world complexity
```

**Example 3: RestfulApiViewModel - CRUD Operations**
```typescript
// File: packages/mvvm-core/src/viewmodels/RestfulApiViewModel.ts
// Extract: RestfulApiViewModel showing:
// - CRUD method wrappers
// - Pagination support
// - Loading state management
// - Error handling
```

**Example 4: Lifecycle Management**
```typescript
// File: packages/view-models/src/SensorViewModel.ts
// Extract: Lifecycle methods showing:
// - Initialization
// - Subscription setup
// - Cleanup with dispose()
// - takeUntil pattern
```

### Content Structure Outline

1. **Introduction: The ViewModel Layer**
   - Role of ViewModels in MVVM
   - Presentation logic vs business logic
   - Framework independence
   - Preview of GreenWatch ViewModels

2. **BaseViewModel Pattern**
   - Core responsibilities
   - Connecting to Models
   - Exposing observables to Views
   - Lifecycle management
   - Code walkthrough
   - Why ViewModels matter

3. **Reactive State with RxJS**
   - BehaviorSubject for state
   - Observable for read-only streams
   - Subscription management
   - takeUntil pattern
   - Example: Sensor state
   - Note: RxJS is one approach (Chapter 13 covers alternatives)

4. **RestfulApiViewModel Pattern**
   - Extending BaseViewModel
   - CRUD operations
   - Pagination support
   - Loading and error state
   - Code walkthrough
   - When to use RestfulApiViewModel

5. **GreenWatch ViewModels**
   - SensorViewModel implementation
   - GreenHouseViewModel
   - SensorReadingViewModel
   - ThresholdAlertViewModel
   - Presentation logic examples
   - User interaction handling

6. **Lifecycle Management**
   - Creation and initialization
   - Mounting in Views
   - Subscription cleanup
   - dispose() pattern
   - Memory leak prevention
   - Framework-specific considerations

7. **Presentation Logic**
   - What belongs in ViewModels
   - Data transformation for UI
   - UI state management
   - Validation error formatting
   - Example: Sensor reading formatting

8. **Best Practices**
   - Keep ViewModels focused
   - Avoid business logic in ViewModels
   - Proper cleanup
   - Testing ViewModels
   - When to create new ViewModels

### Key Teaching Points

1. **Clarify ViewModel role:** Distinguish from Model and View
2. **Show real complexity:** Use actual GreenWatch ViewModels
3. **Emphasize lifecycle:** Highlight cleanup importance
4. **Preview alternatives:** Mention Chapter 13 for other reactive patterns
5. **Build on Models:** Show how ViewModels use Models from Chapter 4

### Dependencies
- **Prerequisites:** Chapter 4 (Models)
- **Enables:** Chapter 6 (Views), Chapters 8-12 (Framework implementations), Chapter 13 (Reactive patterns)

---

## Chapter 6: The View Layer Contract

### Metadata
- **Chapter Number:** 6
- **File Name:** `chapter6.mdx`
- **Section:** Core Patterns
- **Old Chapter Number:** 10 (renamed from "The Dumb View Philosophy")
- **Prerequisites:** Chapter 5 (ViewModels)
- **Enables:** Chapters 7, 8-12

### Learning Objectives
1. Understand View layer responsibilities
2. Learn the "dumb view" philosophy
3. Understand how Views consume ViewModels
4. See View implementations across multiple frameworks
5. Learn View layer best practices
6. Understand the View-ViewModel contract

### Core Concepts to Teach

1. **View as pure presentation layer**
   - Rendering UI based on ViewModel state
   - No business logic
   - No direct Model access
   - Framework-specific implementation
   
2. **Dumb view philosophy**
   - Views should be "dumb" (no logic)
   - All logic in ViewModels
   - Benefits for testing
   - Benefits for reusability
   
3. **View-ViewModel contract**
   - Views subscribe to ViewModel observables
   - Views call ViewModel methods
   - Unidirectional data flow
   - Clear boundaries
   
4. **Subscribing to ViewModel observables**
   - Framework-specific patterns
   - Subscription cleanup
   - Reactive rendering
   
5. **Framework-specific View patterns**
   - React: hooks and useEffect
   - Vue: Composition API and watchEffect
   - Angular: async pipe and DI
   - Lit: reactive controllers
   - Vanilla JS: direct subscriptions
   
6. **Comparison across frameworks**
   - Same ViewModel, different Views
   - Framework independence demonstrated
   - Pattern consistency

### Real Implementations to Reference

**React Views:**
- `apps/mvvm-react/src/components/SensorDashboard.tsx`
- `apps/mvvm-react/src/components/SensorList.tsx`
- `apps/mvvm-react/src/components/SensorDetail.tsx`

**Vue Views:**
- `apps/mvvm-vue/src/components/SensorDashboard.vue`
- `apps/mvvm-vue/src/components/SensorList.vue`

**Angular Views:**
- `apps/mvvm-angular/src/app/components/sensor-dashboard/`
- `apps/mvvm-angular/src/app/components/sensor-list/`

**Lit Views:**
- `apps/mvvm-lit/src/components/sensor-dashboard.ts`

**Vanilla JS Views:**
- `apps/mvvm-vanilla/src/views/sensor-dashboard.ejs`

### Code Examples to Extract

**Example 1: React View - Sensor Dashboard**
```typescript
// File: apps/mvvm-react/src/components/SensorDashboard.tsx
// Extract: Component showing:
// - Subscribing to ViewModel observables with useEffect
// - Rendering based on ViewModel state
// - Calling ViewModel methods
// - Cleanup on unmount
// - Minimal component logic
```

**Example 2: Vue View - Same Dashboard**
```typescript
// File: apps/mvvm-vue/src/components/SensorDashboard.vue
// Extract: Component showing:
// - Same ViewModel used in different framework
// - Vue-specific subscription pattern (watchEffect)
// - Composition API usage
// - Demonstrates framework independence
```

**Example 3: Angular View - Same Dashboard**
```typescript
// File: apps/mvvm-angular/src/app/components/sensor-dashboard/
// Extract: Component showing:
// - Dependency injection for ViewModel
// - Async pipe for observables
// - Angular-specific patterns
// - Same ViewModel, different View
```

**Example 4: Dumb View Example**
```typescript
// File: apps/mvvm-react/src/components/SensorList.tsx
// Extract: Simple component showing:
// - Pure presentation
// - No logic
// - Props from ViewModel
// - Event handlers calling ViewModel methods
```

### Content Structure Outline

1. **Introduction: The View Layer**
   - Role of Views in MVVM
   - What belongs in Views
   - What doesn't belong in Views
   - Framework-specific nature

2. **The Dumb View Philosophy**
   - What is a "dumb view"?
   - Why dumb views matter
   - Benefits for testing
   - Benefits for reusability
   - Example: Sensor list component

3. **The View-ViewModel Contract**
   - Views subscribe to ViewModel observables
   - Views call ViewModel methods
   - Unidirectional data flow
   - Clear boundaries
   - Diagram of contract

4. **Subscribing to ViewModels**
   - Observable subscription patterns
   - Framework-specific approaches
   - Cleanup and lifecycle
   - Example: Sensor dashboard

5. **React View Implementation**
   - Hooks pattern
   - useEffect for subscriptions
   - Custom hooks for ViewModels
   - Code walkthrough
   - GreenWatch React example

6. **Vue View Implementation**
   - Composition API
   - watchEffect for subscriptions
   - Composables for ViewModels
   - Code walkthrough
   - Same ViewModel, different View

7. **Angular View Implementation**
   - Dependency injection
   - Async pipe
   - Services for ViewModels
   - Code walkthrough
   - Framework independence demonstrated

8. **Cross-Framework Comparison**
   - Same ViewModel across frameworks
   - Different subscription patterns
   - Same functionality
   - Framework independence proven
   - Table comparing approaches

9. **When Views Can Have Logic**
   - Local UI state (not domain state)
   - Animation and transitions
   - Form input handling
   - Accessibility concerns
   - Examples of acceptable View logic

10. **Best Practices**
    - Keep Views simple
    - Avoid business logic
    - Proper cleanup
    - Accessibility
    - Performance considerations

### Key Teaching Points

1. **Emphasize simplicity:** Views should be simple and focused
2. **Show cross-framework:** Use same ViewModel in multiple frameworks
3. **Clarify boundaries:** Be clear about what belongs in Views
4. **Use real examples:** GreenWatch components throughout
5. **Preview framework chapters:** Mention Chapters 8-12 for deep dives

### Dependencies
- **Prerequisites:** Chapter 5 (ViewModels)
- **Enables:** Chapter 7 (DI and Lifecycle), Chapters 8-12 (Framework implementations)

---

## Chapter 7: Dependency Injection and Lifecycle Management

### Metadata
- **Chapter Number:** 7
- **File Name:** `chapter7.mdx`
- **Section:** Core Patterns
- **Old Chapter Number:** 9 (renamed from "Dependency Injection and Service Architecture")
- **Prerequisites:** Chapters 5, 6
- **Enables:** Chapters 8-12

### Learning Objectives
1. Understand dependency injection patterns for ViewModels
2. Learn ViewModel lifecycle management
3. Implement DI container for MVVM
4. Manage subscriptions and cleanup
5. Understand framework-specific DI approaches
6. Learn service locator vs dependency injection

### Core Concepts to Teach

1. **Dependency injection for ViewModels**
   - Why DI matters
   - Constructor injection
   - Service locator pattern
   - DI container implementation
   
2. **DI container implementation**
   - Simple DI container
   - Registration and resolution
   - Singleton vs transient
   - Framework-agnostic DI
   
3. **ViewModel lifecycle**
   - Creation and initialization
   - Mounting in Views
   - Unmounting and cleanup
   - dispose() pattern
   
4. **Subscription cleanup**
   - takeUntil pattern
   - Memory leak prevention
   - Proper disposal
   - Framework-specific cleanup
   
5. **Framework-specific DI**
   - Angular: Native DI system
   - React: Context API
   - Vue: provide/inject
   - Lit: Dependency injection patterns
   - Vanilla JS: Manual DI
   
6. **Service locator vs DI**
   - Tradeoffs
   - When to use each
   - Testing implications

### Real Implementations to Reference

**DI Container:**
- `packages/mvvm-core/src/core/di-container.ts` - Simple DI container

**Angular DI:**
- `apps/mvvm-angular/src/app/services/` - Angular services
- `apps/mvvm-angular/src/app/tokens/` - InjectionTokens

**React Context:**
- `apps/mvvm-react/src/contexts/` - React Context for ViewModels

**Vue Provide/Inject:**
- `apps/mvvm-vue/src/composables/` - Vue composables with provide/inject

### Code Examples to Extract

**Example 1: DI Container Implementation**
```typescript
// File: packages/mvvm-core/src/core/di-container.ts
// Extract: Complete DI container showing:
// - Registration methods
// - Resolution methods
// - Singleton vs transient
// - Type-safe API
```

**Example 2: Angular DI for ViewModels**
```typescript
// File: apps/mvvm-angular/src/app/tokens/viewmodel.tokens.ts
// Extract: InjectionTokens showing:
// - ViewModel token definitions
// - Provider configuration
// - Dependency injection setup
```

**Example 3: React Context for ViewModels**
```typescript
// File: apps/mvvm-react/src/contexts/SensorContext.tsx
// Extract: Context showing:
// - Context creation
// - Provider component
// - Custom hook for consumption
// - ViewModel lifecycle management
```

**Example 4: Lifecycle Management**
```typescript
// File: packages/view-models/src/SensorViewModel.ts
// Extract: Lifecycle methods showing:
// - Initialization
// - Subscription setup
// - Cleanup with dispose()
// - takeUntil pattern
```

### Content Structure Outline

1. **Introduction: DI and Lifecycle**
   - Why DI matters for MVVM
   - Lifecycle management importance
   - Framework considerations
   - Preview of patterns

2. **Dependency Injection Basics**
   - What is DI?
   - Constructor injection
   - Service locator pattern
   - Benefits for testing
   - Benefits for flexibility

3. **DI Container Implementation**
   - Simple DI container
   - Registration and resolution
   - Singleton vs transient
   - Code walkthrough
   - When to use a container

4. **ViewModel Lifecycle**
   - Creation and initialization
   - Mounting in Views
   - Active state
   - Unmounting and cleanup
   - Lifecycle diagram

5. **Subscription Management**
   - takeUntil pattern with RxJS
   - Memory leak prevention
   - dispose() pattern
   - Example: Sensor ViewModel cleanup
   - Best practices

6. **Angular DI for ViewModels**
   - Native DI system
   - InjectionTokens
   - Provider configuration
   - Service injection
   - Code walkthrough

7. **React Context for ViewModels**
   - Context API
   - Provider pattern
   - Custom hooks
   - ViewModel lifecycle in React
   - Code walkthrough

8. **Vue Provide/Inject**
   - provide/inject API
   - Composables pattern
   - ViewModel lifecycle in Vue
   - Code walkthrough

9. **Lit and Vanilla JS DI**
   - Manual DI patterns
   - Service locator
   - ViewModel management
   - Simpler approaches

10. **Service Locator vs DI**
    - Tradeoffs
    - When to use each
    - Testing implications
    - Flexibility considerations

11. **Best Practices**
    - Always clean up subscriptions
    - Use framework DI when available
    - Keep DI simple
    - Test with DI
    - Avoid service locator anti-pattern

### Key Teaching Points

1. **Emphasize cleanup:** Lifecycle management prevents memory leaks
2. **Show framework patterns:** Different DI approaches per framework
3. **Use real code:** GreenWatch DI examples
4. **Explain tradeoffs:** Service locator vs DI
5. **Build on previous:** Connect to ViewModels from Chapter 5

### Dependencies
- **Prerequisites:** Chapters 5 (ViewModels), 6 (Views)
- **Enables:** Chapters 8-12 (Framework implementations)

---

## Implementation Notes

### Code Extraction Strategy

For each chapter, code examples should be extracted from the monorepo following these guidelines:

1. **Use real, working code:** Extract from actual implementations
2. **Keep examples focused:** Show only relevant parts
3. **Provide context:** Include file paths and explanations
4. **Show complete examples:** For key concepts, show full implementation
5. **Use syntax highlighting:** Ensure all code blocks have proper language tags

### File Paths Reference

**Core MVVM:**
- `packages/mvvm-core/src/models/BaseModel.ts`
- `packages/mvvm-core/src/models/RestfulApiModel.ts`
- `packages/mvvm-core/src/viewmodels/BaseViewModel.ts`
- `packages/mvvm-core/src/viewmodels/RestfulApiViewModel.ts`
- `packages/mvvm-core/src/core/di-container.ts`

**Domain Models:**
- `packages/models/src/GreenHouseModel.ts`
- `packages/models/src/SensorModel.ts`
- `packages/models/src/ThresholdAlertModel.ts`

**ViewModels:**
- `packages/view-models/src/GreenHouseViewModel.ts`
- `packages/view-models/src/SensorViewModel.ts`
- `packages/view-models/src/SensorReadingViewModel.ts`
- `packages/view-models/src/ThresholdAlertViewModel.ts`

**Framework Views:**
- `apps/mvvm-react/src/components/`
- `apps/mvvm-vue/src/components/`
- `apps/mvvm-angular/src/app/components/`
- `apps/mvvm-lit/src/components/`
- `apps/mvvm-vanilla/src/views/`

### Pedagogical Flow

The Core Patterns section follows this learning progression:

1. **Chapter 4:** Models → Foundation of domain logic
2. **Chapter 5:** ViewModels → Presentation logic layer
3. **Chapter 6:** Views → UI rendering layer
4. **Chapter 7:** DI and Lifecycle → Connecting the pieces

Each chapter builds on the previous, creating a coherent narrative from data layer to presentation layer to lifecycle management.

### Writing Guidelines

1. **Start with why:** Always explain why a concept matters
2. **Use concrete examples:** Every concept with GreenWatch code
3. **Show, don't just tell:** Use code examples liberally
4. **Build progressively:** Simple concepts before complex
5. **Connect chapters:** Reference previous and preview future
6. **Use consistent terminology:** Maintain consistent language
7. **Include diagrams:** Visual aids for architecture and flow
8. **Provide summaries:** End sections with key takeaways

---

## Summary

These rewrite plans provide a comprehensive roadmap for rewriting the Core Patterns section (Chapters 4-7). Each plan includes:

- Clear learning objectives
- Core concepts to teach
- Real implementations from the monorepo
- Specific code examples with file paths
- Content structure outlines
- Key teaching points
- Dependencies and relationships

The plans ensure that the rewritten chapters will:
- Use real GreenWatch code throughout
- Follow a clear pedagogical progression
- Build on each other coherently
- Provide a solid foundation for framework implementations
- Engage readers with concrete, practical examples

**Ready for Phase 4: Chapter Rewriting**
