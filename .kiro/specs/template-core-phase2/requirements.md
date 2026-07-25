# Template Core Phase 2 Requirements

Phase 1 behavior is the compatibility baseline. Phase 2 adds strict-equality `switch` branches,
`bind:value`/`bind:checked`, chainable event modifiers, `use:` actions, and local/global named
partials. Active branches alone own effects and DOM; every nested view, listener, action cleanup,
and partial is owned by a `DisposalBag`. Local partials override global registrations, explicit
partial contexts retain parent scope access, and missing/recursive partials fail safely. SSR,
hydration, precompilation, and expanded diagnostics are deferred to Phase 3.
