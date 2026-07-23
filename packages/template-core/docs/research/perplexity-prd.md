Below is a PRD for a **signal-first template engine** designed for Web Loom’s native reactive rendering layer, with a familiar template syntax inspired by Mustache but adapted for signals and fine-grained updates. Web Loom already positions Signals Core as zero-dependency reactive primitives with push-based state and no virtual DOM, which makes a dedicated template engine a strong fit for its MVVM direction. [webloomframework](https://webloomframework.com/)

# Product Requirements Document

## Product name
**Loom Templates** — a native template engine for Web Loom’s signal-driven rendering system.

## Product vision
Build a lightweight, framework-agnostic template engine that treats **signals as first-class view inputs** and updates only the parts of the DOM that depend on changed signal values. The engine should feel familiar to frontend engineers coming from Mustache-style templates, while being optimized for Web Loom’s Signals Core and MVVM architecture. [github](https://github.com/bretuobay/web-loom/pulls)

## Problem statement
Modern frontend frameworks increasingly use signals or signal-like primitives to model UI state, and the TC39 proposal aims to standardize signals as a language-level reactive primitive. Today, many templating approaches were designed for component rerendering or virtual DOM diffing, not for fine-grained signal subscriptions, which creates unnecessary overhead and awkward APIs for signal-first apps. [ecmascript-daily.github](https://ecmascript-daily.github.io/2024/04/17/tc39-proposal-signals-a-proposal-to-add-signals-to-javascript)

## Goals
- Provide a **native template engine** for Web Loom that is built around signals, not adapted from VDOM patterns. [webloomframework](https://webloomframework.com/)
- Support a **familiar syntax** that frontend engineers can read quickly, with Mustache-like interpolation and sections.
- Enable **fine-grained DOM updates** tied to individual signal dependencies.
- Work cleanly with Web Loom Signals Core and its MVVM pattern, while remaining usable across Web Loom’s broader ecosystem. [github](https://github.com/bretuobay/web-loom/pulls)
- Keep the runtime small, dependency-light, and suitable for modern web apps.

## Non-goals
- Building a general-purpose React/Vue/Solid template layer.
- Replacing Web Loom’s framework-agnostic libraries.
- Implementing a virtual DOM.
- Designing a full component framework.
- Matching the full flexibility of JSX or handwritten render functions.

## Target users
- Frontend engineers using Web Loom who want declarative rendering with signals.
- Teams building MVVM-style apps that need predictable, granular UI updates.
- Developers migrating from template-driven UI systems who want a familiar mental model.

## Core principles
- **Signal-first:** templates subscribe to signals directly.
- **Granular:** only affected text nodes, attributes, or blocks update.
- **Familiar:** syntax should resemble Mustache/Handlebars enough to reduce learning friction.
- **Explicit:** avoid hidden magic; keep data flow easy to trace.
- **Composable:** support partials, conditional blocks, loops, and slots in a controlled way.
- **Portable:** integrate with Web Loom, but not with framework-specific assumptions.

## Proposed syntax
A Mustache-like syntax is the best starting point because it is already familiar and simple, but it should be extended for signal-native behavior.

### Suggested syntax example
```html
<div class="profile">
  <h1>{{ user.name }}</h1>

  {{#if user.online}}
    <span class="status online">Online</span>
  {{else}}
    <span class="status offline">Offline</span>
  {{/if}}

  <ul>
    {{#each messages}}
      <li>{{ text }}</li>
    {{/each}}
  </ul>
</div>
```

### Signal-aware behavior
- `user.name` can be a plain value or a signal-backed value.
- If `user` or `user.name` is a signal, the engine subscribes to the relevant dependency automatically.
- `each` should efficiently update keyed lists when signal arrays change.
- `if` blocks should subscribe only to the condition and the branch dependencies currently active.

## Functional requirements

### Rendering
- Render templates to DOM nodes from a compiled template function.
- Support text interpolation, attributes, boolean attributes, and event handlers.
- Update only the DOM subparts impacted by signal changes.
- Preserve DOM nodes where possible to avoid unnecessary teardown.

### Data binding
- Accept plain objects, signal objects, computed signals, and nested reactive structures.
- Resolve nested paths like `user.profile.name`.
- Track dependencies automatically during rendering and re-render only affected bindings.

### Control flow
- Support conditionals: `if / else if / else`.
- Support iteration: `each` with optional keying.
- Support partials/fragments.
- Support scoped local variables inside blocks.

### Template composition
- Support reusable partials and slot-like insertion points.
- Allow template compilation from strings, tagged templates, or precompiled artifacts.
- Expose a programmatic API for custom directives or helpers.

### Event handling
- Support declarative events like `on:click="save"` or equivalent signal-safe handler syntax.
- Avoid binding patterns that conflict with reactive updates.

### Debuggability
- Provide source maps or template location metadata in development mode.
- Expose dependency inspection to help developers understand what a template subscribes to.
- Warn on invalid expressions, missing keys, or unstable list identity in dev mode.

## Recommended API shape
A clean API could look like this:

```ts
const template = loomTemplate`
  <button on:click=${save}>{{ label }}</button>
`;

template.render({
  label: signal("Save"),
  save() {
    // ...
  }
});
```

Or, if you want an even more familiar declaration style:

```html
<template loom>
  <button on:click="save">{{ label }}</button>
</template>
```

My recommendation is to support **both**:
- a string/tagged-template API for ergonomics,
- and a precompiled template format for production performance.

## Syntax options
Here are three viable syntax directions:

| Option | Example | Pros | Cons |
|---|---|---|---|
| Mustache-like | `{{ user.name }}` | Familiar, minimal learning curve | Less expressive for advanced logic |
| Handlebars-like | `{{#if cond}}...{{/if}}` | Good control flow and readability | Slightly heavier syntax |
| Signal-native hybrid | `{{name}}`, `{{#when signal}}` | Optimized for reactivity | Requires new conventions |

**Best choice:** a **Handlebars-inspired subset** with signal-native semantics, because it balances familiarity and structural clarity.

## Performance requirements
- Initial render should be fast for small and medium templates.
- Updates should be O(changed bindings), not O(template size).
- List diffing should support keyed reconciliation.
- Compiled templates should minimize runtime parsing.
- Memory usage should remain low enough for broad client-side usage.

## Architecture requirements
- Parser: converts template source into an AST.
- Compiler: turns AST into efficient render instructions.
- Runtime: subscribes to signals, applies DOM patches, manages cleanup.
- Dependency tracker: identifies which signal reads each binding depends on.
- List reconciler: handles keyed and unkeyed loops.
- Dev tooling hooks: diagnostics, warnings, and template introspection.

## Integration with Web Loom
The engine should be the native rendering layer for Web Loom’s signal core, not a replacement for the framework-agnostic ecosystem. That means: [webloomframework](https://webloomframework.com/)
- Web Loom Signals Core remains the source of truth for reactivity.
- The template engine consumes those signals directly.
- Other Web Loom libraries can remain usable independently.
- The template engine should align with Web Loom’s MVVM positioning and headless ecosystem. [github](https://github.com/bretuobay/web-loom/pulls)

## Risks
- Template syntax may become too complex if too many special cases are added.
- Reactive dependency tracking can become difficult to debug if expressions are overly dynamic.
- If the syntax deviates too far from Mustache/Handlebars, adoption may suffer.
- If it is too close to framework-specific templating, the “native Web Loom” identity may be weakened.

## Success metrics
- Time to first render.
- Update latency for single-signal changes.
- Size of runtime bundle.
- Number of DOM nodes patched per update.
- Developer adoption within Web Loom projects.
- Template authoring satisfaction in internal dogfooding.

## Milestones
1. **MVP parser and renderer.**
   - Interpolation.
   - Attribute binding.
   - Conditionals.
   - Loops.

2. **Signal integration.**
   - Automatic dependency tracking.
   - Fine-grained updates.
   - Cleanup and disposal semantics.

3. **Developer experience.**
   - Better errors.
   - Dev mode inspection.
   - Template source mapping.

4. **Advanced composition.**
   - Partials.
   - Slots.
   - Custom directives.

5. **Production hardening.**
   - Keyed reconciliation.
   - SSR-friendly output if needed.
   - Benchmarking and bundle optimization.

## Recommended positioning
Position this as **“the native reactive template engine for Web Loom Signals Core”** rather than a generic alternative to React/Vue/Solid. That framing matches your stated product strategy and aligns with the broader movement toward signal-based UI primitives described in the TC39 proposal context. [ishu](https://ishu.dev/post/javascript-signals-tc39-native-reactivity-2026-04-09)

## Suggested name alternatives
- Loom Templates
- Signal Loom
- Loom Render
- Loom Markup
- Reactive Loom

## Final recommendation
Use a **Mustache/Handlebars-inspired syntax** with explicit signal-native semantics. It gives frontend engineers instant familiarity while still being optimized for Web Loom’s signal core and fine-grained rendering model. [webloomframework](https://webloomframework.com/)

Would you like me to turn this into a more formal PRD format with sections like scope, user stories, acceptance criteria, and launch plan?