# Template Core Phase 2 Design

The parser preprocesses block syntax into HTML comments and records stable node paths. `switch`
and partials are block records with comment anchors. Branch changes dispose the old child bag before
instantiating the new blueprint. Binding records represent generated control property/event work,
event options, and actions. Partial templates compile lazily and cache by source; a merged render
context carries local/global registries and a bounded expansion depth. Effects, listeners, and
action cleanup all register with the owning disposal bag.
