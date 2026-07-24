# Product Requirements Document (PRD)

## Web Loom Reactive Template Engine (Codename: Loom Templates)

**Status:** Draft v1.0
**Project:** Web Loom Framework
**Target Repository:** Web Loom Ecosystem
**Audience:** Framework Architects, Library Authors, Contributors

---

# 1. Executive Summary

The Web Loom ecosystem provides framework-agnostic primitives (signals, models, view models, services, etc.) that can integrate with React, Vue, Solid, Angular and other UI frameworks.

However, modern frontend rendering has become increasingly coupled to framework-specific JSX/TSX compilers or runtime Virtual DOM implementations.

This project introduces a **native reactive template engine** built specifically for **Signals**, following the direction of the TC39 Signals proposal.

Instead of treating signals as an adapter into another framework, rendering itself becomes signal-aware.

The goal is **not** to compete with React, Vue or Solid.

The goal is to provide:

* a lightweight rendering layer
* native DOM rendering
* zero Virtual DOM
* automatic dependency tracking
* signal-first templates
* framework-independent rendering

The template engine becomes the default rendering technology inside Web Loom while every other package remains framework agnostic.

---

# 2. Vision

Create the equivalent of Mustache or Handlebars for the Signal era.

Instead of rendering static data,

```mustache
{{user.name}}
```

the engine understands reactive values.

When a signal changes, only the DOM nodes depending on that signal update automatically.

No component rerenders.

No reconciliation.

No Virtual DOM.

No diffing.

Just dependency-driven DOM updates.

---

# 3. Goals

## Primary Goals

Build a template engine that

* feels familiar to frontend developers
* uses Mustache-like syntax
* understands Signals natively
* automatically subscribes to signals
* updates only affected DOM nodes
* supports nested templates
* supports reusable components
* works entirely with Web Loom Signals
* requires no compiler
* works directly in JavaScript/TypeScript

---

## Secondary Goals

Support

* SSR
* hydration
* template caching
* partials
* reusable layouts
* keyed iteration
* fragments
* slots
* directives
* async signals

---

# 4. Non Goals

The engine is **not**

* another frontend framework
* a React replacement
* JSX replacement
* Virtual DOM implementation
* component runtime
* compiler
* CSS solution
* router
* state management library

Those belong elsewhere in Web Loom.

---

# 5. Design Philosophy

## Signal First

Everything revolves around Signals.

Templates never observe plain objects.

Reactive values are Signals.

Example

```typescript
const vm = {
    firstName: signal("John"),
    age: signal(30)
}
```

Template

```html
<p>{{firstName}}</p>
```

Changing

```typescript
vm.firstName.set("Alice")
```

automatically updates

```
John
```

to

```
Alice
```

without rerendering the parent.

---

## No Components Required

Components are optional.

Templates can render plain view models.

```typescript
render(template, vm)
```

No lifecycle.

No hooks.

No rerender.

---

## HTML First

Templates remain valid HTML whenever possible.

Avoid inventing a new language.

---

## Familiar Syntax

Developers coming from

* Mustache
* Handlebars
* Vue
* Angular
* JSX

should immediately understand templates.

---

# 6. Architecture

```
View Model (Signals)

        │

        ▼

Reactive Template Parser

        │

        ▼

Dependency Graph

        │

        ▼

DOM Renderer

        │

        ▼

Native Browser DOM
```

---

# 7. Core Concepts

## Template

```html
<h1>{{title}}</h1>
```

---

## Signal

```typescript
title = signal("Hello")
```

---

## Binding

```html
{{title}}
```

creates

```
DOM Text Node

↓

Signal Subscription

↓

Automatic Updates
```

---

## Effect

Internally

```
effect(() =>

textNode.textContent = title.get()

)
```

---

# 8. Template Syntax

## Text Binding

```html
{{title}}
```

---

## HTML Binding

```html
{{{content}}}
```

Equivalent to trusted HTML.

---

## Attribute Binding

```html
<img src="{{photo}}">
```

---

## Boolean Attributes

```html
<input disabled="{{isDisabled}}">
```

---

## Class Binding

```html
<div class="{{status}}">
```

---

## Multiple Classes

```html
<div class="card {{theme}}">
```

---

## Style Binding

```html
<div style="color: {{color}}">
```

---

# 9. Conditional Rendering

Mustache-inspired

```html
{{#if isLoggedIn}}

Welcome

{{/if}}
```

Else

```html
{{#if isLoggedIn}}

Welcome

{{else}}

Login

{{/if}}
```

---

# 10. Switch

```html
{{#switch status}}

{{#case "loading"}}

Loading...

{{/case}}

{{#case "success"}}

Done

{{/case}}

{{/switch}}
```

---

# 11. Loops

```html
<ul>

{{#each users}}

<li>{{name}}</li>

{{/each}}

</ul>
```

---

Keyed iteration

```html
{{#each users key=id}}

...
```

---

# 12. Nested Context

```html
{{user.name}}
```

---

Current item

```html
{{this}}
```

---

Parent

```html
{{../title}}
```

---

# 13. Reactive Expressions

Support simple expressions.

```html
{{firstName + " " + lastName}}
```

or

```html
{{count * price}}
```

The parser should track dependencies automatically.

---

# 14. Derived Signals

```typescript
fullName = computed(() => ...)
```

Template

```html
{{fullName}}
```

---

# 15. Event Binding

```html
<button @click="save">
```

Equivalent

```typescript
vm.save()
```

---

Arguments

```html
<button @click="remove(item)">
```

---

# 16. Two-way Binding

Optional.

```html
<input bind:value="name">
```

Internally

```
Signal ↔ Input
```

---

# 17. Reusable Templates

```html
{{> header}}
```

---

Parameters

```html
{{> card user}}
```

---

# 18. Slots

```html
<layout>

{{#slot content}}

...

{{/slot}}

</layout>
```

---

# 19. Async Signals

```typescript
user = asyncSignal(...)
```

Template

```html
{{#await user}}

Loading...

{{then}}

{{name}}

{{catch}}

Failed

{{/await}}
```

---

# 20. DOM Update Strategy

The renderer should never rerender the entire tree.

Instead

```
Signal

↓

Subscribers

↓

Exact DOM Node

↓

Update
```

Granularity is individual DOM nodes.

---

# 21. Dependency Tracking

Each binding creates an effect.

```
{{title}}

↓

effect()

↓

title

↓

Text Node
```

If

```
age
```

changes,

```
title
```

is unaffected.

---

# 22. Parser

Phases

```
Lexer

↓

Parser

↓

AST

↓

Template Graph

↓

Renderer
```

---

# 23. Renderer

Responsibilities

* create DOM nodes
* subscribe to signals
* cleanup
* keyed diff for collections
* event delegation
* hydration

---

# 24. Template Compilation

Runtime parsing is acceptable.

Optional build step later.

```
Template

↓

AST

↓

Cached Template

↓

Fast Instantiation
```

---

# 25. Memory Management

When nodes disappear

```
unsubscribe()

↓

remove effects

↓

free DOM references
```

Automatic cleanup is required.

---

# 26. Performance Goals

* Zero Virtual DOM
* O(1) signal updates
* No component rerender
* Fine-grained subscriptions
* Lazy effects
* Incremental DOM mutation
* Efficient keyed list reconciliation

---

# 27. Security

Escape HTML by default.

```
{{value}}
```

Safe.

Only

```
{{{html}}}
```

renders raw HTML and should require explicit opt-in, ideally accepting only trusted or sanitized content.

---

# 28. Public API

```typescript
const template = compile(html)

const view = template.render(vm)

container.append(view)
```

or

```typescript
render(template, vm, container)
```

---

# 29. Example

```typescript
const vm = {

    title: signal("Todos"),

    todos: signal([

        { id:1, text:"Milk" },

        { id:2, text:"Coffee" }

    ])

}
```

Template

```html
<h1>{{title}}</h1>

<ul>

{{#each todos key=id}}

<li>{{text}}</li>

{{/each}}

</ul>
```

Updating

```typescript
vm.todos.update(...)
```

should only insert, remove, or reorder the affected `<li>` elements, preserving existing DOM nodes where possible.

---

# 30. Future Enhancements

* Streaming SSR
* Partial hydration
* Islands architecture
* Suspense
* Portals
* Animation directives
* Template macros
* Custom directives
* Internationalization helpers
* Accessibility directives
* DevTools integration
* Source maps for template debugging
* Static analysis and linting

---

# 31. Success Criteria

The template engine will be considered successful when it:

* Makes Web Loom applications possible without requiring React, Vue, Solid, or another UI framework.
* Delivers fine-grained DOM updates driven directly by Web Loom Signals.
* Provides a familiar, declarative syntax that frontend developers can learn quickly.
* Maintains framework independence while integrating seamlessly with the broader Web Loom ecosystem.
* Supports server-side rendering and hydration without changing the authoring model.
* Establishes a stable rendering foundation upon which higher-level Web Loom packages (routing, components, layouts, forms, etc.) can be built.

## 32. Alignment with TC39 Signals

The implementation should align closely with the direction of the TC39 Signals proposal rather than introducing its own reactive primitives. Where possible, it should consume standard signal interfaces (`Signal`, writable signals, computed signals, and effects) exposed by **Web Loom Signals Core**, allowing the renderer to evolve alongside the JavaScript standard.

This positions the template engine as a thin rendering layer over standardized reactivity rather than a framework-specific runtime, ensuring longevity and interoperability as the Signals proposal matures.
