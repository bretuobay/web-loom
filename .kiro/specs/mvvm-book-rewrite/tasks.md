# Implementation Plan: MVVM Book Rewrite

## Overview

This implementation plan outlines the systematic approach to rewriting all 23 chapters of the MVVM technical book. The rewrite transforms the book from using hypothetical examples to being grounded in real, working implementations from the Web Loom monorepo. 

The core principle is **authenticity through real code**: every example, pattern, and technique presented in the book will be extracted from actual working implementations in the monorepo, ensuring readers learn from production-ready code rather than theoretical examples.

The book takes a **principles-first, library-agnostic** approach: teaching MVVM patterns and principles in general terms, then using Web Loom libraries (signals-core, store-core, event-bus-core, query-core, ui-core, ui-patterns, design-core) as concrete examples of how to implement these patterns, rather than prescribing specific libraries.

## Tasks

- [x] 1. Analysis and Inventory Phase
  - [x] 1.1 Parse existing chapter structure
    - Read all 21 MDX files from `apps/docs/content/book/chapters/`
    - Extract frontmatter (id, title, section) from each chapter
    - Build chapter inventory JSON with current structure
    - _Requirements: 1.1_
  
  - [x] 1.2 Catalog monorepo ViewModels
    - Scan `packages/view-models/` for all ViewModel TypeScript files
    - Extract ViewModel names, purposes, and exports
    - Document which frameworks use each ViewModel
    - _Requirements: 1.2_
  
  - [x] 1.3 Catalog framework implementations
    - Scan `apps/mvvm-*` directories for all framework implementations
    - Document components and their ViewModel usage
    - Map ViewModels to framework-specific components
    - _Requirements: 1.3_
  
  - [x] 1.4 Catalog framework-agnostic libraries
    - Scan `packages/signals-core`, `packages/store-core`, `packages/event-bus-core`, `packages/query-core`, `packages/ui-core`, `packages/ui-patterns`, `packages/design-core`
    - Extract library purposes, key exports, and patterns demonstrated
    - Document how each library supports MVVM architecture
    - Document the general pattern each library implements (e.g., signals-core implements the signals pattern)
    - Identify alternative implementations of the same patterns (RxJS, native APIs, other libraries)
    - _Requirements: 1.4, 2.1.6, 6.3, 6.4, 6.6, 6.12_
  
  - [x] 1.5 Identify domain entities
    - Parse TypeScript files to extract class, interface, and type definitions
    - Identify GreenWatch entities (Greenhouse, Sensor, SensorReading, ThresholdAlert)
    - Identify e-commerce entities
    - Identify plugin architecture entities
    - _Requirements: 1.5, 1.6, 1.7_
  
  - [x] 1.6 Generate inventory outputs
    - Create `chapter-inventory.json` with current chapter structure
    - Create `monorepo-inventory.json` with available implementations
    - Create `domain-entities.json` with identified domain models
    - Create `framework-agnostic-libraries.json` with library patterns
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Chapter Reorganization Phase
  - [x] 2.1 Define new chapter structure
    - Create six-section structure (Foundations, Core Patterns, Framework Implementations, Framework-Agnostic Patterns, Advanced Topics, Real-World Applications)
    - Map existing 21 chapters to new sections
    - Identify 2 new chapters needed for framework-agnostic patterns (total 23 chapters)
    - Document learning objectives for each chapter
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 2.2 Create chapter mapping
    - For each existing chapter, determine its new section
    - Assign new chapter numbers (1-23)
    - Identify chapters that need renaming
    - Document prerequisite relationships between chapters
    - _Requirements: 2.7, 2.8_
  
  - [x] 2.3 Update chapter metadata
    - Update frontmatter in all chapter files with new section names
    - Ensure chapter numbering is sequential (1-23)
    - Validate metadata consistency across all chapters
    - _Requirements: 2.8, 2.9, 11.1_
  
  - [x] 2.4 Generate chapter mapping output
    - Create `chapter-mapping.json` documenting old structure → new structure
    - Include renaming decisions and rationale
    - _Requirements: 2.1, 2.7, 2.8_

- [x] 3. Rewrite Plan Generation Phase
  - [x] 3.1 Generate rewrite plans for Foundations section (Chapters 1-3)
    - Define learning objectives for each chapter
    - Identify core concepts to teach
    - Specify real implementations to reference
    - Identify code examples to extract with file paths
    - Document dependencies on previous chapters
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [x] 3.2 Generate rewrite plans for Core Patterns section (Chapters 4-7)
    - Define learning objectives focusing on Models, ViewModels, reactive state
    - Identify GreenWatch components to use as examples
    - Specify code examples from `packages/mvvm-core/` and `packages/view-models/`
    - _Requirements: 14.1, 14.2, 14.3, 4.1, 4.2_
  
  - [x] 3.3 Generate rewrite plans for Framework Implementations section (Chapters 8-12)
    - Define learning objectives for each framework (React, Vue, Angular, Lit, Vanilla JS)
    - Identify same ViewModels used across frameworks for comparison
    - Specify code examples from `apps/mvvm-*` directories
    - Ensure framework-specific patterns are highlighted
    - _Requirements: 14.1, 14.2, 14.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 3.4 Generate rewrite plans for Framework-Agnostic Patterns section (Chapters 13-17)
    - Define learning objectives for reactive state, events, data fetching, UI behaviors, design systems
    - Identify patterns to teach in general terms (explain "why" and "what" before "how")
    - Specify Web Loom libraries as example implementations (signals-core, store-core, event-bus-core, query-core, ui-core, ui-patterns, design-core)
    - Identify alternative implementation approaches (RxJS, native APIs, other libraries) for each pattern
    - Structure chapters to teach pattern first, then show multiple implementation approaches
    - Ensure emphasis on transferable knowledge (patterns can be implemented without specific libraries)
    - _Requirements: 14.1, 14.2, 14.3, 2.1.1, 2.1.2, 2.1.3, 2.1.4, 2.1.5, 2.1.6, 2.1.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13_
  
  - [x] 3.5 Generate rewrite plans for Advanced Topics section (Chapters 18-21)
    - Define learning objectives for DDD, testing, plugin architecture, design systems
    - Identify advanced patterns and real implementations
    - Specify code examples from relevant packages
    - _Requirements: 14.1, 14.2, 14.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [x] 3.6 Generate rewrite plans for Real-World Applications section (Chapters 22-23)
    - Define learning objectives for complete case studies
    - Identify GreenWatch and e-commerce examples to showcase
    - Specify comprehensive code examples demonstrating full MVVM implementations
    - _Requirements: 14.1, 14.2, 14.3, 8.1, 8.2, 8.3_
  
  - [x] 3.7 Validate all rewrite plans
    - Verify all referenced files exist in the monorepo
    - Verify ViewModels are used in multiple frameworks
    - Verify prerequisite chapters are covered before dependent chapters
    - Verify framework-agnostic patterns are taught before specific implementations
    - _Requirements: 14.2, 14.3, 2.1.1_
  
  - [x] 3.8 Generate rewrite plan output
    - Create `chapter-rewrite-plans.json` with complete plans for all 23 chapters
    - Include status tracking fields (not_started, in_progress, completed, reviewed)
    - _Requirements: 14.1, 14.5_

- [x] 4. Checkpoint - Review rewrite plans
  - Ensure all rewrite plans are complete and validated
  - Verify framework-agnostic approach is properly reflected
  - Ask the user if questions arise

- [x] 5. Chapter Rewriting - Foundations Section (Chapters 1-3)
  - [x] 5.1 Rewrite Chapter 1: The Frontend Architecture Crisis
    - Extract and update existing content
    - Ensure real code examples from monorepo
    - Add cross-references to later chapters
    - _Requirements: 3.1, 3.8, 12.1, 12.2, 12.4_
  
  - [x] 5.2 Rewrite Chapter 2: Why MVVM Matters for Modern Frontend
    - Extract and update existing content
    - Use GreenWatch examples to demonstrate problems MVVM solves
    - _Requirements: 3.1, 3.8, 4.1, 4.2_
  
  - [x] 5.3 Rewrite Chapter 3: MVVM Pattern Fundamentals
    - Explain Model, View, ViewModel layers in general terms
    - Use GreenWatch domain model as concrete example
    - Extract code from `packages/mvvm-core/`
    - _Requirements: 3.1, 3.2, 3.8, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Chapter Rewriting - Core Patterns Section (Chapters 4-7)
  - [x] 6.1 Rewrite Chapter 4: Building Framework-Agnostic Models
    - Explain Model layer responsibilities
    - Extract code examples from `packages/mvvm-core/src/models/`
    - Show GreenWatch Model implementations (Sensor, SensorReading, etc.)
    - _Requirements: 3.1, 3.3, 3.8, 4.8_
  
  - [x] 6.2 Rewrite Chapter 5: ViewModels and Reactive State
    - Explain ViewModel layer responsibilities
    - Extract code examples from `packages/view-models/`
    - Show GreenHouseViewModel, SensorViewModel implementations
    - Introduce reactive state concepts (prepare for Chapter 13)
    - _Requirements: 3.1, 3.2, 3.8, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 6.3 Rewrite Chapter 6: The View Layer Contract
    - Explain View layer responsibilities
    - Show how Views consume ViewModels
    - Extract examples from multiple frameworks for comparison
    - _Requirements: 3.1, 3.4, 3.5, 4.7, 5.8_
  
  - [x] 6.4 Rewrite Chapter 7: Dependency Injection and Lifecycle Management
    - Explain DI patterns for ViewModels
    - Extract code from `packages/mvvm-core/src/core/di-container.ts`
    - Show lifecycle management across frameworks
    - _Requirements: 3.1, 3.8_

- [x] 7. Chapter Rewriting - Framework Implementations Section (Chapters 8-12)
  - [x] 7.1 Rewrite Chapter 8: React Implementation with Hooks
    - Show GreenWatch implementation in React
    - Extract code from `apps/mvvm-react/`
    - Demonstrate hooks pattern for ViewModel consumption
    - Show same ViewModels used in other frameworks (forward reference)
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.1, 5.6, 5.7_
  
  - [x] 7.2 Rewrite Chapter 9: Vue Implementation with Composition API
    - Show GreenWatch implementation in Vue
    - Extract code from `apps/mvvm-vue/`
    - Demonstrate Composition API pattern for ViewModel consumption
    - Compare with React implementation from Chapter 8
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.2, 5.6, 5.7_
  
  - [x] 7.3 Rewrite Chapter 10: Angular Implementation with DI
    - Show GreenWatch implementation in Angular
    - Extract code from `apps/mvvm-angular/`
    - Demonstrate dependency injection pattern
    - Compare with React and Vue implementations
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.3, 5.6, 5.7_
  
  - [x] 7.4 Rewrite Chapter 11: Lit Web Components Implementation
    - Show GreenWatch implementation in Lit
    - Extract code from `apps/mvvm-lit/`
    - Demonstrate web components pattern
    - Compare with previous framework implementations
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.4, 5.6, 5.7_
  
  - [x] 7.5 Rewrite Chapter 12: Vanilla JavaScript Implementation
    - Show GreenWatch implementation in Vanilla JS
    - Extract code from `apps/mvvm-vanilla/`
    - Demonstrate framework-free MVVM
    - Emphasize framework independence
    - _Requirements: 3.1, 3.4, 3.5, 3.8, 5.5, 5.6, 5.8_

- [x] 8. Checkpoint - Review framework implementations
  - Ensure all framework chapters demonstrate same ViewModels
  - Verify framework-specific patterns are highlighted
  - Verify framework independence is demonstrated
  - Ask the user if questions arise

- [x] 9. Chapter Rewriting - Framework-Agnostic Patterns Section (Chapters 13-17)
  - [x] 9.1 Rewrite Chapter 13: Reactive State Management Patterns
    - Explain reactive state patterns in general terms first (signals, observables, stores)
    - Explain why reactive state matters for MVVM architecture
    - Show signals pattern using signals-core as example implementation
    - Show observable store pattern using store-core as example implementation
    - Show alternative approaches (RxJS observables, native Proxy-based reactivity)
    - Provide guidance on when to use each approach
    - Emphasize that patterns are transferable and can be implemented without specific libraries
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.4, 2.1.6, 2.1.7, 3.1, 3.8, 6.3, 6.4, 6.5, 6.12_
  
  - [x] 9.2 Rewrite Chapter 14: Event-Driven Communication
    - Explain event-driven architecture patterns in general terms first
    - Explain why event-driven communication matters for MVVM
    - Show pub/sub pattern using event-bus-core as example implementation
    - Show alternative approaches (native EventTarget, other event libraries)
    - Explain cross-component communication strategies
    - Provide guidance on when to use each approach
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 2.1.7, 3.1, 3.8, 6.6, 6.11, 6.12_
  
  - [x] 9.3 Rewrite Chapter 15: Data Fetching and Caching Strategies
    - Explain data fetching patterns in general terms first (async state, caching, invalidation)
    - Explain why data fetching patterns matter for MVVM
    - Show data fetching pattern using query-core as example implementation
    - Show alternative approaches (React Query, SWR, native fetch with caching)
    - Provide guidance on when to use each approach
    - Emphasize framework-agnostic nature of data fetching patterns
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 2.1.7, 3.1, 3.8, 6.7, 6.11, 6.12_
  
  - [x] 9.4 Rewrite Chapter 16: Headless UI Behaviors
    - Explain headless UI pattern in general terms first (separation of behavior from presentation)
    - Explain why headless UI patterns matter for MVVM
    - Show atomic behaviors using ui-core as example (Dialog, Form, List Selection, Roving Focus, Disclosure)
    - Show how behaviors compose into larger patterns
    - Explain framework-agnostic UI logic benefits
    - Show alternative approaches where applicable
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 2.1.7, 3.1, 3.8, 6.8, 6.11, 6.12_
  
  - [x] 9.5 Rewrite Chapter 17: Composed UI Patterns
    - Explain composed UI patterns in general terms first (Master-Detail, Wizard, Modal, Command Palette, etc.)
    - Explain why composed patterns matter for MVVM
    - Show pattern composition using ui-patterns as example implementation
    - Show how atomic behaviors combine into complete patterns
    - Explain event-driven pattern communication
    - Demonstrate framework-agnostic pattern implementations
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 2.1.7, 3.1, 3.8, 6.9, 6.11, 6.12_

- [x] 10. Chapter Rewriting - Advanced Topics Section (Chapters 18-21)
  - [x] 10.1 Rewrite Chapter 18: Domain-Driven Design for Frontend
    - Explain DDD principles applied to frontend
    - Use GreenWatch domain model as example
    - Show bounded contexts, aggregates, domain events
    - Extract code from actual domain implementations
    - _Requirements: 3.1, 3.8, 7.1, 7.8_
  
  - [x] 10.2 Rewrite Chapter 19: Testing MVVM Applications
    - Explain testing strategies for Models, ViewModels, Views
    - Extract test examples from monorepo test files
    - Show unit testing ViewModels in isolation
    - Show integration testing across layers
    - Demonstrate testing with Vitest
    - _Requirements: 3.1, 3.8, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 10.3 Rewrite Chapter 20: Plugin Architecture and Extensibility
    - Explain plugin architecture patterns
    - Extract code from `packages/plugin-core/` and `apps/plugin-react/`
    - Show PluginRegistry, FrameworkAdapter, PluginManifest, PluginSDK
    - Demonstrate runtime extensibility
    - _Requirements: 3.1, 3.8, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 10.4 Rewrite Chapter 21: Design Systems and Theming
    - Explain design token and theming patterns in general terms first
    - Explain why design systems matter for MVVM applications
    - Show design token system using design-core as example implementation
    - Demonstrate CSS custom properties generation
    - Show dynamic theming with light/dark mode
    - Explain framework-agnostic design systems benefits
    - Show alternative approaches where applicable
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.6, 2.1.7, 3.1, 3.8, 6.10, 6.11, 6.12_

- [x] 11. Chapter Rewriting - Real-World Applications Section (Chapters 22-23)
  - [x] 11.1 Rewrite Chapter 22: Complete Case Studies
    - Present complete GreenWatch implementation across all frameworks
    - Present e-commerce application as secondary case study
    - Show how all patterns come together
    - Extract comprehensive code examples
    - Contrast different domain patterns
    - _Requirements: 3.1, 3.8, 4.1, 4.7, 8.1, 8.2, 8.3, 8.4_
  
  - [x] 11.2 Rewrite Chapter 23: Conclusion and Best Practices
    - Summarize key MVVM patterns and principles
    - Provide guidance on when to use MVVM
    - Discuss tradeoffs and architectural decisions
    - Provide best practices for MVVM applications
    - Reference all previous chapters
    - _Requirements: 12.4, 12.5_

- [~] 12. Checkpoint - Review all rewritten chapters
  - Ensure all 23 chapters are rewritten
  - Verify pedagogical flow from beginner to advanced
  - Verify framework-agnostic approach is consistent
  - Ask the user if questions arise

- [~] 13. Cross-Cutting Concerns Phase
  - [~] 13.1 Add cross-references between chapters
    - Identify concepts that span multiple chapters
    - Add markdown links between related chapters
    - Ensure prerequisite chapters are referenced
    - Verify forward references are appropriate
    - _Requirements: 11.4, 12.4_
  
  - [~] 13.2 Create table of contents
    - Generate TOC mapping chapters to sections
    - Include chapter titles and descriptions
    - Add navigation links
    - _Requirements: 11.3_
  
  - [~] 13.3 Verify code example formatting
    - Ensure all code examples use MDX code blocks with language tags
    - Verify TypeScript code includes type annotations
    - Verify code examples include comments
    - Verify file paths use monospace formatting
    - Verify code example length limits
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [~] 13.4 Verify technical accuracy
    - Verify RxJS patterns match monorepo usage
    - Verify TypeScript types match actual definitions
    - Verify framework APIs are accurately represented
    - Run TypeScript compiler on extracted code examples
    - _Requirements: 13.1, 13.2, 13.6_

- [~] 14. Final Validation Phase
  - [~] 14.1 Run validation checks
    - Verify all 23 chapters exist with correct numbering
    - Verify all chapter metadata is complete and consistent
    - Verify all code examples reference real files
    - Verify all code examples have required metadata
    - Verify chapter numbering is sequential (1-23)
    - Verify sections follow defined order
    - _Requirements: 2.8, 3.1, 3.6, 11.1, 11.2_
  
  - [~] 14.2 Generate validation report
    - Document all validation results
    - Identify any remaining issues
    - Provide recommendations for fixes
    - _Requirements: 14.7_
  
  - [~] 14.3 Manual review checklist
    - Verify pedagogical flow (beginner → advanced)
    - Verify consistent voice and style
    - Verify all learning objectives are met
    - Verify GreenWatch is used as primary case study throughout
    - Verify framework-agnostic patterns are taught before specific implementations
    - Verify patterns are emphasized over specific libraries
    - _Requirements: 12.3, 12.6, 2.1.1, 2.1.4_

- [~] 15. Final Checkpoint - Complete rewrite
  - Ensure all validation checks pass
  - Ensure manual review is complete
  - Confirm book is ready for publication
  - Ask the user if questions arise

- [~] 16. Testing Infrastructure Setup
  - [~] 16.1 Set up testing framework
    - Install Vitest and fast-check for property-based testing
    - Configure test environment with jsdom
    - Set up test directory structure (unit/, property/, integration/)
    - Configure test timeout to 20000ms
    - _Requirements: Testing Strategy_
  
  - [~] 16.2 Create test utilities
    - Create frontmatter parser utility for testing
    - Create code extractor utility for testing
    - Create path validator utility for testing
    - Create metadata validator utility for testing
    - _Requirements: Testing Strategy_
  
  - [~] 16.3 Set up property-based test configuration
    - Configure fast-check with minimum 100 iterations per test
    - Create test tag format helper: `// Feature: mvvm-book-rewrite, Property {number}: {property_text}`
    - Create property test template
    - _Requirements: Testing Strategy_

- [~] 16.5 Create Core Utilities and Tools
  - [~] 16.5.1 Implement FrontmatterParser
    - Create parse() method to extract metadata from MDX content
    - Create validate() method to check metadata completeness
    - Create update() method to modify frontmatter in MDX files
    - _Requirements: Design - Tools and Utilities_
  
  - [~] 16.5.2 Implement CodeExtractor
    - Create extract() method to extract code from source files with optional line ranges
    - Create validate() method to check if source files exist
    - Create addComments() method to add explanatory comments to code
    - _Requirements: Design - Tools and Utilities_
  
  - [~] 16.5.3 Implement MonorepoScanner
    - Create scanViewModels() method to find all ViewModels
    - Create scanFrameworkImplementations() method to find framework apps
    - Create scanSupportingLibraries() method to find framework-agnostic libraries
    - Create scanDomainEntities() method to find domain models
    - _Requirements: Design - Tools and Utilities_
  
  - [~] 16.5.4 Implement ChapterValidator
    - Create validateMetadata() method to check chapter metadata
    - Create validateCodeExamples() method to verify code example authenticity
    - Create validateCrossReferences() method to check chapter links
    - Create validatePedagogicalFlow() method to verify chapter progression
    - _Requirements: Design - Tools and Utilities_
  
  - [~] 16.5.5 Implement RewritePlanGenerator
    - Create generatePlan() method to create chapter rewrite plans
    - Create identifyCodeExamples() method to find relevant code for concepts
    - Create identifyPrerequisites() method to determine chapter dependencies
    - _Requirements: Design - Tools and Utilities_

- [ ]* 17. Property-Based Test Implementation
  - [ ]* 17.1 Implement Property 1: Code Example Authenticity
    - **Property 1: Code Example Authenticity**
    - Test that all code examples reference existing files in the monorepo
    - Test that code is extracted from actual files (not hypothetical)
    - **Validates: Requirements 3.1, 3.7, 6.8, 7.8, 8.3, 9.6, 10.5**
  
  - [ ]* 17.2 Implement Property 2: Code Example Source Constraints
    - **Property 2: Code Example Source Constraints**
    - Test that ViewModel examples come from correct directories
    - Test that Model examples come from correct directories
    - Test that View examples come from correct directories
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
  
  - [ ]* 17.3 Implement Property 3: Code Extraction Fidelity
    - **Property 3: Code Extraction Fidelity**
    - Test that extracted code matches source file content exactly
    - Test that TypeScript type annotations are preserved
    - Test that implementation details are preserved
    - **Validates: Requirements 3.8, 13.1, 13.2**
  
  - [ ]* 17.4 Implement Property 4: Metadata Completeness
    - **Property 4: Metadata Completeness**
    - Test that all chapters have required frontmatter fields
    - Test that all code examples have required metadata
    - **Validates: Requirements 3.6, 11.1, 11.5**
  
  - [ ]* 17.5 Implement Property 5: Chapter Numbering Consistency
    - **Property 5: Chapter Numbering Consistency**
    - Test that chapter files are numbered sequentially 1-23
    - Test that there are no gaps in numbering
    - **Validates: Requirements 2.8, 11.2**
  
  - [ ]* 17.6 Implement Property 6: Section Organization
    - **Property 6: Section Organization**
    - Test that chapters are organized in correct section order
    - Test that section names match expected values
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
  
  - [ ]* 17.7 Implement Property 7: Framework Cross-Reference
    - **Property 7: Framework Cross-Reference**
    - Test that ViewModels appear in at least two framework implementations
    - **Validates: Requirements 4.7, 5.6**
  
  - [ ]* 17.8 Implement Property 8: Monorepo Inventory Completeness
    - **Property 8: Monorepo Inventory Completeness**
    - Test that inventory includes all ViewModels
    - Test that inventory includes all framework implementations
    - Test that inventory includes all supporting libraries
    - **Validates: Requirements 1.2, 1.3, 1.4**
  
  - [ ]* 17.9 Implement Property 9: Domain Entity Identification
    - **Property 9: Domain Entity Identification**
    - Test that GreenWatch entities are identified
    - Test that e-commerce entities are identified
    - Test that plugin architecture entities are identified
    - **Validates: Requirements 1.5, 1.6, 1.7**
  
  - [ ]* 17.10 Implement Property 10: Chapter Frontmatter Parsing
    - **Property 10: Chapter Frontmatter Parsing**
    - Test that frontmatter parser extracts all required fields
    - **Validates: Requirements 1.1, 2.9**
  
  - [ ]* 17.11 Implement Property 11: Code Example Formatting
    - **Property 11: Code Example Formatting**
    - Test that code examples use MDX code blocks with language tags
    - Test that TypeScript examples include type annotations
    - **Validates: Requirements 15.1, 15.2**
  
  - [ ]* 17.12 Implement Property 12: Code Example Documentation
    - **Property 12: Code Example Documentation**
    - Test that code examples include explanatory comments
    - Test that code examples are surrounded by explanatory text
    - **Validates: Requirements 12.2, 15.3**
  
  - [ ]* 17.13 Implement Property 13: File Path Formatting
    - **Property 13: File Path Formatting**
    - Test that file paths use monospace formatting
    - **Validates: Requirements 15.4**
  
  - [ ]* 17.14 Implement Property 14: Code Example Length Limits
    - **Property 14: Code Example Length Limits**
    - Test that long code examples include highlight metadata
    - **Validates: Requirements 15.5, 15.6**
  
  - [ ]* 17.15 Implement Property 15: Cross-Chapter References
    - **Property 15: Cross-Chapter References**
    - Test that chapters building on previous concepts include references
    - **Validates: Requirements 11.4, 12.4**
  
  - [ ]* 17.16 Implement Property 16: Rewrite Plan Completeness
    - **Property 16: Rewrite Plan Completeness**
    - Test that rewrite plans include all required fields
    - **Validates: Requirements 14.2, 14.3**
  
  - [ ]* 17.17 Implement Property 17: Rewrite Status Tracking
    - **Property 17: Rewrite Status Tracking**
    - Test that rewrite plans include valid status values
    - **Validates: Requirements 14.5**
  
  - [ ]* 17.18 Implement Property 18: Code Compilation Verification
    - **Property 18: Code Compilation Verification**
    - Test that TypeScript code examples compile without errors
    - **Validates: Requirements 13.6**

- [ ]* 18. Unit Test Implementation
  - [ ]* 18.1 Write unit tests for frontmatter parser
    - Test parsing valid frontmatter with all fields
    - Test parsing frontmatter with missing fields (should error)
    - Test parsing malformed frontmatter
    - _Requirements: Testing Strategy_
  
  - [ ]* 18.2 Write unit tests for code extractor
    - Test extracting code with valid line ranges
    - Test extracting code with line ranges exceeding file length (should error)
    - Test extracting entire files
    - Test preserving type annotations
    - _Requirements: Testing Strategy_
  
  - [ ]* 18.3 Write unit tests for path validator
    - Test validating existing file paths
    - Test validating non-existent file paths (should error)
    - Test normalizing malformed paths
    - _Requirements: Testing Strategy_
  
  - [ ]* 18.4 Write unit tests for metadata validator
    - Test validating complete metadata
    - Test validating incomplete metadata (should error)
    - Test validating chapter numbering with gaps (should error)
    - Test validating chapter numbering with duplicates (should error)
    - _Requirements: Testing Strategy_
  
  - [ ]* 18.5 Write integration tests
    - Test complete chapter rewrite workflow
    - Test rewrite plan generation
    - Test code example extraction and validation
    - Test end-to-end validation
    - _Requirements: Testing Strategy_

- [~] 19. Final Testing Checkpoint
  - Ensure all property-based tests pass (100+ iterations each)
  - Ensure all unit tests pass
  - Ensure all integration tests pass
  - Review test coverage
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The rewrite follows a systematic chapter-by-chapter approach
- Each chapter builds on previous chapters (prerequisites documented in rewrite plans)
- **Framework-agnostic teaching approach**: Patterns are taught in general terms first, then Web Loom libraries are shown as concrete example implementations
- **Patterns over libraries**: The book emphasizes transferable knowledge - readers should be able to apply patterns using any library or build their own implementations
- All code examples are extracted from real monorepo implementations (no hypothetical code)
- Checkpoints ensure incremental validation and user feedback
- The book progresses from 21 to 23 chapters to accommodate framework-agnostic patterns section
- Property-based tests validate universal properties across all inputs (minimum 100 iterations each)
- Unit tests validate specific examples, edge cases, and error conditions
- Both testing approaches are complementary and necessary for comprehensive coverage
