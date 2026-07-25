# Template Core Phase 3 Design

## Architecture

The current DOM-first parser is split into a shared logical plan and target-specific consumers.
The plan contains serializable element/text/comment nodes, directive records, nested block plans,
source metadata, and deterministic hydration marker IDs. The browser consumer creates DOM blueprints;
the SSR consumer serializes the same plan; hydration walks existing marker-bearing DOM.

The Node compiler/SSR entrypoints use `parse5`. The normal browser entrypoint does not import the
Node parser. Existing signal evaluation remains the single expression semantics implementation.

## Public API

```ts
interface Template<TVm extends object = object> {
  mount(container: Element, viewModel: TVm): Disposable;
  render(viewModel: TVm): RenderedTemplate;
  hydrate(container: Element, viewModel: TVm): Disposable;
  renderToString(viewModel: TVm): string;
}

interface PrecompileOptions {
  name?: string;
  sourcePath?: string;
}

function precompile(source: string, options?: PrecompileOptions): PrecompiledTemplateModule;
```

The compiler and SSR implementations are exposed from dedicated subpaths. Hydration warnings use
the existing diagnostics callbacks, default to warning-and-recovery, and include source/marker
metadata.

## SSR and hydration markers

Dynamic blocks emit deterministic start/end markers derived from plan paths. SSR renders active
content between those markers. Hydration uses them to attach existing nodes, while mismatch recovery
removes and remounts the smallest region whose marker contract is invalid.

## Precompiled modules

The precompiler serializes plans and source metadata. The CLI emits ES modules that import the
runtime plan factory. It does not emit implementation-specific render functions, keeping browser,
SSR, and hydration consumers on one runtime contract.

## Lifecycle and safety

SSR never creates effects, listeners, or actions. Hydrated effects/listeners/actions are owned by
the returned Disposable. Raw HTML remains an explicit opt-in. Event/action directives are omitted
from SSR output. Recursive partial stacks and strict diagnostics prevent silent production failures.
