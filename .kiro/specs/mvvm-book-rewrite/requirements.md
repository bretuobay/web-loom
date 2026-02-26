# Requirements Document: MVVM Book Rewrite

## Introduction

This document specifies requirements for systematically rewriting a technical book about MVVM (Model-View-ViewModel) architecture in frontend development. The book currently exists as 21 chapters in MDX format but uses hypothetical examples that don't align with the actual working implementations in the Web Loom monorepo. The rewrite will transform the book into a comprehensive, pedagogically sound guide grounded in real, working code from the greenhouse monitoring system (GreenWatch), e-commerce application, plugin architecture, and supporting libraries.

## Glossary

- **Book**: The MVVM technical book located in `apps/docs/content/book/chapters/`
- **Chapter**: An individual MDX file representing one chapter of the book
- **GreenWatch**: The greenhouse monitoring system implemented across multiple frameworks (React, Vue, Angular, Lit, Vanilla JS)
- **Web_Loom**: The monorepo containing all implementations and libraries
- **MVVM**: Model-View-ViewModel architectural pattern
- **ViewModel**: Framework-agnostic presentation logic layer
- **Model**: Domain logic and data layer
- **View**: Framework-specific UI layer
- **Real_Implementation**: Actual working code from the monorepo (as opposed to hypothetical examples)
- **Framework**: A UI library/framework (React, Vue, Angular, Lit, Vanilla JS)
- **Section**: A logical grouping of related chapters
- **Pedagogical_Flow**: The logical progression from beginner to advanced concepts
- **Code_Example**: Actual code snippets extracted from working implementations
- **Supporting_Library**: Shared packages like store-core, event-bus-core, query-core, ui-core, forms-core, etc.

## Requirements

### Requirement 1: Content Analysis and Inventory

**User Story:** As a technical writer, I want to analyze the current book structure and available implementations, so that I can plan a comprehensive rewrite strategy.

#### Acceptance Criteria

1. WHEN analyzing the book, THE System SHALL identify all 21 existing chapters with their titles, sections, and metadata
2. WHEN analyzing implementations, THE System SHALL catalog all available ViewModels in `packages/view-models/`
3. WHEN analyzing implementations, THE System SHALL catalog all framework implementations in `apps/mvvm-*` directories
4. WHEN analyzing implementations, THE System SHALL identify all supporting libraries with their purposes
5. WHEN analyzing implementations, THE System SHALL identify the GreenWatch system components (sensors, greenhouses, alerts, readings)
6. WHEN analyzing implementations, THE System SHALL identify the e-commerce system components
7. WHEN analyzing implementations, THE System SHALL identify the plugin architecture components

### Requirement 2: Chapter Structure Reorganization

**User Story:** As a reader, I want the book organized in a logical pedagogical flow, so that I can learn MVVM concepts from beginner to advanced.

#### Acceptance Criteria

1. THE Book SHALL organize chapters into clear sections that progress from fundamentals to advanced topics
2. THE Book SHALL include a "Foundations" section covering MVVM fundamentals and architectural problems
3. THE Book SHALL include a "Core Patterns" section covering Models, ViewModels, and reactive state management
4. THE Book SHALL include a "Framework Implementations" section covering React, Vue, Angular, Lit, and Vanilla JS
5. THE Book SHALL include an "Advanced Topics" section covering DDD, testing, plugin architecture, and performance
6. THE Book SHALL include a "Real-World Applications" section with complete case studies
7. WHEN a chapter title doesn't match its content, THE System SHALL rename the chapter appropriately
8. WHEN chapters are reordered, THE System SHALL update chapter numbering sequentially
9. THE Book SHALL maintain consistent section metadata in chapter frontmatter

### Requirement 2.1: Framework-Agnostic Teaching Approach

**User Story:** As a reader, I want to learn MVVM patterns in general terms, so that I can apply them using any library or framework.

#### Acceptance Criteria

1. WHEN introducing a pattern, THE Book SHALL explain the general concept and principles before showing specific implementations
2. WHEN presenting a library, THE Book SHALL position it as an example implementation of a pattern, not as a prescriptive solution
3. THE Book SHALL show multiple ways to implement the same pattern where applicable (using different libraries or approaches)
4. THE Book SHALL emphasize that patterns are transferable and can be implemented without specific libraries
5. THE Book SHALL include a "Framework-Agnostic Patterns" section covering reactive state, events, data fetching, UI behaviors, and design systems
6. WHEN covering framework-agnostic patterns, THE Book SHALL use Web Loom libraries (signals-core, store-core, event-bus-core, query-core, ui-core, ui-patterns, design-core) as concrete examples
7. THE Book SHALL explain why each pattern matters for MVVM architecture before showing how to implement it

### Requirement 3: Real Code Integration

**User Story:** As a reader, I want all code examples to come from actual working implementations, so that I can trust the examples are production-ready and accurate.

#### Acceptance Criteria

1. WHEN presenting a code example, THE Book SHALL extract it from actual files in the Web_Loom monorepo
2. WHEN presenting a ViewModel example, THE Book SHALL use code from `packages/view-models/` or `packages/mvvm-core/`
3. WHEN presenting a Model example, THE Book SHALL use code from `packages/mvvm-core/src/models/`
4. WHEN presenting a View example, THE Book SHALL use code from the appropriate `apps/mvvm-*` directory
5. WHEN presenting framework-specific code, THE Book SHALL show implementations from at least two different frameworks for comparison
6. THE Book SHALL include file paths and line references for all code examples
7. THE Book SHALL NOT include hypothetical or made-up code examples
8. WHEN code examples are extracted, THE System SHALL preserve actual implementation details including error handling, validation, and edge cases

### Requirement 4: GreenWatch Case Study Integration

**User Story:** As a reader, I want to follow a consistent real-world example throughout the book, so that I can see how concepts build on each other.

#### Acceptance Criteria

1. THE Book SHALL use the GreenWatch greenhouse monitoring system as the primary case study
2. WHEN introducing MVVM concepts, THE Book SHALL demonstrate them using GreenWatch components
3. THE Book SHALL cover the GreenHouseViewModel implementation and usage
4. THE Book SHALL cover the SensorViewModel implementation and usage
5. THE Book SHALL cover the SensorReadingViewModel implementation and usage
6. THE Book SHALL cover the ThresholdAlertViewModel implementation and usage
7. THE Book SHALL show how the same ViewModels are used across React, Vue, Angular, Lit, and Vanilla JS implementations
8. THE Book SHALL explain the domain model of greenhouse monitoring (sensors, readings, thresholds, alerts)

### Requirement 5: Framework Implementation Coverage

**User Story:** As a developer working with a specific framework, I want to see how MVVM applies to my framework, so that I can implement it in my projects.

#### Acceptance Criteria

1. THE Book SHALL include dedicated chapters for React implementation
2. THE Book SHALL include dedicated chapters for Vue implementation
3. THE Book SHALL include dedicated chapters for Angular implementation
4. THE Book SHALL include dedicated chapters for Lit web components implementation
5. THE Book SHALL include dedicated chapters for Vanilla JavaScript implementation
6. WHEN presenting framework implementations, THE Book SHALL show the same ViewModel used across different frameworks
7. WHEN presenting framework implementations, THE Book SHALL highlight framework-specific patterns (hooks for React, Composition API for Vue, dependency injection for Angular)
8. THE Book SHALL demonstrate framework independence by showing identical business logic with different view layers

### Requirement 6: Framework-Agnostic Patterns Coverage

**User Story:** As a developer, I want to understand framework-agnostic patterns that support MVVM, so that I can implement these patterns using any library or build my own solutions.

#### Acceptance Criteria

1. THE Book SHALL teach patterns and principles in general terms before showing specific implementations
2. THE Book SHALL use Web Loom libraries as concrete examples of pattern implementations, not as prescriptive solutions
3. THE Book SHALL cover reactive state management patterns (signals, observables, stores)
4. THE Book SHALL demonstrate the signals pattern using signals-core as an example
5. THE Book SHALL demonstrate the observable store pattern using store-core as an example
6. THE Book SHALL cover event-driven communication patterns using event-bus-core as an example
7. THE Book SHALL cover data fetching and caching patterns using query-core as an example
8. THE Book SHALL cover headless UI behavior patterns using ui-core as an example
9. THE Book SHALL cover composed UI patterns using ui-patterns as an example
10. THE Book SHALL cover design token and theming patterns using design-core as an example
11. WHEN presenting a pattern, THE Book SHALL explain the general concept before showing specific library implementations
12. WHEN presenting a pattern, THE Book SHALL show multiple implementation approaches where applicable (Web Loom libraries, RxJS, native APIs, other libraries)
13. THE Book SHALL emphasize that patterns are transferable and can be implemented without specific libraries

### Requirement 7: Advanced Topics Coverage

**User Story:** As an experienced developer, I want to learn advanced MVVM patterns and practices, so that I can build enterprise-grade applications.

#### Acceptance Criteria

1. THE Book SHALL include coverage of Domain-Driven Design principles applied to frontend
2. THE Book SHALL include coverage of testing strategies for ViewModels and Models
3. THE Book SHALL include coverage of the plugin architecture system
4. THE Book SHALL include coverage of performance optimization techniques
5. THE Book SHALL include coverage of state synchronization across components
6. THE Book SHALL include coverage of error handling patterns
7. THE Book SHALL include coverage of validation strategies using Zod
8. WHEN presenting advanced topics, THE Book SHALL use real implementations from the monorepo

### Requirement 8: E-Commerce Case Study

**User Story:** As a reader, I want to see MVVM applied to a different domain, so that I can understand how to adapt the patterns to my own projects.

#### Acceptance Criteria

1. THE Book SHALL include the e-commerce application as a secondary case study
2. THE Book SHALL demonstrate how MVVM applies to e-commerce concerns (products, cart, checkout)
3. WHEN presenting e-commerce examples, THE Book SHALL use actual code from `apps/ecommerce-mvvm/`
4. THE Book SHALL contrast e-commerce patterns with GreenWatch patterns to show domain flexibility

### Requirement 9: Plugin Architecture Coverage

**User Story:** As a developer building extensible applications, I want to understand the plugin architecture system, so that I can create runtime-extensible applications.

#### Acceptance Criteria

1. THE Book SHALL include coverage of the plugin-core library
2. THE Book SHALL explain the PluginRegistry and lifecycle management
3. THE Book SHALL explain the FrameworkAdapter abstraction
4. THE Book SHALL explain the PluginManifest and validation
5. THE Book SHALL explain the PluginSDK for host-plugin communication
6. WHEN presenting plugin architecture, THE Book SHALL use real examples from `apps/plugin-react/`

### Requirement 10: Testing and Quality Assurance

**User Story:** As a developer, I want to understand how to test MVVM applications, so that I can ensure code quality and correctness.

#### Acceptance Criteria

1. THE Book SHALL include coverage of unit testing ViewModels
2. THE Book SHALL include coverage of testing Models with Zod validation
3. THE Book SHALL include coverage of integration testing across layers
4. THE Book SHALL demonstrate testing with Vitest
5. WHEN presenting testing examples, THE Book SHALL use actual test files from the monorepo
6. THE Book SHALL explain the testing benefits of MVVM separation of concerns

### Requirement 11: Chapter Metadata and Navigation

**User Story:** As a reader, I want consistent chapter metadata and navigation, so that I can easily find and reference content.

#### Acceptance Criteria

1. WHEN a chapter is created or updated, THE System SHALL include frontmatter with id, title, and section
2. THE Book SHALL maintain consistent chapter numbering (chapter1.mdx through chapter21.mdx)
3. THE Book SHALL include a table of contents mapping chapters to sections
4. THE Book SHALL include cross-references between related chapters
5. WHEN referencing code, THE Book SHALL include file paths relative to the monorepo root

### Requirement 12: Pedagogical Quality

**User Story:** As a reader, I want clear explanations that build on previous concepts, so that I can learn effectively.

#### Acceptance Criteria

1. WHEN introducing a new concept, THE Book SHALL explain why it matters before showing how it works
2. WHEN presenting code examples, THE Book SHALL include explanatory text before and after the code
3. THE Book SHALL progress from simple examples to complex examples within each chapter
4. THE Book SHALL reference previous chapters when building on earlier concepts
5. THE Book SHALL include "Key Takeaways" or summary sections at the end of major chapters
6. THE Book SHALL avoid assuming knowledge not yet introduced in earlier chapters

### Requirement 13: Technical Accuracy

**User Story:** As a reader, I want technically accurate content, so that I can trust the information and apply it successfully.

#### Acceptance Criteria

1. WHEN presenting RxJS usage, THE Book SHALL accurately reflect the observable patterns used in the monorepo
2. WHEN presenting TypeScript types, THE Book SHALL use actual type definitions from the codebase
3. WHEN explaining framework-specific patterns, THE Book SHALL accurately represent framework APIs and conventions
4. WHEN discussing architectural tradeoffs, THE Book SHALL present balanced perspectives
5. THE Book SHALL NOT include outdated or deprecated patterns
6. WHEN code examples are extracted, THE System SHALL verify they compile and run correctly

### Requirement 14: Rewrite Execution Strategy

**User Story:** As a technical writer, I want a systematic approach to rewriting chapters, so that I can ensure consistency and completeness.

#### Acceptance Criteria

1. THE System SHALL provide a chapter-by-chapter rewrite plan
2. WHEN rewriting a chapter, THE System SHALL identify which real implementations to reference
3. WHEN rewriting a chapter, THE System SHALL identify which code examples to extract
4. WHEN rewriting a chapter, THE System SHALL maintain the chapter's core learning objectives
5. THE System SHALL track which chapters have been rewritten and which remain
6. THE System SHALL ensure rewritten chapters maintain consistent voice and style
7. WHEN all chapters are rewritten, THE System SHALL verify the complete pedagogical flow

### Requirement 15: Code Example Formatting

**User Story:** As a reader, I want consistently formatted code examples, so that I can easily read and understand them.

#### Acceptance Criteria

1. WHEN presenting code examples, THE Book SHALL use MDX code blocks with appropriate language tags
2. WHEN presenting TypeScript code, THE Book SHALL include type annotations
3. WHEN presenting code examples, THE Book SHALL include comments explaining key concepts
4. WHEN presenting file paths, THE Book SHALL use monospace formatting
5. THE Book SHALL limit code example length to maintain readability (prefer focused excerpts over complete files)
6. WHEN code examples are long, THE Book SHALL highlight the most relevant sections
