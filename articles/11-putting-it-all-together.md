# Putting It All Together — Building a Complete Feature With Web Loom

---

We've spent ten articles looking at individual packages. Each one solves a specific problem. Each one is useful on its own.

But the real question is whether the pieces compose. Can you build something real, something that a team would actually ship, by assembling these packages together? Or does the architecture fall apart when you try to use five packages at once?

This final article builds a complete feature from scratch: a **Product Browser** — a master-detail list of products, searchable, with a delete-with-confirmation flow, live event updates, cached data fetching, theme support, and a command palette for power users. It's a representative slice of a real application.

By the end, every package in the series will have appeared at least once.

---

## What We're Building

The feature has these requirements:

1. Load a list of products from an API, with caching
2. Display them in a searchable, paginated master-detail layout
3. Allow deleting a product with a confirmation dialog (no DOM coupling in the ViewModel)
4. Notify other parts of the app when a product is deleted (cross-feature event)
5. Persist the user's selected theme and sidebar preference
6. Support a command palette for keyboard-driven power users
7. Apply a design token system so the UI is consistently themeable
8. Have ViewModels that pause gracefully when their tab is not active

The packages used:
- `@web-loom/mvvm-core` — BaseModel, BaseViewModel, Command
- `@web-loom/query-core` — caching layer
- `@web-loom/event-bus-core` — cross-feature notifications
- `@web-loom/store-core` — UI state (theme, sidebar)
- `@web-loom/ui-patterns` — MasterDetail, CommandPalette
- `@web-loom/ui-core` — headless form behaviour for the search field
- `@web-loom/mvvm-patterns` — ConfirmationRequest, ActiveAwareViewModel
- `@web-loom/design-core` — design tokens and CSS custom properties
- `@web-loom/signals-core` — reactive computed values
- `@web-loom/event-emitter-core` — typed events on the model

---

## Step 1: The Design Foundation

Before any code, define the design tokens. These will flow through everything.

```typescript
// src/design/tokens.ts
import type { ColorToken, SpacingToken, RadiusToken, TypographyToken } from '@web-loom/design-core';
import { generateCSSCustomProperties } from '@web-loom/design-core';

const colors: Record<string, ColorToken> = {
  'color-brand':           { value: '#2563EB', type: 'color' },
  'color-surface':         { value: '#FFFFFF', type: 'color' },
  'color-surface-subtle':  { value: '#F8FAFC', type: 'color' },
  'color-surface-raised':  { value: '#F1F5F9', type: 'color' },
  'color-text-primary':    { value: '#0F172A', type: 'color' },
  'color-text-secondary':  { value: '#64748B', type: 'color' },
  'color-text-inverse':    { value: '#FFFFFF', type: 'color' },
  'color-border':          { value: '#E2E8F0', type: 'color' },
  'color-danger':          { value: '#DC2626', type: 'color' },
  'color-success':         { value: '#16A34A', type: 'color' },
};

const spacing: Record<string, SpacingToken> = {
  'space-1': { value: '4px',  type: 'spacing' },
  'space-2': { value: '8px',  type: 'spacing' },
  'space-3': { value: '12px', type: 'spacing' },
  'space-4': { value: '16px', type: 'spacing' },
  'space-6': { value: '24px', type: 'spacing' },
  'space-8': { value: '32px', type: 'spacing' },
};

const radii: Record<string, RadiusToken> = {
  'radius-sm': { value: '4px',  type: 'radius' },
  'radius-md': { value: '8px',  type: 'radius' },
  'radius-lg': { value: '12px', type: 'radius' },
};

export const lightThemeCSS = generateCSSCustomProperties({ colors, spacing, radii });

export const darkColors: Record<string, ColorToken> = {
  'color-brand':           { value: '#3B82F6', type: 'color' },
  'color-surface':         { value: '#0F172A', type: 'color' },
  'color-surface-subtle':  { value: '#1E293B', type: 'color' },
  'color-surface-raised':  { value: '#334155', type: 'color' },
  'color-text-primary':    { value: '#F1F5F9', type: 'color' },
  'color-text-secondary':  { value: '#94A3B8', type: 'color' },
  'color-text-inverse':    { value: '#0F172A', type: 'color' },
  'color-border':          { value: '#334155', type: 'color' },
  'color-danger':          { value: '#F87171', type: 'color' },
  'color-success':         { value: '#4ADE80', type: 'color' },
};

export const darkThemeCSS = generateCSSCustomProperties({ colors: darkColors, spacing, radii });
```

Inject both at app startup, swapping between them via a `data-theme` attribute or `.dark` class:

```typescript
// src/main.ts
import { lightThemeCSS, darkThemeCSS } from './design/tokens';

const style = document.createElement('style');
style.textContent = `:root { ${lightThemeCSS} } .dark { ${darkThemeCSS} }`;
document.head.appendChild(style);
```

Every component now uses `var(--color-surface)`, `var(--space-4)`, `var(--radius-md)`. Themes are a class toggle.

---

## Step 2: The Event Bus

Set up the application event bus before any feature code. This is the central nervous system for cross-feature communication.

```typescript
// src/infrastructure/bus.ts
import { createEventBus } from '@web-loom/event-bus-core';

// Define all app-level events in one place
interface AppEvents {
  'product:deleted': { productId: string; name: string };
  'product:updated': { productId: string };
  'cart:item-added': { productId: string; quantity: number };
  'auth:logout':     void;
}

export const appBus = createEventBus<AppEvents>();
```

This bus lives outside any feature. Both the product feature and the cart feature can communicate through it without importing each other.

---

## Step 3: The UI Store

UI state lives in a dedicated store. No framework, no context, just state.

```typescript
// src/stores/ui-store.ts
import { createStore, LocalStorageAdapter } from '@web-loom/store-core';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
}

export const uiStore = createStore<UIState>(
  {
    theme: 'system',
    sidebarOpen: true,
    commandPaletteOpen: false,
  },
  (set) => ({
    setTheme: (theme: UIState['theme']) => set(s => ({ ...s, theme })),
    toggleSidebar: () => set(s => ({ ...s, sidebarOpen: !s.sidebarOpen })),
    openPalette:  () => set(s => ({ ...s, commandPaletteOpen: true })),
    closePalette: () => set(s => ({ ...s, commandPaletteOpen: false })),
  }),
  {
    key: 'app:ui',
    adapter: new LocalStorageAdapter(),
    merge: true,
  }
);

// Apply theme to DOM whenever it changes
uiStore.subscribe(({ theme }, prev) => {
  if (theme !== prev?.theme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  }
});
```

---

## Step 4: The Product Model

The Model owns the data contract. It fetches, caches, and exposes typed events.

```typescript
// src/features/products/ProductModel.ts
import { BaseModel } from '@web-loom/mvvm-core';
import { QueryCore } from '@web-loom/query-core';
import { EventEmitter } from '@web-loom/event-emitter-core';
import { appBus } from '../../infrastructure/bus';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
}

interface ProductModelEvents {
  deleted: { productId: string; name: string };
}

// One QueryCore instance for the feature — could be app-level and shared
const queryCache = new QueryCore({ cacheProvider: 'localStorage', defaultRefetchAfter: 5 * 60_000 });

queryCache.defineEndpoint('products', async () => {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Product[]>;
});

export class ProductModel extends BaseModel<Product[], never> {
  readonly events = new EventEmitter<ProductModelEvents>();

  constructor() {
    super({});

    // Forward QueryCore state to BaseModel observables
    queryCache.subscribe('products', (state) => {
      this.setLoading(state.isLoading);
      if (state.error)  this.setError(state.error);
      if (state.data)   this.setData(state.data);
    });
  }

  async fetchAll(): Promise<void> {
    await queryCache.refetch('products');
  }

  async delete(productId: string): Promise<void> {
    const current = this.data$.value ?? [];
    const product = current.find(p => p.id === productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);

    // Update local cache optimistically
    this.setData(current.filter(p => p.id !== productId));
    queryCache.invalidate('products');

    // Emit typed model event
    this.events.emit('deleted', { productId, name: product.name });

    // Publish to app-wide event bus for cross-feature communication
    appBus.publish('product:deleted', { productId, name: product.name });
  }

  dispose(): void {
    this.events.removeAllListeners();
    super.dispose();
  }
}
```

The Model is completely ignorant of the UI. It doesn't know React exists. It handles HTTP, caching, and business events.

---

## Step 5: The ViewModel

The ViewModel derives what the View needs from the Model. It composes UI patterns and exposes interaction requests.

```typescript
// src/features/products/ProductViewModel.ts
import { map } from 'rxjs/operators';
import { Command } from '@web-loom/mvvm-core';
import { ActiveAwareViewModel } from '@web-loom/mvvm-patterns';
import { ConfirmationRequest, NotificationRequest } from '@web-loom/mvvm-patterns';
import { createMasterDetail } from '@web-loom/ui-patterns';
import { signal, computed } from '@web-loom/signals-core';
import { ProductModel, Product } from './ProductModel';

export class ProductViewModel extends ActiveAwareViewModel<ProductModel> {
  // --- Observables for the View ---
  readonly products$ = this.data$.pipe(map(data => data ?? []));
  readonly isLoading$ = this.isLoading$;
  readonly error$     = this.error$;

  // --- Search signal (reactive, no RxJS overhead for simple local state) ---
  private readonly _search = signal('');
  readonly search = this._search;
  readonly filteredProducts = computed(() => {
    const query = this._search.get().toLowerCase();
    const all   = (this.data$.value ?? []);
    if (!query) return all;
    return all.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  });

  // --- UI Pattern: MasterDetail ---
  readonly masterDetail = createMasterDetail<Product>({
    items: [],
    getId: (p) => p.id,
  });

  // --- Interaction Requests ---
  readonly confirmDelete = new ConfirmationRequest();
  readonly notifyDeleted = new NotificationRequest();

  // --- Commands ---
  readonly loadCommand   = this.registerCommand(new Command(() => this.model.fetchAll()));
  readonly deleteCommand = this.registerCommand(
    new Command(async (productId: string) => {
      const product = (this.data$.value ?? []).find(p => p.id === productId);
      if (!product) return;

      const response = await this.confirmDelete.raiseAsync({
        title:       'Delete Product',
        content:     `Remove "${product.name}" from the catalogue? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText:  'Cancel',
      });

      if (!response.confirmed) return;

      await this.model.delete(productId);

      this.notifyDeleted.raise({
        content: `"${product.name}" has been removed.`,
      });
    })
  );

  constructor(model: ProductModel) {
    super(model);

    // Keep MasterDetail in sync with filtered products
    this.addSubscription(
      this.products$.subscribe(products => {
        this.masterDetail.actions.setItems(products);
      })
    );
  }

  protected onIsActiveChanged(isActive: boolean): void {
    if (isActive) {
      // Load only if we have no data yet (cache will prevent re-fetching)
      if (!this.data$.value) {
        this.loadCommand.execute();
      }
    }
  }

  setSearch(query: string): void {
    this._search.set(query);
  }

  dispose(): void {
    this.masterDetail.destroy();
    this.confirmDelete.dispose();
    this.notifyDeleted.dispose();
    super.dispose();
  }
}
```

The ViewModel has zero framework imports. It uses five `@web-loom` packages but nothing from React, Vue, or Angular. Every piece of View logic — what's selected, what's filtered, what dialog to show, whether to load — is handled here.

---

## Step 6: The Command Palette

Wire the command palette at the feature level. Commands live here because they invoke ViewModel actions.

```typescript
// src/features/products/useProductPalette.ts (React hook)
import { useMemo, useEffect } from 'react';
import { createCommandPalette } from '@web-loom/ui-patterns';
import { uiStore } from '../../stores/ui-store';
import { ProductViewModel } from './ProductViewModel';

export function useProductPalette(vm: ProductViewModel) {
  const palette = useMemo(() => createCommandPalette({
    commands: [
      {
        id:      'reload',
        label:   'Reload Products',
        group:   'Products',
        shortcut: 'R',
        action:  () => vm.loadCommand.execute(),
      },
      {
        id:      'toggle-theme',
        label:   'Toggle Dark Mode',
        group:   'Appearance',
        keywords: ['dark', 'light', 'theme'],
        action:  () => {
          const { theme } = uiStore.getState();
          uiStore.actions.setTheme(theme === 'dark' ? 'light' : 'dark');
        },
      },
      {
        id:      'toggle-sidebar',
        label:   'Toggle Sidebar',
        group:   'Layout',
        action:  () => uiStore.actions.toggleSidebar(),
      },
    ],
    onOpen:  () => uiStore.actions.openPalette(),
    onClose: () => uiStore.actions.closePalette(),
  }), [vm]);

  // Open palette on Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        palette.actions.open();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [palette]);

  return palette;
}
```

---

## Step 7: The React View

The View is thin. It subscribes, renders, and calls commands.

```tsx
// src/features/products/ProductBrowser.tsx
import { useMemo, useEffect, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { ProductViewModel } from './ProductViewModel';
import { ProductModel, Product } from './ProductModel';
import { useProductPalette } from './useProductPalette';
import type { IConfirmation, INotification } from '@web-loom/mvvm-patterns';

// --- Minimal hook to bridge RxJS observables to React ---
function useObservable<T>(observable: { subscribe: (fn: (v: T) => void) => { unsubscribe: () => void } }, initial: T): T {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    const sub = observable.subscribe(setValue);
    return () => sub.unsubscribe();
  }, [observable]);
  return value;
}

export function ProductBrowser() {
  const model = useMemo(() => new ProductModel(), []);
  const vm    = useMemo(() => new ProductViewModel(model), [model]);
  const palette = useProductPalette(vm);

  // Activate/deactivate with component lifecycle
  useEffect(() => {
    vm.activate();
    return () => { vm.deactivate(); vm.dispose(); model.dispose(); };
  }, [vm, model]);

  // Subscribe to observables
  const products  = useObservable(vm.products$, []);
  const isLoading = useObservable(vm.isLoading$, false);
  const error     = useObservable(vm.error$, null);

  // Reactive signal value (signals have their own subscription API)
  const [filteredProducts, setFiltered] = useState<Product[]>([]);
  useEffect(() => {
    // In a real app you'd bind the computed signal directly; simplified here
    const interval = setInterval(() => {
      setFiltered(vm.filteredProducts.get());
    }, 50);
    return () => clearInterval(interval);
  }, [vm]);

  // UI store
  const uiState = useSyncExternalStore(
    (cb) => { const unsub = uiStore.subscribe(cb); return unsub; },
    () => uiStore.getState()
  );

  // Interaction request state
  const [confirmation, setConfirmation] = useState<{
    context: IConfirmation;
    callback: (r: IConfirmation) => void;
  } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const sub1 = vm.confirmDelete.requested$.subscribe(setConfirmation);
    const sub2 = vm.notifyDeleted.requested$.subscribe(event => {
      setNotification(event.context.content);
      setTimeout(() => setNotification(null), 3000);
      event.callback(event.context);
    });
    return () => { sub1.unsubscribe(); sub2.unsubscribe(); };
  }, [vm]);

  if (isLoading && !products.length) return <div>Loading…</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div style={{ display: 'flex', background: 'var(--color-surface)', minHeight: '100vh' }}>

      {/* Sidebar */}
      {uiState.sidebarOpen && (
        <aside style={{
          width: '280px',
          borderRight: '1px solid var(--color-border)',
          padding: 'var(--space-4)',
        }}>
          <input
            value={vm.search.get()}
            onChange={e => vm.setSearch(e.target.value)}
            placeholder="Search products…"
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-subtle)',
              color: 'var(--color-text-primary)',
            }}
          />

          <ul style={{ marginTop: 'var(--space-4)', listStyle: 'none', padding: 0 }}>
            {filteredProducts.map(product => (
              <li key={product.id}
                onClick={() => vm.masterDetail.actions.selectItem(product)}
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: vm.masterDetail.getState().selectedId === product.id
                    ? 'var(--color-surface-raised)'
                    : 'transparent',
                  color: 'var(--color-text-primary)',
                }}
              >
                <div style={{ fontWeight: 500 }}>{product.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {product.category} · ${product.price.toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* Detail panel */}
      <main style={{ flex: 1, padding: 'var(--space-8)' }}>
        {vm.masterDetail.getState().selectedItem ? (
          <ProductDetail
            product={vm.masterDetail.getState().selectedItem!}
            onDelete={() => vm.deleteCommand.execute(vm.masterDetail.getState().selectedId!)}
            isDeleting={vm.deleteCommand.isExecuting$.value}
          />
        ) : (
          <div style={{ color: 'var(--color-text-secondary)' }}>
            Select a product from the list.
          </div>
        )}
      </main>

      {/* Command Palette */}
      {uiState.commandPaletteOpen && (
        <CommandPaletteOverlay palette={palette} />
      )}

      {/* Confirmation Dialog */}
      {confirmation && (
        <ConfirmationDialog
          title={confirmation.context.title}
          message={confirmation.context.content}
          confirmText={confirmation.context.confirmText ?? 'Confirm'}
          cancelText={confirmation.context.cancelText ?? 'Cancel'}
          onConfirm={() => {
            confirmation.callback({ ...confirmation.context, confirmed: true });
            setConfirmation(null);
          }}
          onCancel={() => {
            confirmation.callback({ ...confirmation.context, confirmed: false });
            setConfirmation(null);
          }}
        />
      )}

      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          right: 'var(--space-6)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-success)',
          color: 'var(--color-text-inverse)',
          borderRadius: 'var(--radius-md)',
        }}>
          {notification}
        </div>
      )}
    </div>
  );
}
```

---

## Step 8: Cross-Feature Listening

Another feature — say, the cart — can listen to product deletions through the event bus without importing anything from the products feature:

```typescript
// src/features/cart/CartModel.ts
import { appBus } from '../../infrastructure/bus';

class CartModel extends BaseModel<CartState, never> {
  constructor() {
    super({});

    // Remove deleted products from active carts
    appBus.subscribe('product:deleted', ({ productId }) => {
      const items = this.data$.value?.items ?? [];
      const updated = items.filter(item => item.productId !== productId);
      this.setData({ ...this.data$.value, items: updated });
    });
  }
}
```

The cart knows nothing about how products are displayed. The products feature knows nothing about the cart. They share only the event definition in `bus.ts`.

---

## What Just Happened

Let's inventory what each package contributed:

| Package | Role in this feature |
|---|---|
| `@web-loom/mvvm-core` | `BaseModel` (ProductModel), `BaseViewModel` (ProductViewModel), `Command` (loadCommand, deleteCommand) |
| `@web-loom/query-core` | `QueryCore` caches product list, serves from cache on tab re-visit, auto-refreshes after 5 minutes |
| `@web-loom/event-emitter-core` | `EventEmitter<ProductModelEvents>` on the Model for internal typed events |
| `@web-loom/event-bus-core` | `appBus` carries `product:deleted` to the cart feature without coupling |
| `@web-loom/store-core` | `uiStore` persists theme and sidebar state across sessions |
| `@web-loom/ui-patterns` | `createMasterDetail` manages selection state; `createCommandPalette` provides Ctrl+K functionality |
| `@web-loom/mvvm-patterns` | `ConfirmationRequest` decouples delete dialog from ViewModel; `ActiveAwareViewModel` pauses work when tab is inactive |
| `@web-loom/design-core` | Token types and `generateCSSCustomProperties` create the CSS variable layer for theming |
| `@web-loom/signals-core` | `signal` + `computed` power the search filter with minimal overhead |
| `@web-loom/ui-core` | (Available for headless form behaviour on search field, table sorting — not shown in this example but a natural addition) |

Notice what the View layer does not contain:

- No business logic
- No fetch calls
- No caching decisions
- No event bus subscriptions for cross-feature concerns
- No knowledge of what other features exist
- No state management logic beyond subscribing and rendering

It renders. It calls commands. It handles interaction request callbacks. That's it.

---

## Testing the Feature

Because the ViewModel and Model are framework-agnostic classes, testing the entire business logic requires no component rendering, no act(), no testing-library:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProductModel } from './ProductModel';
import { ProductViewModel } from './ProductViewModel';

describe('Product delete flow', () => {
  let model: ProductModel;
  let vm:    ProductViewModel;

  beforeEach(() => {
    model = new ProductModel();
    vm    = new ProductViewModel(model);

    // Seed the model with test data
    model['setData']([
      { id: 'p1', name: 'Laptop', category: 'Electronics', price: 999, stock: 5, imageUrl: '' },
    ]);
  });

  afterEach(() => {
    vm.dispose();
    model.dispose();
  });

  it('does not delete when user cancels', async () => {
    const deleteSpy = vi.spyOn(model, 'delete');

    vm.confirmDelete.requested$.subscribe(event => {
      event.callback({ ...event.context, confirmed: false });
    });

    await vm.deleteCommand.execute('p1');

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('deletes and emits notification when confirmed', async () => {
    vi.spyOn(model, 'delete').mockResolvedValue(undefined);
    const notificationMessages: string[] = [];

    vm.notifyDeleted.requested$.subscribe(event => {
      notificationMessages.push(event.context.content);
      event.callback(event.context);
    });

    vm.confirmDelete.requested$.subscribe(event => {
      event.callback({ ...event.context, confirmed: true });
    });

    await vm.deleteCommand.execute('p1');

    expect(model.delete).toHaveBeenCalledWith('p1');
    expect(notificationMessages).toContain('"Laptop" has been removed.');
  });

  it('filters products by search query', () => {
    model['setData']([
      { id: 'p1', name: 'Laptop',     category: 'Electronics', price: 999, stock: 5, imageUrl: '' },
      { id: 'p2', name: 'Headphones', category: 'Electronics', price: 79,  stock: 10, imageUrl: '' },
      { id: 'p3', name: 'Notebook',   category: 'Stationery',  price: 5,   stock: 50, imageUrl: '' },
    ]);

    vm.setSearch('note');
    const filtered = vm.filteredProducts.get();

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Notebook');
  });
});
```

The entire delete confirmation flow — with its async Promise chain and interaction request handshake — tested in a plain Vitest file. No browser. No React renderer. Under 50 lines.

---

## The Architecture Holds

What makes this architecture work isn't any individual package. It's the discipline of keeping concerns in their correct layers.

The **design layer** (`design-core`) establishes the visual contract once. Every component uses it through CSS variables — no component owns its own colour values.

The **infrastructure layer** (`event-bus-core`, `store-core`, `query-core`) handles the mechanics of state persistence, caching, and cross-feature communication. None of this is business logic.

The **model layer** (`mvvm-core` BaseModel, `event-emitter-core`) owns the data. It has no framework imports. It could run in a Node.js script.

The **view-model layer** (`mvvm-core` BaseViewModel, `ui-patterns`, `signals-core`, `mvvm-patterns`) derives what the View needs. It has no framework imports. It's a class.

The **view layer** (React in this example) subscribes to everything above it. It renders. When the user acts, it calls a command. When an interaction request arrives, it handles it and fires the callback. That's the full extent of its job.

If the team decides to migrate from React to Vue next year, the migration scope is the View layer. Everything else is unchanged. The ViewModels are the same. The Models are the same. The design tokens are the same. The event bus is the same. The cache is the same.

This is the promise of the architecture, stated plainly: when the framework changes — and frameworks change — you rewrite the 20% that was always framework-specific anyway. The 80% that represents your application's actual value survives.

---

## Where Things Stand

At the time of this writing, ten packages are published to npm:

- `@web-loom/mvvm-core`
- `@web-loom/signals-core`
- `@web-loom/event-emitter-core`
- `@web-loom/event-bus-core`
- `@web-loom/store-core`
- `@web-loom/query-core`
- `@web-loom/ui-core`
- `@web-loom/ui-patterns`
- `@web-loom/design-core`
- `@web-loom/mvvm-patterns`

In progress: forms adapters, HTTP client, storage abstraction, router integration, i18n, notifications, error handling, platform detection.

The monorepo has demo applications for React, Angular, Vue, Lit, Marko, vanilla JavaScript, and React Native — all sharing the same ViewModels and Models, only differing in the View layer.

---

## An Honest Closing

MVVM is not a new idea. It was worked out in the WPF era and has been standard on Android, iOS, and .NET for a decade. The web largely skipped it because React's component model was new and exciting and seemed to solve the same problems in a different way. It solved some of them. It left others — portability, testability, separation of concerns — to be rediscovered by each team individually.

Web Loom is a bet that the discipline is worth bringing back, formalised in TypeScript, and expressed through small packages rather than a monolithic framework. Whether that bet pays off depends on whether the problems it addresses are real enough to warrant the added structure.

If you've ever rewritten a feature because a framework updated, if you've ever seen business logic scattered across thirty custom hooks, if you've ever written a test that required rendering a component just to verify that a fetch was called — then you know the problems are real.

These packages are open. The monorepo is public. Feedback, questions, and criticism are all welcome.

---

*This article concludes the Web Loom series. Links to all articles in the series:*
1. *`@web-loom/mvvm-core` — The Foundation*
2. *`@web-loom/signals-core` — Reactivity Without a Framework*
3. *`@web-loom/event-emitter-core` — Typed Events for TypeScript*
4. *`@web-loom/event-bus-core` — Application-Level Pub/Sub*
5. *`@web-loom/store-core` — UI State Belongs Somewhere Specific*
6. *`@web-loom/query-core` — Data Fetching With a Memory*
7. *`@web-loom/ui-core` — The Behaviour Layer Below Your Components*
8. *`@web-loom/ui-patterns` — When Behaviours Become Patterns*
9. *`@web-loom/design-core` — Design Tokens as the Contract Between Design and Code*
10. *`@web-loom/mvvm-patterns` — The Conversations ViewModels Need to Have*
11. *Putting It All Together — Building a Complete Feature With Web Loom*
