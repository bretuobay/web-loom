# Template context typing (M5 / P5-c spike)

**Status:** Go for export-only context typing · **No-go** for expression-path checking

## What shipped (v1)

- `declareContext<TContext>()` — factory whose `compile()` / `fromPrecompiled()` return `Template<TContext>`
- `PartialContexts<TPartials>` — type alias for partial name → context map; checked via `compile<TPartials>()`
- `typedCompile` / `typedFromPrecompiled` — shorthand aliases
- `HelperMap`, `TypedPartialsMap`, `TypedTemplateCompileOptions` — option typing helpers

These type **only the object passed to** `mount()`, `hydrate()`, `render()`, `renderToString()`, and
`outlet.show()`. They use TypeScript generics already present on `Template<TVm>` since Phase 1.

## Go / no-go: expression-path checking

**Decision: no-go** for shallow `{{ path }}` → declared context property checking in v1 (and no
scheduled follow-up unless requirements change).

### Why no-go

1. **Runtime model** — Expressions are strings evaluated by a hand-rolled parser (PRD §6.7), not
   JavaScript. Property access walks scope at runtime with signal unwrapping at any segment. A
   static checker would duplicate that semantics or produce false positives/negatives.

2. **Scope is contextual** — `{{ name }}` inside `{{#each items key=id}}` refers to the item;
   `../catalog.title` crosses scopes; partials inherit parent scope. Typing paths requires a full
   scope-aware analysis pass — explicitly out of scope per PRD (“deep static JavaScript type analysis
   is out of scope”).

3. **ViewModel vs DTO binding** — The `cart.items` silent-empty bug documented in README § “Binding a
   ViewModel vs. binding a DTO snapshot” happens because templates read whatever the ViewModel
   _exposes_, not the underlying DTO shape. Expression checking against `declareContext<T>` would
   imply false safety unless `T` mirrors every path templates use — which is the same manual work as
   today, but with a type checker that cannot see runtime signal shapes.

4. **Cost / benefit** — Meaningful path checking needs either:
   - a template-language server (LSP) with scope simulation, or
   - a constrained template DSL with explicit field declarations per block (new grammar — rejected).

   Neither fits the “additive, export-only typing” bar for M5.

### What we recommend instead

| Problem                                    | Tool                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| Wrong object at mount site                 | `declareContext<T>()` (this spike)                                             |
| Syntax / modifier / partial name errors    | `@web-loom/template-core-lint` + `analyzeTemplate()`                           |
| Missing ViewModel fields used in templates | DOM tests + explicit bindings adapter review                                   |
| Partial name drift                         | ESLint `settings.template-core.partials` + `PartialContexts<T>` on `compile()` |

## Future reconsideration triggers

Revisit expression-path checking only if:

- a `.loom` file format with explicit per-block context declarations ships (Phase 5 P5-b), **and**
- real usage shows `declareContext` alone leaves a gap ESLint cannot cover, **and**
- a scoped analysis design is written that handles `each`, partials, and `../` without forking grammar.

Until then, document the limitation prominently and do not imply TypeScript context typing validates
template strings.
