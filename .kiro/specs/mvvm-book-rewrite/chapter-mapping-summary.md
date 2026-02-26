# Chapter Mapping Summary

**Generated:** 2025-01-15  
**Version:** 1.0

This document provides a human-readable summary of the chapter mapping from the old structure (21 chapters) to the new structure (23 chapters).

## Overview

- **Total Old Chapters:** 21
- **Total New Chapters:** 23
- **Chapters Kept:** 3
- **Chapters Renamed:** 10
- **Chapters Moved:** 8
- **Chapters Removed:** 8
- **New Chapters Added:** 9

## Section Reorganization

### Old Sections → New Sections

1. **The Crisis** → **Foundations**
   - Renamed to be more positive and forward-looking
   - Chapters: 1-3 (was 1-4)

2. **Framework-Agnostic Core** → **Core Patterns** + **Framework-Agnostic Patterns**
   - Split into two sections for better organization
   - Core Patterns: Chapters 4-7
   - Framework-Agnostic Patterns: Chapters 13-17 (new section)

3. **View Layer Implementations** → **Framework Implementations**
   - Broadened to cover complete framework implementations
   - Chapters: 8-12 (expanded from 2 to 5 chapters)

4. **Enterprise Scale** → **Advanced Topics**
   - Renamed to be more inclusive
   - Chapters: 18-21 (expanded from 3 to 4 chapters)

5. **The GreenWatch Case Study** → **Real-World Applications**
   - Broadened to include multiple case studies and best practices
   - Chapters: 22-23

## Chapter-by-Chapter Mapping

### Section 1: Foundations (Chapters 1-3)

| Old # | New # | Old Title | New Title | Action |
|-------|-------|-----------|-----------|--------|
| 1 | 1 | The Frontend Architecture Crisis | The Frontend Architecture Crisis | Keep |
| 2 | 2 | The Crisis in Contemporary Frontend Development | Why MVVM Matters for Modern Frontend | Rename |
| 3 | 3 | The MVVM Pattern Fundamentals | MVVM Pattern Fundamentals | Keep |

### Section 2: Core Patterns (Chapters 4-7)

| Old # | New # | Old Title | New Title | Action |
|-------|-------|-----------|-----------|--------|
| - | 4 | - | Building Framework-Agnostic Models | **NEW** |
| 6 | 5 | Reactive State Management with RxJS | ViewModels and Reactive State | Rename & Move |
| 10 | 6 | The Dumb View Philosophy and View Layer Contracts | The View Layer Contract | Rename & Move |
| 9 | 7 | Dependency Injection and Service Architecture | Dependency Injection and Lifecycle Management | Rename & Move |

### Section 3: Framework Implementations (Chapters 8-12)

| Old # | New # | Old Title | New Title | Action |
|-------|-------|-----------|-----------|--------|
| 7 | 8 | Implementing the View Layer – React Edition | React Implementation with Hooks | Rename & Move |
| 11 | 9 | Vue Implementation — Proving Framework Independence | Vue Implementation with Composition API | Rename & Move |
| 12 | 10 | Angular Implementation – Native RxJS Integration | Angular Implementation with DI | Rename & Move |
| - | 11 | - | Lit Web Components Implementation | **NEW** |
| - | 12 | - | Vanilla JavaScript Implementation | **NEW** |

### Section 4: Framework-Agnostic Patterns (Chapters 13-17)

| Old # | New # | Old Title | New Title | Action |
|-------|-------|-----------|-----------|--------|
| - | 13 | - | Reactive State Management Patterns | **NEW** |
| 5 | 14 | Domain Events & Cross-Context Communication | Event-Driven Communication | Rename & Move |
| - | 15 | - | Data Fetching and Caching Strategies | **NEW** |
| - | 16 | - | Headless UI Behaviors | **NEW** |
| - | 17 | - | Composed UI Patterns | **NEW** |

### Section 5: Advanced Topics (Chapters 18-21)

| Old # | New # | Old Title | New Title | Action |
|-------|-------|-----------|-----------|--------|
| 4 | 18 | Domain-Driven Design for Frontend Applications | Domain-Driven Design for Frontend | Rename & Move |
| 8 | 19 | Testing ViewModels and Domain Logic | Testing MVVM Applications | Rename & Move |
| - | 20 | - | Plugin Architecture and Extensibility | **NEW** |
| - | 21 | - | Design Systems and Theming | **NEW** |

### Section 6: Real-World Applications (Chapters 22-23)

| Old # | New # | Old Title | New Title | Action |
|-------|-------|-----------|-----------|--------|
| 15 | 22 | GreenWatch Architecture and Bounded Contexts | Complete Case Studies | Rename & Move |
| 21 | 23 | Tradeoffs, Discipline, and the Architect's Path | Conclusion and Best Practices | Rename & Move |

### Removed Chapters

| Old # | Title | Reason for Removal |
|-------|-------|-------------------|
| 13 | Vue Implementation — Proving Framework Independence | Duplicate of Chapter 11 |
| 14 | Cross-Platform — Ionic, React Native, and Electron | Content integrated into framework chapters |
| 16 | Pragmatic Architecture in the Real World | Content integrated into Chapters 22 and 23 |
| 17 | Multi-Framework Implementation Showcase | Content consolidated into Chapter 22 |
| 18 | Comprehensive Testing Strategy at Scale | Content consolidated into Chapter 19 |
| 19 | The Scalable Monolith - Modular Architecture Patterns | Content integrated into Chapters 22 and 23 |
| 20 | The Future - Trainable Structures and AI Automation | Out of scope for core MVVM book |

## Key Renaming Decisions

### Chapter 2: "The Crisis in Contemporary Frontend Development" → "Why MVVM Matters for Modern Frontend"
**Rationale:** Original title was too problem-focused. New title emphasizes the solution (MVVM) and is more actionable.

### Chapter 5: "Reactive State Management with RxJS" → "ViewModels and Reactive State"
**Rationale:** Broadened to focus on ViewModels as the primary concept, with reactive state as the enabling mechanism.

### Chapter 6: "The Dumb View Philosophy and View Layer Contracts" → "The View Layer Contract"
**Rationale:** Simplified while retaining the core concept. 'Dumb view' philosophy is covered within the chapter.

### Chapter 14: "Domain Events & Cross-Context Communication" → "Event-Driven Communication"
**Rationale:** Simplified to focus on the pattern rather than DDD-specific terminology. More accessible.

### Chapter 19: "Testing ViewModels and Domain Logic" → "Testing MVVM Applications"
**Rationale:** Broadened to cover testing across all MVVM layers (Models, ViewModels, Views).

### Chapter 22: "GreenWatch Architecture and Bounded Contexts" → "Complete Case Studies"
**Rationale:** Broadened to include multiple case studies (GreenWatch and e-commerce).

## New Chapters Rationale

### Chapter 4: Building Framework-Agnostic Models
**Reason:** Need dedicated chapter to cover Model layer in detail before ViewModels.  
**Source:** `packages/mvvm-core/src/models/`, `packages/models/`

### Chapter 11: Lit Web Components Implementation
**Reason:** Lit framework implementation exists in monorepo (`apps/mvvm-lit`).  
**Source:** `apps/mvvm-lit/`

### Chapter 12: Vanilla JavaScript Implementation
**Reason:** Vanilla JS implementation exists in monorepo (`apps/mvvm-vanilla`).  
**Source:** `apps/mvvm-vanilla/`

### Chapter 13: Reactive State Management Patterns
**Reason:** Teach reactive state patterns in general terms, using Web Loom libraries as examples.  
**Source:** `packages/store-core/`

### Chapter 15: Data Fetching and Caching Strategies
**Reason:** Teach data fetching patterns in general terms, using Web Loom libraries as examples.  
**Source:** `packages/query-core/`

### Chapter 16: Headless UI Behaviors
**Reason:** Teach headless UI patterns in general terms, using Web Loom libraries as examples.  
**Source:** `packages/ui-core/`

### Chapter 17: Composed UI Patterns
**Reason:** Teach composed UI patterns in general terms, using Web Loom libraries as examples.  
**Source:** `packages/ui-patterns/`

### Chapter 20: Plugin Architecture and Extensibility
**Reason:** Plugin architecture implementation exists in monorepo.  
**Source:** `packages/plugin-core/`, `apps/plugin-react/`

### Chapter 21: Design Systems and Theming
**Reason:** Teach design system patterns in general terms, using Web Loom libraries as examples.  
**Source:** `packages/design-core/`, `packages/typography-core/`

## Prerequisite Relationships

### Linear Prerequisites (Must Read in Order)
- **Foundations (1-3):** Must be read sequentially
- **Core Patterns (4-7):** Must be read after Foundations
- **Framework Implementations (8-12):** Must be read after Core Patterns

### Flexible Prerequisites
- **Framework-Agnostic Patterns (13-17):** Can be read after Framework Implementations
- **Advanced Topics (18-21):** Can be read in any order after Framework Implementations
- **Real-World Applications (22-23):** Should be read last

### Key Dependencies
- Chapter 4 (Models) enables Chapters 5-12
- Chapter 5 (ViewModels) enables Chapters 6-13
- Chapters 8-12 (Framework Implementations) enable Chapter 22 (Case Studies)
- All chapters enable Chapter 23 (Conclusion)

## Content Changes Summary

### Major Changes Across All Chapters

1. **Framework-Agnostic Approach**
   - All chapters teach patterns and principles in general terms first
   - Web Loom libraries shown as concrete examples, not prescriptive solutions
   - Affected: Chapters 13-17, 21

2. **Real Code Integration**
   - All code examples extracted from actual working implementations
   - No hypothetical or made-up examples
   - Affected: All chapters

3. **GreenWatch as Primary Case Study**
   - Used consistently throughout to demonstrate MVVM concepts
   - Affected: Chapters 1-12, 22

4. **Complete Framework Coverage**
   - Added Lit and Vanilla JS implementations
   - Demonstrates MVVM across all frameworks in monorepo
   - Affected: Chapters 11-12

5. **New Framework-Agnostic Patterns Section**
   - Entire new section covering reactive state, events, data fetching, UI behaviors
   - Affected: Chapters 13-17

6. **Plugin Architecture Coverage**
   - New chapter covering plugin patterns
   - Affected: Chapter 20

7. **Design Systems Coverage**
   - New chapter covering design token and theming patterns
   - Affected: Chapter 21

8. **Consolidated Testing Content**
   - All testing content in one comprehensive chapter
   - Affected: Chapter 19

## Next Steps

1. Review this mapping with stakeholders
2. Begin rewriting chapters in order (1-23)
3. Extract code examples from monorepo for each chapter
4. Validate prerequisite relationships during rewrite
5. Ensure consistent voice and pedagogical flow
6. Run validation tests after each chapter rewrite

## Notes

- This mapping provides a complete guide for the book rewrite
- All chapters will use real code from the Web Loom monorepo
- The book follows a principles-first, library-agnostic approach
- GreenWatch is the primary case study, with e-commerce as secondary
- Framework implementations demonstrate the same ViewModels across different frameworks
- Prerequisite relationships ensure proper pedagogical flow
