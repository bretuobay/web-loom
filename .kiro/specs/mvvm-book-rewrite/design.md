# Design Document: MVVM Book Rewrite

## Overview

This design outlines the systematic approach to rewriting all 21 chapters of the MVVM technical book. The rewrite transforms the book from using hypothetical examples to being grounded in real, working implementations from the Web Loom monorepo. The design covers the new chapter structure, content organization, code extraction strategies, and the execution workflow for rewriting each chapter.

The core principle is **authenticity through real code**: every example, pattern, and technique presented in the book will be extracted from actual working implementations in the monorepo, ensuring readers learn from production-ready code rather than theoretical examples.

## Architecture

### High-Level Structure

The book rewrite follows a three-tier organization:

1. **Content Layer**: The 21 MDX chapter files with frontmatter metadata
2. **Reference Layer**: Mapping between book concepts and actual monorepo implementations
3. **Extraction Layer**: Utilities and processes for extracting code examples from the monorepo

### New Chapter Organization

The book will be reorganized into six logical sections that provide clear pedagogical progression. **Important**: The book will speak in general terms about MVVM patterns and principles, using the Web Loom libraries as concrete examples of how to implement these patterns, rather than prescribing specific libraries.

**Section 1: Foundations (Chapters 1-3)**
- Chapter 1: The Frontend Architecture Crisis
- Chapter 2: Why MVVM Matters for Modern Frontend
- Chapter 3: MVVM Pattern Fundamentals

**Section 2: Core Patterns (Chapters 4-7)**
- Chapter 4: Building Framework-Agnostic Models
- Chapter 5: ViewModels and Reactive State
- Chapter 6: The View Layer Contract
- Chapter 7: Dependency Injection and Lifecycle Management

**Section 3: Framework Implementations (Chapters 8-12)**
- Chapter 8: React Implementation with Hooks
- Chapter 9: Vue Implementation with Composition API
- Chapter 10: Angular Implementation with DI
- Chapter 11: Lit Web Components Implementation
- Chapter 12: Vanilla JavaScript Implementation

**Section 4: Framework-Agnostic Patterns (Chapters 13-17)**
- Chapter 13: Reactive State Management Patterns
- Chapter 14: Event-Driven Communication
- Chapter 15: Data Fetching and Caching Strategies
- Chapter 16: Headless UI Behaviors
- Chapter 17: Composed UI Patterns

**Section 5: Advanced Topics (Chapters 18-21)**
- Chapter 18: Domain-Driven Design for Frontend
- Chapter 19: Testing MVVM Applications
- Chapter 20: Plugin Architecture and Extensibility
- Chapter 21: Design Systems and Theming

**Section 6: Real-World Applications (Chapters 22-23)**
- Chapter 22: Complete Case Studies
- Chapter 23: Conclusion and Best Practices

### Framework-Agnostic Approach

The book takes a **principles-first, library-agnostic** approach:

1. **Teach Patterns, Not Libraries**: Each chapter introduces MVVM patterns and principles in general terms, explaining the "why" and "what" before the "how"

2. **Libraries as Examples**: The Web Loom libraries (signals-core, store-core, event-bus-core, query-core, ui-core, ui-patterns, design-core) serve as concrete implementations demonstrating these patterns, not as prescriptive solutions

3. **Multiple Implementation Paths**: Where applicable, show how the same pattern can be implemented using:
   - Web Loom libraries (signals-core, store-core, etc.)
   - RxJS observables
   - Native browser APIs
   - Other popular libraries

4. **Transferable Knowledge**: Readers should be able to apply the patterns using any reactive library or even build their own implementations

**Example Structure for Framework-Agnostic Chapters:**

```markdown
## Chapter 13: Reactive State Management Patterns

### The Pattern
[Explain the general concept of reactive state management]

### Why It Matters for MVVM
[Explain how reactive state enables the ViewModel layer]

### Implementation Approaches

#### Approach 1: Signals Pattern
[Explain signals conceptually]
- Example using signals-core
- Example using other signal libraries

#### Approach 2: Observable Pattern
[Explain observables conceptually]
- Example using RxJS
- Example using store-core

#### Approach 3: Native Reactive Patterns
[Explain using native browser APIs]
- Example with Proxy-based reactivity
- Example with event-driven updates

### Choosing an Approach
[Guidance on when to use each approach]
```

### GreenWatch as Primary Case Study

The GreenWatch greenhouse monitoring system serves as the primary thread throughout the book:

**Domain Model:**
- **Greenhouse**: Container entity with environmental zones
- **Sensor**: Device that measures environmental conditions (temperature, humidity, soil moisture)
- **SensorReading**: Time-series data point from a sensor
- **ThresholdAlert**: Alert triggered when readings exceed configured thresholds

**ViewModels:**
- `GreenHouseViewModel`: Manages greenhouse state and operations
- `SensorViewModel`: Manages individual sensor state and configuration
- `SensorReadingViewModel`: Manages sensor reading streams and aggregations
- `ThresholdAlertViewModel`: Manages alert configuration and notifications

**Framework Implementations:**
- `apps/mvvm-react`: React implementation with hooks
- `apps/mvvm-vue`: Vue 3 implementation with Composition API
- `apps/mvvm-angular`: Angular implementation with dependency injection
- `apps/mvvm-lit`: Lit web components implementation
- `apps/mvvm-vanilla`: Vanilla JavaScript with EJS templates

### Framework-Agnostic Libraries as Teaching Tools

The book will use several framework-agnostic libraries from the Web Loom monorepo as concrete examples of MVVM-supporting patterns:

**Reactive State Libraries:**
- **signals-core**: Demonstrates the signals pattern (writable signals, computed values, effects)
  - Zero dependencies, framework-agnostic
  - Shows how to build reactive state without RxJS
  - Example of encapsulation pattern (readonly signals)

- **store-core**: Demonstrates the observable store pattern
  - Minimal reactive state management
  - Alternative to Redux/Zustand
  - Shows how to build framework-agnostic state containers

**Communication Patterns:**
- **event-bus-core**: Demonstrates event-driven architecture
  - Framework-agnostic event bus for cross-component communication
  - Shows pub/sub patterns in frontend applications

**Data Management:**
- **query-core**: Demonstrates data fetching and caching patterns
  - Zero-dependency data fetching library
  - Shows how to handle async state, caching, and invalidation
  - Alternative to React Query/SWR but framework-agnostic

**UI Patterns:**
- **ui-core**: Demonstrates headless UI behavior patterns
  - Framework-agnostic UI logic (Dialog, Form, List Selection, Roving Focus, Disclosure)
  - Shows separation of behavior from presentation
  - Atomic behaviors that compose into larger patterns

- **ui-patterns**: Demonstrates composed UI patterns
  - Built by composing ui-core behaviors
  - Shows Master-Detail, Wizard, Modal, Command Palette, Tabbed Interface, Sidebar Shell, Toast Queue
  - Framework-agnostic pattern implementations

**Design System:**
- **design-core**: Demonstrates design token and theming patterns
  - Framework-agnostic design token system
  - CSS custom properties generation
  - Dynamic theming with light/dark mode
  - Shows how to build scalable design systems

**Key Teaching Points:**
1. These libraries demonstrate **how** to implement MVVM-supporting patterns, not **what** you must use
2. Each library solves a specific architectural problem in a framework-agnostic way
3. Readers can use these libraries, adapt the patterns, or use alternative solutions
4. The patterns are more important than the specific implementations

## Components and Interfaces

### Chapter Structure Interface

Each chapter follows a consistent structure:

```typescript
interface ChapterMetadata {
  id: string;           // Kebab-case identifier
  title: string;        // Display title
  section: string;      // Section name
  chapterNumber: number; // Sequential number (1-21)
}

interface Chapter {
  metadata: ChapterMetadata;
  content: {
    introduction: string;      // Why this chapter matters
    concepts: ConceptSection[]; // Main teaching sections
    codeExamples: CodeExample[]; // Real code from monorepo
    keyTakeaways: string[];     // Summary points
    nextSteps: string;          // Bridge to next chapter
  };
}
```

### Code Example Interface

```typescript
interface CodeExample {
  sourceFile: string;        // Path in monorepo (e.g., "packages/view-models/src/GreenHouseViewModel.ts")
  startLine?: number;        // Optional line range
  endLine?: number;
  language: string;          // Language tag for syntax highlighting
  description: string;       // Explanation of what the code demonstrates
  highlightLines?: number[]; // Lines to emphasize
  framework?: string;        // If framework-specific
}
```

### Reference Mapping Interface

```typescript
interface ConceptToCodeMapping {
  concept: string;           // e.g., "ViewModel lifecycle management"
  implementations: {
    file: string;
    framework?: string;
    relevantSections: string[]; // Function/class names
  }[];
  relatedConcepts: string[]; // Cross-references
}
```

## Data Models

### Chapter Rewrite Plan

Each chapter has a rewrite plan that specifies:

```typescript
interface ChapterRewritePlan {
  chapterNumber: number;
  currentTitle: string;
  newTitle: string;
  currentSection: string;
  newSection: string;
  learningObjectives: string[];
  coreConceptsToTeach: string[];
  realImplementationsToReference: {
    viewModels: string[];      // e.g., ["GreenHouseViewModel", "SensorViewModel"]
    models: string[];
    views: {
      framework: string;
      files: string[];
    }[];
    supportingLibraries: string[];
  };
  codeExamplesToExtract: CodeExample[];
  dependsOnChapters: number[]; // Prerequisites
  rewriteStatus: "not_started" | "in_progress" | "completed" | "reviewed";
}
```

### Monorepo Inventory

```typescript
interface MonorepoInventory {
  viewModels: {
    name: string;
    file: string;
    purpose: string;
    usedInFrameworks: string[];
  }[];
  models: {
    name: string;
    file: string;
    purpose: string;
  }[];
  frameworkImplementations: {
    framework: string;
    appDirectory: string;
    components: string[];
    viewModelUsage: {
      viewModel: string;
      usedInComponents: string[];
    }[];
  }[];
  supportingLibraries: {
    name: string;
    package: string;
    purpose: string;
    keyExports: string[];
  }[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified:

**Redundancy Group 1: Code Example Source Verification**
- Properties 3.1, 3.7, 6.8, 7.8, 8.3, 9.6, and 10.5 all verify that code examples come from real files in the monorepo
- These can be consolidated into a single comprehensive property about code example authenticity

**Redundancy Group 2: Metadata Completeness**
- Properties 3.6, 11.1, and 11.5 all verify that required metadata fields are present
- These can be combined into one property about metadata completeness

**Redundancy Group 3: Sequential Numbering**
- Properties 2.8 and 11.2 both verify sequential chapter numbering
- These are identical and can be merged

**Redundancy Group 4: Code Extraction Accuracy**
- Properties 3.8, 13.1, and 13.2 all verify that extracted code matches source files exactly
- These can be combined into one property about extraction fidelity

**Redundancy Group 5: Framework Cross-Reference**
- Properties 4.7 and 5.6 both verify that ViewModels are shown across multiple frameworks
- These are identical and can be merged

The following properties provide unique validation value and will be included in the correctness properties section.

### Correctness Properties

Property 1: Code Example Authenticity
*For any* code example in the book, the source file path must reference an existing file in the Web Loom monorepo, and the code must be extracted from that actual file (not hypothetical or made-up code).
**Validates: Requirements 3.1, 3.7, 6.8, 7.8, 8.3, 9.6, 10.5**

Property 2: Code Example Source Constraints
*For any* code example in the book, if it demonstrates a ViewModel, the source must be from `packages/view-models/` or `packages/mvvm-core/`; if it demonstrates a Model, the source must be from `packages/mvvm-core/src/models/`; if it demonstrates a View, the source must be from the appropriate `apps/mvvm-*` directory.
**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

Property 3: Code Extraction Fidelity
*For any* code example extracted from a source file, the extracted code must match the source file content exactly (preserving implementation details, error handling, validation, and edge cases), and if the code is TypeScript, type annotations must be preserved.
**Validates: Requirements 3.8, 13.1, 13.2**

Property 4: Metadata Completeness
*For any* chapter in the book, the frontmatter must include id, title, and section fields, and for any code example, the metadata must include sourceFile and language fields.
**Validates: Requirements 3.6, 11.1, 11.5**

Property 5: Chapter Numbering Consistency
*For any* set of chapters in the book, the chapter file names must be numbered sequentially from 1 to 21 without gaps (chapter1.mdx, chapter2.mdx, ..., chapter21.mdx).
**Validates: Requirements 2.8, 11.2**

Property 6: Section Organization
*For any* book structure, the chapters must be organized into sections in the following order: Foundations, Core Patterns, Framework Implementations, Supporting Libraries, Advanced Topics, Real-World Applications.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 7: Framework Cross-Reference
*For any* ViewModel mentioned in the book, if it appears in code examples, it must appear in code examples from at least two different framework implementations (React, Vue, Angular, Lit, or Vanilla JS).
**Validates: Requirements 4.7, 5.6**

Property 8: Monorepo Inventory Completeness
*For any* analysis of the monorepo, the inventory must include all TypeScript files in `packages/view-models/`, all directories matching `apps/mvvm-*`, and all packages in `packages/` with their purposes.
**Validates: Requirements 1.2, 1.3, 1.4**

Property 9: Domain Entity Identification
*For any* analysis of the monorepo, the system must identify domain entities (classes, interfaces, types) in the GreenWatch system (Greenhouse, Sensor, SensorReading, ThresholdAlert), e-commerce system, and plugin architecture system.
**Validates: Requirements 1.5, 1.6, 1.7**

Property 10: Chapter Frontmatter Parsing
*For any* MDX file in the chapters directory, the parser must correctly extract the id, title, and section fields from the frontmatter.
**Validates: Requirements 1.1, 2.9**

Property 11: Code Example Formatting
*For any* code example in the book, it must be formatted as an MDX code block with a language tag, and if the code is TypeScript, it must include type annotations.
**Validates: Requirements 15.1, 15.2**

Property 12: Code Example Documentation
*For any* code example in the book, it must include comments explaining key concepts, and it must be surrounded by explanatory text (text before and/or after the code block).
**Validates: Requirements 12.2, 15.3**

Property 13: File Path Formatting
*For any* file path mentioned in the book, it must be formatted with monospace styling (wrapped in backticks in markdown).
**Validates: Requirements 15.4**

Property 14: Code Example Length Limits
*For any* code example in the book, if it exceeds 50 lines, it must include highlight metadata indicating which lines are most relevant.
**Validates: Requirements 15.5, 15.6**

Property 15: Cross-Chapter References
*For any* chapter that builds on concepts from previous chapters, it must include at least one reference (link or mention) to the prerequisite chapter(s).
**Validates: Requirements 11.4, 12.4**

Property 16: Rewrite Plan Completeness
*For any* chapter rewrite plan, it must include learning objectives, core concepts to teach, real implementations to reference, and code examples to extract.
**Validates: Requirements 14.2, 14.3**

Property 17: Rewrite Status Tracking
*For any* chapter rewrite plan, it must include a status field with one of the following values: "not_started", "in_progress", "completed", or "reviewed".
**Validates: Requirements 14.5**

Property 18: Code Compilation Verification
*For any* TypeScript code example extracted from the monorepo, when compiled in isolation with appropriate type definitions, it must compile without errors.
**Validates: Requirements 13.6**

## Error Handling

### File System Errors

**Missing Source Files:**
- When a code example references a source file that doesn't exist, the system must log an error with the file path and the chapter where it's referenced
- The system must provide suggestions for similar file paths that do exist
- The rewrite process must not proceed until all source file references are valid

**Invalid File Paths:**
- When a file path is malformed or uses incorrect separators, the system must normalize the path and validate it
- If normalization fails, the system must report the error with the expected format

### Parsing Errors

**Frontmatter Parsing:**
- When MDX frontmatter is malformed or missing required fields, the system must report which fields are missing or invalid
- The system must provide the expected frontmatter structure
- The system must not proceed with rewriting a chapter until its frontmatter is valid

**Code Extraction Errors:**
- When extracting code with line ranges, if the line numbers exceed the file length, the system must report the actual file length
- When extracting code, if the specified language doesn't match the file extension, the system must warn but allow the extraction

### Validation Errors

**Metadata Validation:**
- When chapter metadata is incomplete or inconsistent, the system must report all validation errors at once (not one at a time)
- The system must validate that chapter numbers are unique and sequential
- The system must validate that section names match the allowed set

**Code Example Validation:**
- When code examples lack required metadata, the system must report which fields are missing
- When code examples reference non-existent files, the system must report the invalid paths
- The system must validate that TypeScript code examples include type annotations

### Compilation Errors

**TypeScript Compilation:**
- When extracted TypeScript code fails to compile, the system must report the compilation errors with line numbers
- The system must indicate whether the error is due to missing imports, type errors, or syntax errors
- The system must suggest whether the code needs additional context or imports to compile

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of valid and invalid frontmatter
- Edge cases like empty files, missing directories, malformed paths
- Integration points between parsing, extraction, and validation
- Error message formatting and clarity

**Property-Based Tests** focus on:
- Universal properties that hold for all chapters (metadata completeness, numbering consistency)
- Code extraction fidelity across all possible source files
- Validation rules that apply to all code examples
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

We'll use **fast-check** (for TypeScript/JavaScript) as the property-based testing library.

Each property test must:
- Run a minimum of 100 iterations
- Include a comment tag referencing the design property
- Tag format: `// Feature: mvvm-book-rewrite, Property {number}: {property_text}`

### Test Organization

```
tests/
  unit/
    frontmatter-parser.test.ts
    code-extractor.test.ts
    path-validator.test.ts
    metadata-validator.test.ts
  property/
    code-authenticity.property.test.ts      // Property 1
    code-source-constraints.property.test.ts // Property 2
    extraction-fidelity.property.test.ts     // Property 3
    metadata-completeness.property.test.ts   // Property 4
    chapter-numbering.property.test.ts       // Property 5
    section-organization.property.test.ts    // Property 6
    framework-cross-ref.property.test.ts     // Property 7
    inventory-completeness.property.test.ts  // Property 8
  integration/
    chapter-rewrite-workflow.test.ts
    end-to-end-validation.test.ts
```

### Key Test Scenarios

**Unit Test Examples:**
- Parsing frontmatter with all required fields
- Parsing frontmatter with missing fields (should error)
- Extracting code from a file with valid line ranges
- Extracting code with line ranges exceeding file length (should error)
- Validating chapter numbering with gaps (should error)
- Validating chapter numbering with duplicates (should error)

**Property Test Examples:**
- For all chapters, frontmatter must have id, title, and section
- For all code examples, source files must exist in the monorepo
- For all extracted code, content must match source file exactly
- For all TypeScript code examples, type annotations must be present
- For all chapters, numbering must be sequential without gaps

### Testing the Rewrite Process

**Workflow Testing:**
- Test the complete rewrite workflow for a single chapter
- Verify that the rewrite plan is generated correctly
- Verify that code examples are extracted and validated
- Verify that the rewritten chapter passes all validation checks

**Regression Testing:**
- After rewriting chapters, run all property tests to ensure no regressions
- Verify that existing chapters still pass validation
- Verify that cross-references between chapters remain valid

## Implementation Workflow

### Phase 1: Analysis and Inventory (Requirements 1.x)

**Step 1.1: Parse Existing Chapters**
- Read all 21 MDX files from `apps/docs/content/book/chapters/`
- Extract frontmatter (id, title, section) from each chapter
- Build a chapter inventory with current structure

**Step 1.2: Catalog Monorepo Implementations**
- Scan `packages/view-models/` for all ViewModel files
- Scan `apps/mvvm-*` directories for framework implementations
- Scan `packages/` for supporting libraries
- Build a monorepo inventory with file paths and purposes

**Step 1.3: Identify Domain Entities**
- Parse TypeScript files to extract class, interface, and type definitions
- Identify GreenWatch entities (Greenhouse, Sensor, SensorReading, ThresholdAlert)
- Identify e-commerce entities
- Identify plugin architecture entities

**Output:** 
- `chapter-inventory.json`: Current chapter structure
- `monorepo-inventory.json`: Available implementations
- `domain-entities.json`: Identified domain models

### Phase 2: Chapter Reorganization (Requirements 2.x)

**Step 2.1: Define New Chapter Structure**
- Create the six-section structure (Foundations, Core Patterns, Framework Implementations, Supporting Libraries, Advanced Topics, Real-World Applications)
- Map existing chapters to new sections
- Identify chapters that need renaming

**Step 2.2: Create Chapter Mapping**
- For each existing chapter, determine its new section
- Assign new chapter numbers if reordering is needed
- Document learning objectives for each chapter

**Step 2.3: Update Chapter Metadata**
- Update frontmatter in all chapter files with new section names
- Ensure chapter numbering is sequential (1-21)
- Validate metadata consistency

**Output:**
- `chapter-mapping.json`: Old structure → New structure
- Updated MDX files with new frontmatter

### Phase 3: Rewrite Plan Generation (Requirements 14.x)

**Step 3.1: Generate Chapter Rewrite Plans**
- For each chapter, create a rewrite plan specifying:
  - Learning objectives
  - Core concepts to teach
  - Real implementations to reference (ViewModels, Models, Views)
  - Code examples to extract (with file paths and line ranges)
  - Dependencies on previous chapters

**Step 3.2: Identify Code Examples**
- For each concept in each chapter, identify relevant code in the monorepo
- Specify exact file paths and line ranges for code extraction
- Ensure code examples progress from simple to complex

**Step 3.3: Validate Rewrite Plans**
- Verify all referenced files exist
- Verify all ViewModels are used in multiple frameworks
- Verify prerequisite chapters are covered before dependent chapters

**Output:**
- `chapter-rewrite-plans.json`: Complete rewrite plan for all 21 chapters

### Phase 4: Chapter Rewriting (Requirements 3.x, 4.x, 5.x, 6.x, 7.x, 8.x, 9.x, 10.x, 12.x, 15.x)

**Step 4.1: Rewrite Chapters Sequentially**
- Follow the rewrite plan for each chapter
- Extract code examples from the monorepo using specified file paths
- Write explanatory text around code examples
- Include cross-references to previous chapters
- Add key takeaways sections

**Step 4.2: Code Example Extraction**
- Read source files from the monorepo
- Extract specified line ranges (or entire files if no range specified)
- Preserve all implementation details (error handling, validation, types)
- Format as MDX code blocks with language tags
- Add comments to explain key concepts

**Step 4.3: Framework Comparison Sections**
- For chapters covering framework implementations, show the same ViewModel used in multiple frameworks
- Highlight framework-specific patterns (hooks, Composition API, DI)
- Demonstrate framework independence

**Step 4.4: Validation After Each Chapter**
- Run property tests to verify code authenticity
- Verify metadata completeness
- Verify code extraction fidelity
- Verify formatting consistency

**Output:**
- Rewritten MDX files for all 21 chapters
- All code examples extracted from real implementations

### Phase 5: Cross-Cutting Concerns (Requirements 11.x, 13.x)

**Step 5.1: Add Cross-References**
- Identify concepts that span multiple chapters
- Add markdown links between related chapters
- Ensure prerequisite chapters are referenced

**Step 5.2: Create Table of Contents**
- Generate a TOC mapping chapters to sections
- Include chapter titles and page numbers (if applicable)
- Add navigation links

**Step 5.3: Technical Accuracy Review**
- Verify RxJS patterns match monorepo usage
- Verify TypeScript types match actual definitions
- Verify framework APIs are accurately represented
- Run TypeScript compiler on extracted code examples

**Output:**
- `table-of-contents.md`: Complete book TOC
- Validation report for technical accuracy

### Phase 6: Final Validation and Review

**Step 6.1: Run All Property Tests**
- Execute all property-based tests (minimum 100 iterations each)
- Verify all properties pass
- Fix any violations

**Step 6.2: Run All Unit Tests**
- Execute all unit tests
- Verify edge cases are handled correctly
- Verify error messages are clear

**Step 6.3: Manual Review Checklist**
- Verify pedagogical flow (beginner → advanced)
- Verify consistent voice and style
- Verify all learning objectives are met
- Verify GreenWatch is used as primary case study throughout

**Output:**
- Test results report
- Final validation report
- Completed, rewritten book

## Tools and Utilities

### Frontmatter Parser

```typescript
interface FrontmatterParser {
  parse(mdxContent: string): ChapterMetadata;
  validate(metadata: ChapterMetadata): ValidationResult;
  update(mdxContent: string, newMetadata: ChapterMetadata): string;
}
```

### Code Extractor

```typescript
interface CodeExtractor {
  extract(sourceFile: string, startLine?: number, endLine?: number): string;
  validate(sourceFile: string): boolean;
  addComments(code: string, explanations: Map<number, string>): string;
}
```

### Monorepo Scanner

```typescript
interface MonorepoScanner {
  scanViewModels(): ViewModelInfo[];
  scanFrameworkImplementations(): FrameworkImplementationInfo[];
  scanSupportingLibraries(): LibraryInfo[];
  scanDomainEntities(directory: string): DomainEntityInfo[];
}
```

### Chapter Validator

```typescript
interface ChapterValidator {
  validateMetadata(chapter: Chapter): ValidationResult;
  validateCodeExamples(chapter: Chapter): ValidationResult;
  validateCrossReferences(chapter: Chapter, allChapters: Chapter[]): ValidationResult;
  validatePedagogicalFlow(chapters: Chapter[]): ValidationResult;
}
```

### Rewrite Plan Generator

```typescript
interface RewritePlanGenerator {
  generatePlan(chapter: Chapter, inventory: MonorepoInventory): ChapterRewritePlan;
  identifyCodeExamples(concepts: string[], inventory: MonorepoInventory): CodeExample[];
  identifyPrerequisites(chapter: Chapter, allChapters: Chapter[]): number[];
}
```

## Success Criteria

The rewrite is considered successful when:

1. All 21 chapters have been rewritten with new content
2. All code examples are extracted from real monorepo implementations
3. All property-based tests pass (100+ iterations each)
4. All unit tests pass
5. Chapter metadata is consistent and complete
6. Chapter numbering is sequential (1-21)
7. Sections follow the defined order (Foundations → Core → Implementations → Supporting → Advanced → Real-World)
8. GreenWatch is used as the primary case study throughout
9. All frameworks (React, Vue, Angular, Lit, Vanilla JS) are covered with real examples
10. All supporting libraries are covered with real examples
11. Cross-references between chapters are valid
12. TypeScript code examples compile without errors
13. Manual review confirms pedagogical flow and technical accuracy

## Future Enhancements

Potential improvements beyond the initial rewrite:

1. **Interactive Code Examples**: Embed runnable code examples using CodeSandbox or similar
2. **Video Walkthroughs**: Add video explanations for complex concepts
3. **Practice Exercises**: Add coding exercises at the end of each chapter
4. **Quiz Questions**: Add comprehension checks after major sections
5. **Downloadable Code**: Provide downloadable starter projects for each chapter
6. **Community Contributions**: Allow readers to suggest improvements or additional examples
7. **Translations**: Translate the book into other languages
8. **PDF/EPUB Generation**: Generate downloadable formats
9. **Search Functionality**: Add full-text search across all chapters
10. **Progress Tracking**: Track reader progress through the book
