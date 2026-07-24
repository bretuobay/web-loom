# Product Requirements Document (PRD)
## Web Loom Reactive Template Engine

---

| **Document Version** | 1.0 |
|----------------------|-----|
| **Status**           | Draft |
| **Date**             | 2026-07-23 |
| **Author**           | Web Loom Team |
| **Target Package**   | `@web-loom/template-engine` |

---

## 1. Executive Summary

The Web Loom Reactive Template Engine is a **signal-native templating system** designed specifically for the Web Loom ecosystem. It provides a familiar, Mustache-like syntax for frontend engineers while being deeply integrated with `@web-loom/signals-core`. The engine enables **fine-grained reactive DOM updates** by treating signals as first-class citizens in the template rendering pipeline.

Unlike traditional template engines that re-render entire templates on data changes, this engine leverages the TC39 Signals proposal's reactivity model to perform **surgical DOM updates**—only the parts of the template that depend on changed signals are re-rendered.

---

## 2. Background & Motivation

### 2.1 The Signal Revolution

The frontend ecosystem is increasingly adopting signals as the foundational primitive for reactivity. The TC39 Signals proposal represents a standardization effort to bring reactive programming primitives to JavaScript, with participation from framework authors across Angular, Ember, Preact, Qwik, Solid, Svelte, Vue, and others. The proposal states:

> *"The signal API here is a better fit for frameworks to build on top of, providing interoperability through common signal graph and auto-tracking mechanism."*

Web Loom has embraced this direction with `@web-loom/signals-core` as the foundation for its reactive MVVM architecture.

### 2.2 Why a Dedicated Template Engine?

Web Loom's libraries are framework-agnostic and work with React, Vue, SolidJS, etc.. However, the framework itself needs its **own native reactive rendering template engine** that:

- **Is not a wrapper** around React, Vue, or any other framework's rendering
- **Deeply integrates** with `@web-loom/signals-core`
- **Provides a familiar syntax** for frontend engineers (Mustache-like)
- **Enables fine-grained reactivity** without virtual DOM overhead

### 2.3 Relationship to Web Loom

This template engine is a **core part of the Web Loom framework**, not a general-purpose library for other frameworks. It is designed to work with:
- `@web-loom/signals-core` — the signal implementation
- `@web-loom/mvvm-core` — the MVVM layer built on signals
- Other Web Loom ecosystem packages

---

## 3. Core Principles

### 3.1 Signal-First Design

Every dynamic value in a template is a signal. The engine:
- Reads signal values via `.get()` (auto-tracked within reactive contexts)
- Subscribes to signal changes via `.subscribe(fn)`
- Uses `computed` signals for derived values
- Leverages `effect` for side effects and DOM updates

### 3.2 Familiar Syntax

Template syntax is inspired by Mustache, making it immediately recognizable to frontend engineers:

```html
<div>
  <h1>{{ title }}</h1>
  <p>{{ description }}</p>
</div>
```

### 3.3 Fine-Grained Reactivity

When a signal changes, only the DOM nodes that depend on that signal are updated—not the entire template.

### 3.4 Framework Agnostic (Within Web Loom)

The template engine is a standalone package (`@web-loom/template-engine`) with no dependencies on React, Vue, or other UI frameworks. It works exclusively with Web Loom's signal ecosystem.

---

## 4. Syntax Specification

The template syntax is a **superset of Mustache**, extended with signal-specific semantics.

### 4.1 Variable Interpolation

**Syntax:** `{{ variable }}`

**Semantics:** Renders the current value of the signal. Establishes a reactive dependency—when the signal changes, the DOM text node updates.

```html
<span>{{ user.name$ }}</span>
<span>{{ formatDate(createdAt$.get()) }}</span>
```

### 4.2 Unescaped HTML

**Syntax:** `{{{ variable }}}`

**Semantics:** Renders raw HTML without escaping.

```html
<div>{{{ richContent$ }}}</div>
```

### 4.3 Conditional Sections

**Syntax:** `{{#condition}} ... {{/condition}}`

**Semantics:** Renders the block only if the condition signal evaluates to truthy.

```html
{{#isLoggedIn$}}
  <p>Welcome back, {{ user.name$ }}!</p>
{{/isLoggedIn$}}
```

### 4.4 Inverted Sections

**Syntax:** `{{^condition}} ... {{/condition}}`

**Semantics:** Renders the block only if the condition signal evaluates to falsy.

```html
{{^isLoggedIn$}}
  <a href="/login">Log in</a>
{{/isLoggedIn$}}
```

### 4.5 Iteration

**Syntax:** `{{#items}} ... {{/items}}`

**Semantics:** When the value is an array (or signal of array), renders the block once per item. The context shifts to the current item.

```html
<ul>
  {{#todos$}}
    <li>{{ text$ }}</li>
  {{/todos$}}
</ul>
```

**Iteration helpers** (per item):
- `{{ @index }}` — current index (0-based)
- `{{ @first }}` — boolean, true for first item
- `{{ @last }}` — boolean, true for last item
- `{{ @even }}` / `{{ @odd }}` — boolean flags

```html
{{#items$}}
  <li class="{{#@even}}even{{/@even}}{{#@odd}}odd{{/@odd}}">
    {{ @index }}: {{ . }}
  </li>
{{/items$}}
```

### 4.6 Comments

**Syntax:** `{{! comment }}`

**Semantics:** Ignored during rendering.

```html
{{! This is a template comment }}
```

### 4.7 Partial Templates

**Syntax:** `{{> partialName }}`

**Semantics:** Includes another template. Partial templates inherit the current data context.

```html
{{> header }}
<main>{{ content$ }}</main>
{{> footer }}
```

### 4.8 Event Bindings

**Syntax:** `on:event="{{ handler }}"`

**Semantics:** Binds a DOM event to a signal or function. When the event fires, the handler executes.

```html
<button on:click="{{ increment$ }}">Count: {{ count$ }}</button>
<input on:input="{{ updateSearch$ }}" placeholder="Search...">
```

### 4.9 Attribute Binding

**Syntax:** `attr:name="{{ value }}"` or `:name="{{ value }}"`

**Semantics:** Binds an HTML attribute to a signal value.

```html
<img :src="{{ imageUrl$ }}" :alt="{{ altText$ }}">
<input :disabled="{{ isSubmitting$ }}">
```

### 4.10 Class Binding

**Syntax:** `class:name="{{ condition }}"`

**Semantics:** Toggles a CSS class based on a boolean signal.

```html
<div class:active="{{ isActive$ }}" class:highlight="{{ isHighlighted$ }}">
  Content
</div>
```

### 4.11 Style Binding

**Syntax:** `style:property="{{ value }}"`

**Semantics:** Binds a CSS property to a signal value.

```html
<div style:color="{{ color$ }}" style:font-size="{{ fontSize$ }}px">
  Styled content
</div>
```

---

## 5. Integration with Web Loom Signals

### 5.1 Signal Types

The template engine works with all signal types from `@web-loom/signals-core`:

| Signal Type | Description | Usage in Template |
|-------------|-------------|-------------------|
| `Signal<T>` | Mutable state signal | Read with `.get()`, write via bindings |
| `Computed<T>` | Derived value | Auto-tracks dependencies |
| `ReadonlySignal<T>` | Read-only signal | Read with `.get()` |

### 5.2 Automatic Dependency Tracking

When a template renders and reads a signal via `.get()`, the engine automatically tracks it as a dependency. When that signal changes, only the dependent DOM nodes are updated.

```typescript
import { signal, computed } from '@web-loom/signals-core';

const count = signal(0);
const doubled = computed(() => count.get() * 2);

// In template:
// {{ doubled }} — automatically updates when count changes
```

### 5.3 Integration with MVVM

The template engine is designed to work seamlessly with `@web-loom/mvvm-core`:

```typescript
import { BaseViewModel } from '@web-loom/mvvm-core';
import { signal } from '@web-loom/signals-core';

class UserViewModel extends BaseViewModel {
  name$ = signal('John');
  age$ = signal(30);
  
  // Computed signal from mvvm-core
  get displayName$() {
    return computed(() => `${this.name$.get()} (${this.age$.get()})`);
  }
}
```

```html
<div>
  <h1>{{ displayName$ }}</h1>
  <input :value="{{ name$ }}" on:input="{{ (e) => name$.set(e.target.value) }}">
</div>
```

### 5.4 Effect-Based Rendering

Under the hood, the engine uses `effect` from `@web-loom/signals-core` to schedule and perform DOM updates:

```typescript
import { effect } from '@web-loom/signals-core';

// Simplified rendering mechanism
effect(() => {
  // Track all signals accessed during render
  const html = renderTemplate(template, viewModel);
  updateDOM(html);
});
```

---

## 6. Technical Architecture

### 6.1 Package Structure

```
@web-loom/template-engine/
├── src/
│   ├── compiler/
│   │   ├── parser.ts        # Template → AST
│   │   ├── codegen.ts       # AST → render function
│   │   └── optimizer.ts     # Static analysis & optimization
│   ├── runtime/
│   │   ├── renderer.ts      # Core rendering engine
│   │   ├── bindings.ts      # Signal → DOM binding
│   │   └── scheduler.ts     # Effect scheduling
│   ├── directives/
│   │   ├── conditional.ts   # {{#}} / {{^}}
│   │   ├── iteration.ts     # {{#items}}
│   │   ├── events.ts        # on:event
│   │   ├── attributes.ts    # :attr
│   │   └── classes.ts       # class:name
│   └── index.ts
├── tests/
└── package.json
```

### 6.2 Rendering Pipeline

1. **Parse**: Template string → Abstract Syntax Tree (AST)
2. **Analyze**: Identify static vs. dynamic sections
3. **Optimize**: Pre-compute static HTML, mark reactive boundaries
4. **Generate**: Create render function with signal tracking
5. **Render**: Execute render function within `effect` context
6. **Update**: On signal change, re-execute only affected sections

### 6.3 DOM Update Strategy

The engine uses **fine-grained DOM updates** rather than full re-renders:

1. Each dynamic expression maps to a specific DOM node or attribute
2. Signal changes trigger updates only to those specific nodes
3. Static HTML is never re-rendered

```
Template: <div class="{{ theme$ }}">{{ content$ }}</div>

Static:  <div class="...">...</div>
Dynamic: class="{{ theme$ }}" → updates class attribute
         {{ content$ }}       → updates text node
```

---

## 7. API Reference

### 7.1 Core API

#### `createTemplate(template: string): Template`

Creates a compiled template from a string.

```typescript
import { createTemplate } from '@web-loom/template-engine';

const template = createTemplate(`
  <h1>{{ title$ }}</h1>
  <p>{{ description$ }}</p>
`);
```

#### `template.render(viewModel: object): RenderResult`

Renders the template with a viewModel containing signals.

```typescript
const viewModel = {
  title$: signal('Hello'),
  description$: signal('World')
};

const result = template.render(viewModel);
document.getElementById('app').appendChild(result.element);
```

#### `template.renderToString(viewModel: object): string`

Renders the template to a string (for SSR).

```typescript
const html = template.renderToString(viewModel);
```

#### `template.bind(element: HTMLElement, viewModel: object): Disposable`

Binds a template to an existing DOM element (reactive).

```typescript
const container = document.getElementById('app');
const disposable = template.bind(container, viewModel);

// Cleanup
disposable.dispose();
```

### 7.2 Template Compilation Options

```typescript
interface TemplateOptions {
  /** Delimiters, default: ['{{', '}}'] */
  delimiters?: [string, string];
  /** Auto-escape HTML, default: true */
  escape?: boolean;
  /** Strict mode for missing variables, default: false */
  strict?: boolean;
  /** Custom helpers */
  helpers?: Record<string, Function>;
}
```

### 7.3 Disposable Pattern

Following Web Loom conventions, all reactive bindings implement `IDisposable`:

```typescript
import { Disposable } from '@web-loom/template-engine';

const binding = template.bind(container, viewModel);

// Later, cleanup
binding.dispose();
```

---

## 8. Use Cases & Examples

### 8.1 Counter

```typescript
import { signal } from '@web-loom/signals-core';
import { createTemplate } from '@web-loom/template-engine';

const template = createTemplate(`
  <div>
    <p>Count: {{ count$ }}</p>
    <button on:click="{{ increment$ }}">+1</button>
    <button on:click="{{ reset$ }}">Reset</button>
  </div>
`);

const viewModel = {
  count$: signal(0),
  increment$: () => viewModel.count$.set(viewModel.count$.get() + 1),
  reset$: () => viewModel.count$.set(0)
};

template.bind(document.getElementById('app'), viewModel);
```

### 8.2 Todo List

```typescript
import { signal, computed } from '@web-loom/signals-core';
import { createTemplate } from '@web-loom/template-engine';

const template = createTemplate(`
  <div>
    <input :value="{{ newTodo$ }}" on:keydown.enter="{{ addTodo$ }}">
    <ul>
      {{#todos$}}
        <li>
          <input type="checkbox" :checked="{{ completed$ }}" on:change="{{ toggle$ }}">
          <span class:done="{{ completed$ }}">{{ text$ }}</span>
          <button on:click="{{ remove$ }}">×</button>
        </li>
      {{/todos$}}
    </ul>
    <p>{{ remaining$ }} items remaining</p>
  </div>
`);

const viewModel = {
  todos$: signal([]),
  newTodo$: signal(''),
  
  addTodo$: () => {
    const text = viewModel.newTodo$.get();
    if (text.trim()) {
      viewModel.todos$.set([
        ...viewModel.todos$.get(),
        { id: Date.now(), text, completed: false }
      ]);
      viewModel.newTodo$.set('');
    }
  },
  
  remaining$: computed(() => 
    viewModel.todos$.get().filter(t => !t.completed).length
  )
};
```

### 8.3 Conditional Rendering

```html
{{#isLoading$}}
  <div class="spinner">Loading...</div>
{{/isLoading$}}

{{^isLoading$}}
  {{#error$}}
    <div class="error">{{ error$ }}</div>
  {{/error$}}
  
  {{^error$}}
    <div class="content">{{ data$ }}</div>
  {{/error$}}
{{/isLoading$}}
```

---

## 9. Non-Goals

The following are explicitly **out of scope**:

| Item | Reason |
|------|--------|
| React/Vue/Solid integration | Web Loom libraries are framework-agnostic; this engine is **not** a wrapper for other frameworks |
| Virtual DOM | Signals enable fine-grained updates without VDOM overhead |
| Two-way data binding | Explicit event handlers provide clearer data flow |
| Server-side rendering (primary focus) | Initial focus is client-side; SSR may be added later |
| Legacy browser support | Modern browsers with ES6+ support only |

---

## 10. Performance Considerations

### 10.1 Targets

| Metric | Target |
|--------|--------|
| Initial render time | < 50ms for typical templates |
| Update latency | < 16ms (single frame) |
| Memory overhead | < 100KB per 1000 bindings |
| Bundle size | < 20KB gzipped |

### 10.2 Optimization Strategies

1. **Static analysis**: Identify and pre-render static HTML at compile time
2. **Sparse updates**: Only update DOM nodes whose signals changed
3. **Batched updates**: Coalesce multiple signal changes into a single render pass
4. **Lazy evaluation**: Computed signals only re-evaluate when accessed

---

## 11. Comparison with Alternatives

| Feature | Mustache | Handlebars | This Engine |
|---------|----------|------------|-------------|
| Signal-native | ❌ | ❌ | ✅ |
| Fine-grained updates | ❌ | ❌ | ✅ |
| Familiar syntax | ✅ | ✅ | ✅ |
| Event bindings | ❌ | ❌ | ✅ |
| Attribute binding | ❌ | ❌ | ✅ |
| Class/style binding | ❌ | ❌ | ✅ |
| TC39 Signals integration | ❌ | ❌ | ✅ |
| Web Loom ecosystem | ❌ | ❌ | ✅ |

---

## 12. Roadmap

### Phase 1: Core (v1.0.0)
- [ ] Parser with Mustache-like syntax
- [ ] Signal integration with `@web-loom/signals-core`
- [ ] Variable interpolation (`{{ }}`)
- [ ] Conditional sections (`{{#}}` / `{{^}}`)
- [ ] Iteration (`{{#items}}`)
- [ ] Event bindings (`on:event`)
- [ ] Attribute bindings (`:attr`)
- [ ] Class bindings (`class:name`)
- [ ] Basic DOM update engine

### Phase 2: Advanced (v1.1.0)
- [ ] Partial templates
- [ ] Custom helpers
- [ ] Style bindings (`style:property`)
- [ ] Template inheritance
- [ ] Optimized compilation (static analysis)

### Phase 3: Production (v2.0.0)
- [ ] Server-side rendering
- [ ] Template pre-compilation (build-time)
- [ ] DevTools integration
- [ ] Full test suite
- [ ] Documentation and examples

---

## 13. Success Criteria

The template engine is considered successful when:

1. **Performance**: Outperforms traditional template engines in signal-heavy applications
2. **Adoption**: Used as the primary rendering engine in Web Loom applications
3. **Developer Experience**: Frontend engineers can start using it within minutes due to familiar syntax
4. **Integration**: Works seamlessly with `@web-loom/mvvm-core` and other Web Loom packages
5. **Bundle Size**: Remains lightweight (< 20KB gzipped)

---

## 14. Appendix

### A. TC39 Signals Proposal Reference

The TC39 Signals proposal defines:

- **Signal**: A reactive value that can be read and tracked
- **State**: Mutable signal with `.set()` and `.get()`
- **Computed**: Derived signal that auto-tracks dependencies
- **Watcher**: Observes signal changes

The proposal is at **Stage 1** and is designed for **framework authors to build on top of**.

### B. Web Loom Signals Core Reference

`@web-loom/signals-core` provides:

- `signal(value)` — creates a mutable signal
- `computed(fn)` — creates a derived signal
- `effect(fn)` — runs a side effect that auto-tracks dependencies
- `observe(sig, fn)` — observes a signal with immediate value delivery

Reactive properties in Web Loom use the `$` suffix convention.

### C. Glossary

| Term | Definition |
|------|------------|
| **Signal** | A reactive container for a value that can change over time |
| **Computed** | A derived signal that automatically updates when dependencies change |
| **Effect** | A side effect that re-runs when tracked signals change |
| **Mustache** | A logic-less template syntax using `{{ }}` delimiters |
| **Fine-grained update** | Updating only the specific DOM nodes that depend on changed data |

---

*This document is a living specification and will evolve as the template engine is developed and refined.*