Got it! Since the focus is **exclusively on WebLoom** and its **Signals Core** ecosystem—with no direct dependency on React, Vue, or other frameworks—we can refine the PRD to emphasize **native integration with WebLoom’s Signals** while ensuring the template engine is **optimized for Signals-based reactivity**.

Here’s the **revised PRD** with a **WebLoom-first approach**:

---

---

# **Product Requirements Document (PRD)**
**WebLoom Signals-Native Template Engine**
**Version:** 1.0
**Date:** July 23, 2026
**Author:** Festus Yeboah
**Organization:** Festus Yeboah

---

## **1. Overview**
### **1.1 Purpose**
This document defines the requirements for a **Signals-native template engine** designed **exclusively for WebLoom**, leveraging the [TC39 Signals Proposal](https://github.com/tc39/proposal-signals) and [WebLoom’s Signals Core](https://webloomframework.com/docs/signals-core). The engine will:
- Use a **familiar, Mustache-like syntax** for frontend engineers.
- **Directly integrate with WebLoom’s Signals** for reactivity.
- **Eliminate unnecessary re-renders** by tracking Signal dependencies.
- **Remain framework-agnostic** (only WebLoom is the target).

### **1.2 Goals**
| Goal | Description |
|------|-------------|
| **Signals-First** | Templates are **natively reactive** to WebLoom Signals. |
| **Familiar Syntax** | Mustache-like (or similar) for easy adoption. |
| **Zero Framework Lock-in** | Works **only with WebLoom**, but doesn’t depend on React/Vue/etc. |
| **Performance** | Minimal DOM updates, **only when Signals change**. |
| **Extensible** | Supports **custom directives** for WebLoom-specific use cases. |

### **1.3 Non-Goals**
- Supporting React/Vue/SolidJS directly (only WebLoom).
- Replacing WebLoom’s existing rendering mechanisms.
- Being a general-purpose templating engine (optimized for Signals).

---

## **2. Background & Motivation**
### **2.1 Why a WebLoom-Specific Template Engine?**
- **WebLoom already uses Signals** for state management.
- **Existing templating engines** (Mustache, JSX) are **not Signals-aware**.
- A **native engine** can **minimize overhead** and **maximize reactivity**.

### **2.2 Key Differentiators**
| Feature | Traditional Engines (Mustache/JSX) | WebLoom Signals Engine |
|---------|--------------------------------------|-------------------------|
| **Reactivity** | Manual (e.g., `useEffect`, `watch`) | **Automatic (Signals-based)** |
| **Syntax** | Generic | **Optimized for Signals** |
| **Performance** | Full re-renders or VDOM diffing | **Fine-grained updates** |
| **Integration** | Framework-agnostic (but generic) | **WebLoom-native** |

---

## **3. Target Audience**
- **WebLoom developers** building reactive UIs.
- **Frontend engineers** familiar with Mustache/Handlebars.
- **Teams using WebLoom’s Signals Core** for state management.

---

## **4. Core Requirements**
### **4.1 Syntax Design**
- **Mustache-like** (default) or **custom syntax** (if more Signals-friendly).
- **Signal-aware interpolation** (e.g., `{{ signal.value }}`).
- **Directives for reactivity** (e.g., `{{#signal}}...{{/signal}}`).

#### **Example Syntax:**
```html
<!-- Basic Signal interpolation -->
<div>{{ user.name }}</div>

<!-- Conditional rendering (reacts to Signal changes) -->
{{#if user.isActive}}
  <span>Active</span>
{{/if}}

<!-- Signal-scoped block (auto-subscribes to Signal changes) -->
<div>{{#signal counter}}
  Current: {{ counter.value }}
{{/signal}}</div>

<!-- Loop over a Signal array -->
<ul>
  {{#each items}}
    <li>{{ name }}</li>
  {{/each}}
</ul>
```

### **4.2 Reactivity Model**
- **Automatic dependency tracking** (via WebLoom Signals).
- **No manual subscriptions** (engine handles Signal reactivity).
- **Computed Signals** (e.g., `{{ computedSignal.value }}`).
- **Lazy evaluation** (only updates when Signals change).

### **4.3 Performance**
- **No virtual DOM** (direct DOM updates).
- **Minimal re-renders** (only affected nodes).
- **Benchmark against WebLoom’s current rendering**.

### **4.4 Integration with WebLoom**
- **Works with `signals-core`** (no additional dependencies).
- **Compiler optimizations** for WebLoom’s Signals.
- **TypeScript support** (type-safe Signals in templates).

---
## **5. Technical Specifications**
### **5.1 Core Features**
| Feature | Description | Priority |
|---------|------------|----------|
| **Mustache-like syntax** | Familiar templating | High |
| **Signal interpolation** | `{{ signal.value }}` | High |
| **Conditional rendering** | `{{#if signal}}...{{/if}}` | High |
| **Loops** | `{{#each signalArray}}...{{/each}}` | High |
| **Signal-scoped blocks** | `{{#signal}}...{{/signal}}` | High |
| **Computed Signals** | `{{ computedSignal.value }}` | Medium |
| **Custom directives** | Extensible (e.g., `{{#effect}}`) | Medium |
| **TypeScript support** | Type-safe Signals | Medium |

### **5.2 Architecture**
1. **Parser**
   - Converts templates into an **Abstract Syntax Tree (AST)**.
   - Identifies **Signal references** (`{{ signal.value }}`).

2. **Compiler**
   - Generates **optimized JavaScript** that subscribes to Signals.
   - Outputs **WebLoom-compatible** rendering code.

3. **Runtime**
   - **Subscribes to Signals** and updates DOM **only when needed**.
   - **Handles cleanup** (unsubscribes when templates are removed).

### **5.3 Dependencies**
- **WebLoom Signals Core** (required).
- **TC39 Signals Polyfill** (if not natively supported).

---
## **6. Implementation Phases**
### **Phase 1: MVP (Signals-Native Templating)**
- Basic interpolation (`{{ signal.value }}`).
- Conditional rendering (`{{#if signal}}`).
- Signal-scoped blocks (`{{#signal}}...{{/signal}}`).
- Works with **WebLoom’s Signals Core**.

### **Phase 2: Advanced Features**
- Loops (`{{#each signalArray}}`).
- Computed Signals (`{{ computedSignal.value }}`).
- Custom directives (e.g., `{{#effect}}` for side effects).
- **Performance optimizations** (e.g., batching DOM updates).

### **Phase 3: Developer Experience**
- **VS Code extension** (syntax highlighting, autocompletion).
- **TypeScript support** (type-safe Signals in templates).
- **Documentation & benchmarks**.

---
## **7. Success Metrics**
| Metric | Target |
|--------|--------|
| **Adoption** | 80% of WebLoom users migrate to the engine within 6 months. |
| **Performance** | 2x faster than WebLoom’s current rendering for Signal updates. |
| **DX Satisfaction** | 90% of developers find the syntax intuitive (survey). |

---
## **8. Open Questions**
1. **Syntax Choice:**
   - Should we **extend Mustache** or **create a new syntax** optimized for Signals?
   - Example: `{{ signal.value }}` vs. `{{ $signal }}` (shorthand for Signals).

2. **Compiler vs. Runtime:**
   - Should templates be **pre-compiled** (for production) or **interpreted at runtime** (for dev)?

3. **Error Handling:**
   - How should the engine handle **missing Signals** or **circular dependencies**?

4. **Debugging:**
   - Should we add **devtools integration** for Signal tracking?

---
## **9. Risks & Mitigations**
| Risk | Mitigation |
|------|------------|
| **Syntax conflicts** | Validate with WebLoom community before finalizing. |
| **Performance overhead** | Profile early, optimize compiler output. |
| **Adoption resistance** | Provide **migration guides** from Mustache/JSX. |

---
## **10. Next Steps**
1. **Finalize syntax** (Mustache-like vs. custom).
2. **Prototype parser** (handles `{{ signal.value }}`).
3. **Integrate with WebLoom Signals Core**.
4. **Benchmark** against current WebLoom rendering.

---
### **Feedback Request**
- **Syntax preference:** Mustache-like or a **new Signals-optimized syntax**?
- **Compiler vs. runtime:** Should we **pre-compile** templates?
- **Custom directives:** Are there **WebLoom-specific** use cases we should support? (e.g., `{{#effect}}` for side effects)