# `@web-loom/event-bus-core` — Decoupling Features With Typed Pub/Sub

---

There's a tension at the heart of application architecture that nobody talks about enough: features need to know about each other, but shouldn't depend on each other.

Consider a shopping application. When a user adds an item to the cart, at least five things need to happen: the cart count in the navbar updates, a toast notification appears, the product detail page updates the button state, the analytics system records the event, and the session persistence layer saves the updated cart. That's five different features that all care about the same user action.

How do you wire them together? The naive approach: the `addToCart` function calls all five. Now `cart.ts` imports from `navbar.ts`, `toast.ts`, `product.ts`, `analytics.ts`, and `session.ts`. Change any of those modules' signatures and `cart.ts` breaks. Write a test for `cart.ts` and you need to mock five collaborators. Delete the toast feature and you need to remember to update `cart.ts`.

The traditional solution to this problem is the publish/subscribe pattern. The cart publishes `'cart:item-added'`. The navbar, toast system, product page, analytics, and session layer each subscribe. The cart knows nothing about who's listening. The listeners know nothing about each other.

`@web-loom/event-bus-core` is a typed implementation of this pattern for application-level communication.

---

## The Difference Between an EventEmitter and an EventBus

`event-emitter-core` gives you a typed emitter — a general-purpose publish/subscribe primitive. `event-bus-core` is a higher-level abstraction that imposes architectural intent on top of it.

The distinction is subtle but important in practice. An emitter is a mechanism. An event bus is a convention: one shared channel through which distinct application features communicate, each feature knowing only the event shape, not the implementation behind it.

In Web Loom's architecture, the event bus is the communication layer between ViewModels that shouldn't directly reference each other. Two features in the same application may both need to react to a user logout. They shouldn't import each other's ViewModels. They share a bus.

---

## Creating an Event Bus

```typescript
import { createEventBus } from '@web-loom/event-bus-core';

// Define the application's event contract — typically in a shared file
interface AppEventMap {
  'cart:item-added':   { productId: string; quantity: number; price: number };
  'cart:item-removed': { productId: string };
  'cart:cleared':       void;
  'user:logged-in':    { userId: string; name: string };
  'user:logged-out':    void;
  'order:placed':      { orderId: string; total: number };
  'notification:show': { message: string; type: 'info' | 'success' | 'error' };
}

export const appBus = createEventBus<AppEventMap>();
```

`createEventBus<M>()` returns an `EventBus<M>` instance. It's a thin wrapper around `EventEmitter` from `event-emitter-core`, providing the same API with the same type safety.

You typically export this as a singleton — one bus per application feature domain, or one bus for the whole app depending on scale.

---

## Publishing and Subscribing

```typescript
// In CartModel.ts — publishing
import { appBus } from '../events/app-bus';

async addToCart(product: Product, quantity: number) {
  await api.cart.add(product.id, quantity);
  this.setData(await api.cart.get());

  appBus.emit('cart:item-added', {
    productId: product.id,
    quantity,
    price: product.price,
  });
}
```

```typescript
// In NavbarViewModel.ts — subscribing, no import of CartModel
import { appBus } from '../events/app-bus';

class NavbarViewModel extends BaseViewModel<NavbarModel> {
  readonly cartCount = signal(0);

  constructor(model: NavbarModel) {
    super(model);
    this.addSubscription(
      // Using RxJS Subscription for lifecycle management
      new Subscription(() =>
        appBus.on('cart:item-added', () => this.refreshCartCount())
      )
    );
  }
}
```

```typescript
// In AnalyticsService.ts — subscribing, no import of CartModel
import { appBus } from '../events/app-bus';

appBus.on('cart:item-added', (event) => {
  analytics.track('add_to_cart', {
    product_id: event.productId,
    quantity:   event.quantity,
    value:      event.price * event.quantity,
  });
});

appBus.on('order:placed', (event) => {
  analytics.track('purchase', {
    order_id: event.orderId,
    revenue:  event.total,
  });
});
```

Every subscriber receives correctly typed payloads. The `Cart` doesn't know about `Navbar`, `Analytics`, or anyone else. Adding a new feature that cares about cart additions means adding one new `appBus.on()` call — no changes to the cart.

---

## `on` With Multiple Events

The bus supports subscribing to multiple events at once — useful when a component needs to react to several related events:

```typescript
appBus.on(['user:logged-in', 'user:logged-out'], (event) => {
  updateAuthState();
});
```

Note: when subscribing to multiple events with a single handler, the handler receives no typed payload (since different events have different types). This overload is for side effects that don't inspect the event data.

---

## `once`

Subscribe to an event exactly once:

```typescript
appBus.once('user:logged-in', (event) => {
  // Record first login — fires once and removes itself
  onboarding.startTour(event.userId);
});
```

---

## Domain-Scoped Buses

For larger applications, a single global bus can become a maintenance problem — it's hard to track which features publish or subscribe to which events. A better pattern is one bus per domain:

```typescript
// events/auth-bus.ts
interface AuthEvents {
  'login:success':  { userId: string; role: string };
  'login:failed':   { reason: string; attempt: number };
  'logout':          void;
  'password:reset': { email: string };
}
export const authBus = createEventBus<AuthEvents>();

// events/cart-bus.ts
interface CartEvents {
  'item:added':   { productId: string; quantity: number };
  'item:removed': { productId: string };
  'checkout:started': void;
  'order:confirmed':  { orderId: string };
}
export const cartBus = createEventBus<CartEvents>();
```

Each feature owns its bus. Cross-domain communication — like the navbar reacting to auth events — is explicit: the navbar subscribes to `authBus`, not to some global catch-all.

---

## The Bus in MVVM

In Web Loom's architecture, the event bus sits alongside the ViewModel layer. It's not inside any ViewModel — it's a shared communication channel.

The mental model:

```
Model (data, API)
  ↓
ViewModel (commands, derived state)
  ↓                           ↔  EventBus (cross-feature events)
View (subscribe, render, call commands)
```

ViewModels can both publish to and subscribe from the bus. A ViewModel that deletes an entity publishes `'entity:deleted'`. Other ViewModels that need to update in response subscribe. The Model layer can also publish — when a data fetch completes, the Model might publish a cache-invalidation event that triggers related ViewModels to re-fetch.

```typescript
class OrderViewModel extends BaseViewModel<OrderModel> {
  readonly placeCommand = this.registerCommand(
    new Command(async (items: CartItem[]) => {
      const order = await this.model.placeOrder(items);

      // Publish for other features to react
      appBus.emit('order:placed', { orderId: order.id, total: order.total });
      appBus.emit('cart:cleared');
    })
  );
}
```

```typescript
class CartViewModel extends BaseViewModel<CartModel> {
  constructor(model: CartModel) {
    super(model);

    // React to order completion without importing OrderViewModel
    this.addSubscription(
      new Subscription(() =>
        appBus.on('cart:cleared', () => this.model.clear())
      )
    );
  }
}
```

---

## Testing With the Event Bus

The bus makes testing significantly easier because you can test event publication and subscription in isolation.

```typescript
// Test that CartModel publishes the right event
it('emits cart:item-added with correct payload', async () => {
  const bus = createEventBus<AppEventMap>();
  const model = new CartModel(mockApi, bus);

  const received: AppEventMap['cart:item-added'][] = [];
  bus.on('cart:item-added', (e) => received.push(e));

  await model.addToCart({ id: 'p1', price: 29.99 }, 2);

  expect(received).toHaveLength(1);
  expect(received[0]).toMatchObject({ productId: 'p1', quantity: 2, price: 29.99 });
});

// Test that NavbarViewModel reacts to events
it('updates cart count when item added', () => {
  const bus = createEventBus<AppEventMap>();
  const vm  = new NavbarViewModel(new NavbarModel(), bus);

  expect(vm.cartCount.get()).toBe(0);

  bus.emit('cart:item-added', { productId: 'p1', quantity: 1, price: 10 });

  expect(vm.cartCount.get()).toBe(1);
});
```

You create a fresh bus per test, eliminating any cross-test pollution. The bus is injected rather than imported as a singleton in tests.

---

## Versus Framework-Specific Solutions

**React Context**: Propagates state down the component tree. Triggers re-renders in all consumers when context changes. Solves a different problem (passing data to deep children) rather than cross-feature communication. Not framework-agnostic.

**Redux actions**: Function similarly in the publish sense, but require a reducer to process them, are tightly coupled to Redux's store structure, and carry Redux's boilerplate overhead. The bus is lighter and doesn't dictate how subscribers update their state.

**Zustand subscriptions**: Similar to the bus pattern but coupled to Zustand's specific store API. Works well within a Zustand-only architecture.

**Nx event-driven architecture / module federation events**: For micro-frontend setups where bundles are physically separate. The bus pattern scales to this — each shell can have a shared bus contract — but that's an advanced use case beyond most applications.

**Browser `CustomEvent` + `window.dispatchEvent`**: Works, but is untyped, verbose, and requires the DOM to be present (no Node.js/test support). Also, `window` as a communication channel is a global — harder to scope and harder to test.

The typed event bus strikes a balance: more structured than raw emitters, lighter than Redux, framework-agnostic unlike React Context, and testable unlike `window.dispatchEvent`.

---

## Installing

```bash
npm install @web-loom/event-bus-core
```

`@web-loom/event-emitter-core` is the only dependency — it's installed automatically.

The package re-exports its types from `event-emitter-core` so you don't need to import from two places when working with both.

---

Next in the series: `@web-loom/store-core`, the minimal reactive store designed specifically for UI-only state — the things that don't belong in a Model.
