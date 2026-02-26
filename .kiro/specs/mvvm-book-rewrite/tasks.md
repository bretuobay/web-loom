# Implementation Plan: MVVM Book Rewrite

## Overview

This implementation plan outlines the systematic approach to rewriting all 23 chapters of the MVVM technical book. The rewrite transforms the book from using hypothetical examples to being grounded in real, working implementations from the Web Loom monorepo. The approach emphasizes teaching patterns in general terms while using Web Loom libraries as concrete examples.

## Tasks

- [ ] 1. Analysis and Inventory Phase
  - [ ] 1.1 Parse existing chapter structure
    - Read all 21 MDX files from `apps/docs/content/book/chapters/`
    - Extract frontmatter (id, title, section) from each chapter
    - Build chapter inventory JSON with current structure
    - _Requirements: 1.1_
  
  - [ ] 1.2 Catalog monorepo ViewModels
    - Scan `packages/view-models/` for all ViewModel TypeScript files
    - Extract ViewModel names, purposes, and exports
    - Document which frameworks use each ViewModel
    - _Requirements: 1.2_
  
  - [ ] 1.3 Catalog framework implementations
    - Scan `apps/mvvm-*` directories for all framework implementations
    - Document components and their ViewModel usage
    - Map ViewModels to framework-specific components
    - _Requirements: 1.3_
  
  - [ ] 1.4 Catalog framework-agnostic libraries
    - Scan `packages/signals-core`, `packages/store-core`, `packages/event-bus-core`, `packages/query-core`, `packages/ui-core`, `packages/ui-patterns`, `packages/design-core`
    - Extract library purposes, key exports, and patterns demonstrated
    - Document how each library supports MVVM architecture
    - _Requirements: 1.4, 2.1.6_
  
  - [ ] 1.5 Identify domain entities
    - Parse TypeScript files to extract class, interface, and type definitions
    - Identify GreenWatch entities (Greenhouse, Sensor, SensorReading, ThresholdAlert)
    - Identify e-commerce entities
    - Identify plugin architecture entities
    - _Requirements: 1.5, 1.6, 1.7_
  
  - [ ] 1.6 Generate inventory outputs
    - Create `chapter-inventory.json` with current chapter structure
    - Create `monorepo-inventory.json` with available implementations
    - Create `domain-entities.json` with identified domain models
    - Create `framework-agnostic-libraries.json` with library patterns
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 2. Chapter Reorganization Phase
  - [ ] 2.1 Define new chapter structure
    - Create six-section structure (Foundations, Core Patterns, Framework Implementations, Framework-Agnostic Patterns, Advanced Topics, Real-World Applications)
    - Map existing 21 chapters to new sections
    - Identify 2 new chapters needed for framework-agnostic patterns (total 23 chapters)
    - Document learning objectives for each chapter
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [ ] 2.2 Create chapter mapping
    - For each existing chapter, determine its new section
    - Assign new chapter numbers (1-23)
    - Identify chapters that need renaming
    - Document prerequisite relationships between chapters
    - _Requirements: 2.7, 2.8_
  
  - [ ] 2.3 Update chapter metadata
    - Update frontmatter in all chapter files with new section names
    - Ensure chapter numbering is sequential (1-23)
    - Validate metadata consistency across all chapters
    - _Requirements: 2.8, 2.9, 11.1_
  
  - [ ] 2.4 Generate chapter mapping output
    - Create `chapter-mapping.json` documenting old structure → new structure
    - Include renaming decisions and rationale
    - _Requirements: 2.1, 2.7, 2.8_

- [ ] 3. Rewrite Plan Generation Phase
  - [ ] 3.1 Generate rewrite plans for Foundations section (Chapters 1-3)
    - Define learning objectives for each chapter
    - Identify core concepts to teach
    - Specify real implementations to reference
    - Identify code examples to extract with file paths
    - Document dependencies on previous chapters
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [ ] 3.2 Generate rewrite plans for Core Patterns section (Chapters 4-7)
    - Define learning objectives focusing on Models, ViewModels, reactive state
    - Identify GreenWatch components to use as examples
    - Specify code examples from `packages/mvvm-core/` and `packages/view-models/`
    - _Requirements: 14.1, 14.2, 14.3, 4.1, 4.2_
  
  - [ ] 3.3 Generate rewrite plans for Framework Implementations section (Chapters 8-12)
    - Define learning objectives for each framework (React, Vue, Angular, Lit, Vanilla JS)
    - Identify same ViewModels used across frameworks for comparison
    - Specify code examples from `apps/mvvm-*` directories
    - Ensure framework-specific patterns are highlighted
    - _Requirements: 14.1, 14.2, 14.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ] 3.4 Generate rewrite plans for Framework-Agnostic Patterns section (Chapters 13-17)
    - Define learning objectives for reactive state, events, data fetching, UI behaviors, design systems
    - Identify patterns to teach in general terms
    - Specify Web Loom libraries as example implementations (signals-core, store-core, event-bus-core, query-core, ui-core, ui-patterns, design-core)
    - Identify alternative implementation approaches (RxJS, native APIs, other libraries)
    - _Requirements: 14.1, 14.2, 14.3, 2.1.1, 2.1.2, 2.1.3, 2.1.5, 2.1.6_
  
  - [ ] 3.5 Generate rewrite plans for Advanced Topics section (Chapters 18-21)
    - Define learning objectives for DDD, testing, plugin architecture, design systems
    - Identify advanced patterns and real implementations
    - Specify code examples from relevant packages
    - _Requirements: 14.1, 14.2, 14.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ] 3.6 Generate rewrite plans for Real-World Applications section (Chapters 22-23)
    - Define learning objectives for complete case studies
    - Identify GreenWatch and e-commerce examples to showcase
    - Specify comprehensive code examples demonstrating full MVVM implementations
    - _Requirements: 14.1, 14.2, 14.3, 8.1, 8.2, 8.3_
  
  - [ ] 3.7 Validate all rewrite plans
    - Verify all referenced files exist in the monorepo
    - Verify ViewModels are used in multiple frameworks
    - Verify prerequisite chapters are covered before dependent chapters
    - Verify framework-agnostic patterns are taught before specific implementations
    - _Requirements: 14.2, 14.3, 2.1.1_
  
  - [ ] 3.8 Generate rewrite plan output
    - Create `chapter-rewrite-plans.json` with complete plans for all 23 chapters
    - Include status tracking fields (not_started, in_progress, completed, reviewed)
    - _Requirements: 14.1, 14.5_

- [ ] 4. Checkpoint - Review rewrite plans
  - Ensure all rewrite plans are complete and validated
  - Verify framework-agnostic approach is properly reflected
  - Ask the user if questions arise

- [ ] 5. Chapter Rewriting - Foundations Section (Chapters 1-3)
  - [ ] 5.1 Rewrite Chapter 1: The Frontend Architecture Crisis
    - Extract and update existing content
    - Ensure real code examples from monorepo
    - Add cross-references to later chapters
    - _Requirements: 3.1, 3.8, 12.1, 12.2, 12.4_
  
  - [ ] 5.2 Rewrite Chapter 2: Why MVVM Matters for Modern Frontend
    - Extract and update existing content
    - Use GreenWatch examples to demonstrate problems MVVM solves
    - _Requirements: 3.1, 3.8, 4.1, 4.2_
  
  - [ ] 5.3 Rewrite Chapter 3: MVVM Pattern Fundamentals
    - Explain Model, View, ViewModel layers in general terms
    - Use GreenWatch domain model as concrete example
    - Extract code from `packages/mvvm-core/`
    - _Requirements: 3.1, 3.2, 3.8, 4.3, 4.4, 4.5, 4.6_

- [ ] 6. Chapter Rewriting - Core Patterns Section (Chapters 4-7)
  - [ ] 6.1 Rewrite Chapter 4: Building Framework-Agnostic Models
    - Explain Model layer responsibilities
    - Extract code examples from `packages/mvvm-core/src/models/`
    - Show GreenWatch Model implementations (Sensor, SensorReading, etc.)
    - _Requirements: 3.1, 3.3, 3.8, 4.8_
  
  - [ ] 6.2 Rewrite Chapter 5: ViewModels and Reactive State
    - Explain ViewModel layer responsibilities
    - Extract code examples from `packages/view-models/`
    - Show GreenHouseViewModel, SensorViewModel implementations
    - Introduce reactive state concepts (prepare for Chapter 13)
    - _Requirements: 3.1, 3.2, 3.8, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 6.3 Rewrite Chapter 6: The View Layer Contract
    - Explain View layer responsibilities
    - Show how Views consume ViewModels
    - Extract examples from multiple frameworks for comparison
    - _Requirements: 3.1, 3.4, 3.5, 4.7, 5.8_
  
  - [ ] 6.4 Rewrite Chapter 7: Dependency Injection and Lifecycle Management
    - Explain DI patterns for ViewModels
    - Extract code from `packages/mvvm-core/src/core/di-container.ts`
    - Show lifecycle management across frameworks
    - _Requirements: 3.1, 3.8_

- [ ] 7. Chapter Rewriting - Framework Implementations Section (Chapters 8-12)
  - [ ] 7.1 Rewrite Chapter 8: React Implementation with Hooks
    - Show GreenWatch implementation in React
    - Extract code from `apps/mvvm-react/`
    - Demonstrate hooks pattern for ViewModel consumption
    - Show same ViewModels used in other frameworks (forward reference)
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.1, 5.6, 5.7_
  
  - [ ] 7.2 Rewrite Chapter 9: Vue Implementation with Composition API
    - Show GreenWatch implementation in Vue
    - Extract code from `apps/mvvm-vue/`
    - Demonstrate Composition API pattern for ViewModel consumption
    - Compare with React implementation from Chapter 8
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.2, 5.6, 5.7_
  
  - [ ] 7.3 Rewrite Chapter 10: Angular Implementation with DI
    - Show GreenWatch implementation in Angular
    - Extract code from `apps/mvvm-angular/`
    - Demonstrate dependency injection pattern
    - Compare with React and Vue implementations
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.3, 5.6, 5.7_
  
  - [ ] 7.4 Rewrite Chapter 11: Lit Web Components Implementation
    - Show GreenWatch implementation in Lit
    - Extract code from `apps/mvvm-lit/`
    - Demonstrate web components pattern
    - Compare with previous framework implementations
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.4, 5.6, 5.7_
  
  - [ ] 7.5 Rewrite Chapter 12: Vanilla JavaScript Implementation
    - Show GreenWatch implementation in Vanilla JS
    - Extract code from `apps/mvvm-vanilla/`
    - Demonstrate framework-free MVVM
    - Emphasize framework independence
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.5, 5.6, 5.8_

- [ ] 8. Checkpoint - Review framework implementations
  - Ensure all framework chapters demonstrate same ViewModels
  - Verify framework-specific patterns are highlighted
  - Verify framework independence is demonstrated
  - Ask the user if questions arise

- [ ] 9. Chapter Rewriting - Framework-Agnostic Patterns Section (Chapters 13-17)
  - [ ] 9.1 Rewrite Chapter 13: Reactive State Management Patterns
    - Explain reactive state patterns in general terms (signals, observables, stores)
    - Show signals pattern using signals-core as example
    - Show observable store pattern using store-core as example
    - Show alternative approaches (RxJS, native Proxy)
    - Explain when to use each approach
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 3.1, 3.8_
  
  - [ ] 9.2 Rewrite Chapter 14: Event-Driven Communication
    - Explain event-driven architecture patterns in general terms
    - Show pub/sub pattern using event-bus-core as example
    - Show alternative approaches (native EventTarget, other event libraries)
    - Explain cross-component communication strategies
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 3.1, 3.8_
  
  - [ ] 9.3 Rewrite Chapter 15: Data Fetching and Caching Strategies
    - Explain data fetching patterns in general terms (async state, caching, invalidation)
    - Show data fetching pattern using query-core as example
    - Show alternative approaches (React Query, SWR, native fetch with caching)
    - Explain when to use each approach
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 3.1, 3.8_
  
  - [ ] 9.4 Rewrite Chapter 16: Headless UI Behaviors
    - Explain headless UI pattern in general terms (separation of behavior from presentation)
    - Show atomic behaviors using ui-core as example (Dialog, Form, List Selection, Roving Focus, Disclosure)
    - Show how behaviors compose into larger patterns
    - Explain framework-agnostic UI logic
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 3.1, 3.8_
  
  - [ ] 9.5 Rewrite Chapter 17: Composed UI Patterns
    - Explain composed UI patterns in general terms (Master-Detail, Wizard, Modal, Command Palette, etc.)
    - Show pattern composition using ui-patterns as example
    - Show how atomic behaviors combine into complete patterns
    - Explain event-driven pattern communication
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 3.1, 3.8_

- [ ] 10. Chapter Rewriting - Advanced Topics Section (Chapters 18-21)
  - [ ] 10.1 Rewrite Chapter 18: Domain-Driven Design for Frontend
    - Explain DDD principles applied to frontend
    - Use GreenWatch domain model as example
    - Show bounded contexts, aggregates, domain events
    - Extract code from actual domain implementations
    - _Requirements: 3.1, 3.8, 7.1, 7.8_
  
  - [ ] 10.2 Rewrite Chapter 19: Testing MVVM Applications
    - Explain testing strategies for Models, ViewModels, Views
    - Extract test examples from monorepo test files
    - Show unit testing ViewModels in isolation
    - Show integration testing across layers
    - Demonstrate testing with Vitest
    - _Requirements: 3.1, 3.8, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [ ] 10.3 Rewrite Chapter 20: Plugin Architecture and Extensibility
    - Explain plugin architecture patterns
    - Extract code from `packages/plugin-core/` and `apps/plugin-react/`
    - Show PluginRegistry, FrameworkAdapter, PluginManifest, PluginSDK
    - Demonstrate runtime extensibility
    - _Requirements: 3.1, 3.8, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ] 10.4 Rewrite Chapter 21: Design Systems and Theming
    - Explain design token and theming patterns in general terms
    - Show design token system using design-core as example
    - Demonstrate CSS custom properties generation
    - Show dynamic theming with light/dark mode
    - Explain framework-agnostic design systems
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 3.1, 3.8_

- [ ] 11. Chapter Rewriting - Real-World Applications Section (Chapters 22-23)
  - [ ] 11.1 Rewrite Chapter 22: Complete Case Studies
    - Present complete GreenWatch implementation across all frameworks
    - Present e-commerce application as secondary case study
    - Show how all patterns come together
    - Extract comprehensive code examples
    - Contrast different domain patterns
    - _Requirements: 3.1, 3.8, 4.1, 4.7, 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 11.2 Rewrite Chapter 23: Conclusion and Best Practices
    - Summarize key MVVM patterns and principles
    - Provide guidance on when to use MVVM
    - Discuss tradeoffs and architectural decisions
    - Provide best practices for MVVM applications
    - Reference all previous chapters
    - _Requirements: 12.4, 12.5_

- [ ] 12. Checkpoint - Review all rewritten chapters
  - Ensure all 23 chapters are rewritten
  - Verify pedagogical flow from beginner to advanced
  - Verify framework-agnostic approach is consistent
  - Ask the user if questions arise

- [ ] 13. Cross-Cutting Concerns Phase
  - [ ] 13.1 Add cross-references between chapters
    - Identify concepts that span multiple chapters
    - Add markdown links between related chapters
    - Ensure prerequisite chapters are referenced
    - Verify forward references are appropriate
    - _Requirements: 11.4, 12.4_
  
  - [ ] 13.2 Create table of contents
    - Generate TOC mapping chapters to sections
    - Include chapter titles and descriptions
    - Add navigation links
    - _Requirements: 11.3_
  
  - [ ] 13.3 Verify code example formatting
    - Ensure all code examples use MDX code blocks with language tags
    - Verify TypeScript code includes type annotations
    - Verify code examples include comments
    - Verify file paths use monospace formatting
    - Verify code example length limits
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [ ] 13.4 Verify technical accuracy
    - Verify RxJS patterns match monorepo usage
    - Verify TypeScript types match actual definitions
    - Verify framework APIs are accurately represented
    - Run TypeScript compiler on extracted code examples
    - _Requirements: 13.1, 13.2, 13.6_

- [ ] 14. Final Validation Phase
  - [ ] 14.1 Run validation checks
    - Verify all 23 chapters exist with correct numbering
    - Verify all chapter metadata is complete and consistent
    - Verify all code examples reference real files
    - Verify all code examples have required metadata
    - Verify chapter numbering is sequential (1-23)
    - Verify sections follow defined order
    - _Requirements: 2.8, 3.1, 3.6, 11.1, 11.2_
  
  - [ ] 14.2 Generate validation report
    - Document all validation results
    - Identify any remaining issues
    - Provide recommendations for fixes
    - _Requirements: 14.7_
  
  - [ ] 14.3 Manual review checklist
    - Verify pedagogical flow (beginner → advanced)
    - Verify consistent voice and style
    - Verify all learning objectives are met
    - Verify GreenWatch is used as primary case study throughout
    - Verify framework-agnostic patterns are taught before specific implementations
    - Verify patterns are emphasized over specific libraries
    - _Requirements: 12.3, 12.6, 2.1.1, 2.1.4_

- [ ] 15. Final Checkpoint - Complete rewrite
  - Ensure all validation checks pass
  - Ensure manual review is complete
  - Confirm book is ready for publication
  - Ask the user if questions arise

## Notes

- The rewrite follows a systematic chapter-by-chapter approach
- Each chapter builds on previous chapters (prerequisites documented in rewrite plans)
- Framework-agnostic patterns are taught in general terms with Web Loom libraries as examples
- All code examples are extracted from real monorepo implementations
- Checkpoints ensure incremental validation and user feedback
- The book progresses from 21 to 23 chapters to accommodate framework-agnostic patterns section
- Emphasis on patterns over specific libraries ensures transferable knowledge
