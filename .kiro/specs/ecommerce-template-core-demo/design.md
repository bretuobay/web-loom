# Ecommerce Template-Core Demo Design

## Application Boundary

`apps/ecommerce-template-core` is a sibling Vite app. Its domain/infrastructure source is copied from `apps/ecommerce-mvvm` so both demos remain independently runnable and can be compared without an app-to-app dependency. React components and React-only hooks are not copied.

## View Boundary

`TemplateAppViewModel` composes the existing catalog and cart view-models and exposes the non-signal behavior required by templates as signals and explicit actions. The coordinator is split into focused modules:

- `state.ts` owns render-facing transient state: route, cart drawer, palette, confirmation, toast, and checkout mirrors.
- `actions.ts` owns domain/UI commands and action cleanup.
- `palette.ts` owns command-palette command registration.
- `subscriptions.ts` owns router, store, form, notification, confirmation, app-bus, keyboard, and link subscriptions.
- `view.ts` owns mounting persistent shell views and replacing the route view.
- `bindings.ts` adapts template-core DOM events into typed action calls; it is the only app-layer module that knows about browser event/element APIs.

`@web-loom/store-core` persists the durable preference (`theme`) through `ui-store.ts`; signals remain the clearer representation for ephemeral UI state. Catalog/cart domain operations remain in the copied models/view-models. The application ViewModel owns the injected models and disposes both models and child ViewModels together.

## Routing and Lifecycle

`@web-loom/router-core` provides history-mode routes for `/`, `/checkout`, and a fallback route. A delegated same-origin anchor listener calls `router.push()` and preserves modified/external links. Router changes update a signal consumed by the mounted template. Cleanup destroys the router, coordinator subscriptions, palette behavior, models, and mounted template.

## Template Organization

Templates are split by visual ownership under `src/templates/`: shell, header, storefront, checkout, cart drawer, command palette, confirmation dialog, toast, and not-found. Each module owns one compiled template. `TemplateAppView` mounts persistent templates into shell slots and mounts only the active route template, so route changes do not require one monolithic compiled tree.

This is intentionally an application-level composition pattern: template-core Phase 1 has no partial/include primitive, so reusable pieces are composed by independent `compile()`/`mount()` calls. Templates use Phase 1 interpolation, `if/else`, keyed `each`, property/attribute/class bindings, and event bindings. Form controls use explicit coordinator adapters because Phase 1 has no `bind:` or event modifiers.

Phase 1 call expressions accept a single identifier as the callee. Argument-bearing DOM handlers therefore use flat root adapters such as `addToCart`, `updateQuantity`, and `setCheckoutEmailFromEvent`; no-argument behavior can still use dotted paths such as `actions.openCart`. This keeps templates readable while isolating DOM/event-shape knowledge at the view-model boundary.

## Repository Integration

Add `@web-loom/template-core` to the Vite workspace alias registry and add the new app/package metadata, Vite config, TypeScript config, test setup, entry point, composed view-model/view modules, split templates, and integration tests.
