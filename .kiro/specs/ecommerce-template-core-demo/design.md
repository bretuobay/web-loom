# Ecommerce Template-Core Demo Design

## Application Boundary

`apps/ecommerce-template-core` is a sibling Vite app. Its domain/infrastructure source is copied from `apps/ecommerce-mvvm` so both demos remain independently runnable and can be compared without an app-to-app dependency. React components and React-only hooks are not copied.

## View Boundary

`TemplateAppViewModel` composes the existing catalog and cart view-models and exposes the non-signal behavior required by templates as signals and explicit actions:

- route, theme, cart drawer, palette, confirmation, and toast state
- checkout form values and errors mirrored from `FormBehavior`
- command-palette state mirrored from `CommandPaletteBehavior`
- navigation, form, cart, palette, theme, confirmation, and toast actions

The HTML templates use `compile()` once and `mount()` once. Nested signals from the catalog/cart view-models remain directly consumable by template-core. The coordinator owns only View composition and lifecycle; domain operations remain in the copied models/view-models.

## Routing and Lifecycle

`@web-loom/router-core` provides history-mode routes for `/`, `/checkout`, and a fallback route. A delegated same-origin anchor listener calls `router.push()` and preserves modified/external links. Router changes update a signal consumed by the mounted template. Cleanup destroys the router, coordinator subscriptions, palette behavior, models, and mounted template.

## Template Organization

Templates are stored as TypeScript string constants and compiled into a single app template. They use Phase 1 interpolation, `if/else`, keyed `each`, property/attribute/class bindings, and event bindings. Form controls use explicit coordinator actions because Phase 1 has no `bind:` or event modifiers.

## Repository Integration

Add `@web-loom/template-core` to the Vite workspace alias registry and add the new app/package metadata, Vite config, TypeScript config, test setup, entry point, coordinator, templates, and integration tests.
