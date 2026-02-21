Based on the provided documentation, here is a Product Requirements Document (PRD) for a lightweight signals implementation for your Web Loom toolkit. It synthesizes the core concepts from the referenced materials while aligning with Web Loom's existing architecture and principles.

### **Product Requirements Document: `@web-loom/signals-core`**

**Version:** 1.0.0 (Draft)
**Status:** Proposed
**Owner:** Web Loom Core Team

---

### **1. Executive Summary**

This PRD proposes the creation of `@web-loom/signals-core`, a new, lightweight, and framework-agnostic package for Web Loom. The package will provide a reactive primitive based on the Signals pattern, enabling granular state management and automatic dependency tracking.

Inspired by the [TC39 Signals proposal](https://github.com/tc39/proposal-signals), [Angular Signals](https://angular.dev/guide/signals), and [Preact Signals](https://preactjs.com/blog/introducing-signals/), this library will serve as a foundational building block for reactive state, computed values, and side effects. It is designed to integrate seamlessly with Web Loom's existing MVVM architecture (`@web-loom/mvvm-core`) and state management (`@web-loom/store-core`) while remaining usable in any JavaScript environment.

### **2. Background & Motivation**

Web Loom champions a framework-agnostic approach with robust patterns like MVVM. Currently, reactivity is primarily achieved through RxJS (as seen in `@web-loom/store-core` and `mvvm-core` examples). While RxJS is powerful, the Signals pattern offers several complementary benefits:

- **Simplicity & Ergonomics:** Signals provide a more straightforward API for simple state and derived values, reducing boilerplate compared to Subjects and complex operator pipelines.
- **Granular Reactivity:** Signals enable fine-grained updates without the need for memoization selectors or deep comparison, leading to potential performance improvements.
- **Framework Interoperability:** A standards-aligned Signals core (as per the TC39 proposal) would allow Web Loom's state to be consumed natively by any framework (Angular, Preact, Vue, Solid, etc.) that adopts the standard, or via simple adapters.
- **Alignment with Ecosystem:** Signals are becoming a ubiquitous pattern in the frontend ecosystem. Providing a native Signals implementation positions Web Loom as a modern and forward-thinking toolkit.

### **3. Goals**

- **Core Signal Primitives:** Implement the fundamental Signal types: `Signal` (writable) and `Computed` (read-only, derived).
- **Reactive Graph:** Automatically track dependencies between signals and ensure glitch-free propagation of updates.
- **Lazy Evaluation:** Computed signals should be lazily evaluated and their results memoized until dependencies change, as described in the [Angular](https://angular.dev/guide/signals#computed-signals-are-both-lazily-evaluated-and-memoized) and [TC39](https://github.com/tc39/proposal-signals?tab=readme-ov-file#core-features) documentation.
- **Effect System:** Provide a way to create side effects (e.g., `effect`) that run automatically when their signal dependencies change, useful for integrating with non-reactive APIs or the DOM.
- **Type-Safe:** Written entirely in TypeScript to provide excellent developer experience and type safety.
- **Minimal Bundle Size:** The package must be lightweight, aiming for < 1.5 kB gzipped, following Preact Signals' example of performance.
- **Framework Agnostic:** The core logic must have zero dependencies on any specific framework or UI library.

### **4. Non-Goals**

- **Replace RxJS:** Signals are not intended to replace RxJS for complex asynchronous operations, streams, or event handling. They will coexist, and interop utilities may be explored in the future.
- **Provide Framework Adapters:** While the core will be agnostic, creating specific adapters for React, Vue, etc., will be handled in separate packages (e.g., `@web-loom/signals-react`) or by the consuming frameworks themselves, following the TC39 proposal's vision.
- **Deep Signal Integration in MVVM Core:** This initial version focuses on the primitive itself. Deeper integration into `@web-loom/mvvm-core` (e.g., ViewModel properties as signals) will be a future enhancement.

### **5. Target Audience**

- Developers building applications with Web Loom who want a simpler reactivity model for UI state.
- Library authors looking for a lightweight, standard-compatible reactive primitive.
- Teams wanting to share reactive state logic across different frameworks within a micro-frontend architecture.

### **6. API Specification (Detailed)**

The API draws heavily from the sources provided, aiming for familiarity and alignment with the TC39 proposal where possible.

**6.1. Core Signal Types**

```typescript
// --- Writable Signal ---
function signal<T>(initialValue: T, options?: SignalOptions<T>): WritableSignal<T>;

interface SignalOptions<T> {
  /**
   * A custom equality function to determine if a new value is different from the current one.
   * Defaults to `Object.is`.
   */
  equal?: (a: T, b: T) => boolean;
}

interface WritableSignal<T> extends Signal<T> {
  /**
   * Directly sets the signal's value.
   */
  set(value: T): void;

  /**
   * Updates the signal's value using an updater function that receives the current value.
   */
  update(updater: (value: T) => T): void;

  /**
   * Returns a read-only version of this signal.
   * Mirrors Angular's `asReadonly` pattern for encapsulation.
   */
  asReadonly(): Signal<T>;
}

// --- Read-only Signal (Base) ---
interface Signal<T> {
  /**
   * Gets the current value. In a reactive context (computed, effect), this call is tracked as a dependency.
   */
  get(): T;

  /**
   * A convenience alias for `get()` to allow direct property access if desired, though `get()` is preferred for clarity.
   * This aligns with Preact's `.value` but uses a method to match the TC39 style.
   */
  // value: T; // We will use .get() for initial release.
}

// --- Computed Signal ---
function computed<T>(computation: () => T, options?: ComputedOptions<T>): Signal<T>;

interface ComputedOptions<T> {
  /**
   * A custom equality function for the computed value.
   */
  equal?: (a: T, b: T) => boolean;
}
```

**6.2. Side Effects**

```typescript
// --- Effect ---
function effect(effectFn: () => void): () => void;

/**
 * Creates an effect that runs synchronously when its dependencies change.
 * The effect function can optionally receive an `onCleanup` callback to handle teardown.
 * Returns a disposer function to destroy the effect and clean up its subscriptions.
 *
 * Based on the need for side effects in non-reactive APIs as described in Angular's guide.
 */
function effect(effectFn: (onCleanup: (cleanupFn: () => void) => void) => void): () => void;
```

**6.3. Utility Functions**

```typescript
// --- Untracked ---
function untracked<T>(fn: () => T): T;

/**
 * Executes the given function without establishing any signal dependencies.
 * If a signal is read inside `untracked`, it will not be tracked by the outer reactive context (e.g., a computed or effect).
 * Directly inspired by Angular's `untracked` and the TC39 proposal's need for reading without tracking.
 */

// --- Type Guards ---
function isSignal(value: unknown): value is Signal<unknown>;
function isWritableSignal(value: unknown): value is WritableSignal<unknown>;

// From Angular's type checking guide.
```

### **7. Integration with Web Loom**

- **`@web-loom/store-core`:** This new signals package can become the new reactive backbone for the store, offering an alternative or complementary reactivity model to RxJS. A store could be a collection of signals.
- **`@web-loom/mvvm-core`:** A ViewModel could expose its state as `Signal` properties, allowing the View (any framework) to subscribe to changes granularly.

  ```typescript
  // Example ViewModel using signals
  import { signal, computed } from '@web-loom/signals-core';

  class CounterViewModel {
    private _count = signal(0);
    public readonly count = this._count.asReadonly();
    public readonly doubleCount = computed(() => this.count.get() * 2);

    public increment() {
      this._count.update((v) => v + 1);
    }
  }
  ```

### **8. Success Metrics**

- **Adoption:** The package is used internally by other Web Loom core packages (e.g., `store-core`).
- **Performance:** Outperforms equivalent RxJS-based state management in scenarios with frequent, simple updates (e.g., UI toggles, form inputs).
- **Bundle Size:** Package size remains under the target threshold (e.g., < 1.5kB gzipped).
- **Developer Feedback:** Positive feedback from early adopters on the API's simplicity and predictability.
- **Correctness:** Passes a comprehensive test suite that verifies glitch-free execution, lazy evaluation, and proper cleanup, as emphasized by the [TC39 proposal's design goals](https://github.com/tc39/proposal-signals?tab=readme-ov-file#core-features).

### **9. Future Considerations (Post-MVP)**

- **`@web-loom/signals-react` / `-vue` / `-lit`:** Official framework adapter packages that allow signals to be read directly in components with automatic re-rendering, similar to Preact's integration.
- **Integration with `@web-loom/query-core`:** Using signals to manage loading and data states.
- **`linkedSignal`:** Implementing a writable signal whose value is derived from and syncs with another signal, as seen in Angular's advanced derivations.
- **Resource API:** A signal-based primitive for handling async operations, akin to Angular's resource API.

### **10. Open Questions**

- **Naming:** Should the getter be `.get()`, `.value`, or a getter property? `.get()` is explicit and aligns with the TC39 proposal, while `.value` is more ergonomic (Preact). We should start with `.get()` for clarity and future-proofing.
- **Scheduling:** How sophisticated should the effect scheduler be initially? Start with microtask batching or run synchronously for simplicity?
- **Error Handling:** Define clear behavior for errors thrown inside `computed` or `effect` functions.
