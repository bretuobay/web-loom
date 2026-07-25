# Ecommerce Template-Core Demo Requirements

## Goal

Create `apps/ecommerce-template-core`, a framework-free ecommerce demo that uses `@web-loom/template-core` as its View while preserving the domain behavior demonstrated by `apps/ecommerce-mvvm`.

## Requirements

1. The React demo remains unchanged and independently runnable.
2. The new app reuses the ecommerce API adapters, fixtures, models, view-models, UI store, event bus, theme, money utilities, and CSS baseline through a controlled copy.
3. The new app renders through compiled `@web-loom/template-core` templates mounted directly against signal-bearing view-model state.
4. The storefront supports catalog loading/error/empty states, search, product selection, product details, reload, and add-to-cart.
5. The cart supports open/close, empty state, quantity changes, removal, clearing with confirmation, subtotal, and navigation to checkout.
6. Checkout supports signalized form values, blur validation, validation messages, confirmation, order completion, cart reset, and success notification.
7. The command palette supports open/close, query filtering, keyboard selection, command execution, and checkout navigation.
8. Theme switching, toast notifications, browser routing, unknown-route handling, and teardown must work without React or React hooks.
9. The implementation must stay within template-core Phase 1 grammar and must not require partials, event modifiers, `bind:`, `use:`, or SSR.
10. Build, type-check, and integration tests must cover the principal user flows and disposal behavior.

## Acceptance Scenarios

- A fresh mount loads products and displays product cards.
- Searching filters products reactively and selecting a product updates the detail panel.
- Adding a product updates the cart count and cart contents.
- Checkout validation prevents incomplete orders and displays field errors.
- A confirmed checkout empties the cart, returns to the storefront, and displays a toast.
- Route navigation works through links, programmatic actions, and browser history.
- Disposing the mounted view stops reactive DOM updates and removes listeners/subscriptions.
