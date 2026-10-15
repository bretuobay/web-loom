# `@web-loom/ui-patterns` — When Behaviours Become Patterns

---

There's a difference between a behaviour and a pattern. A behaviour is atomic: "a dialog can be opened and closed." A pattern is compositional: "a master-detail view has a list on the left, a detail panel on the right, selection state that connects them, keyboard navigation across both, and a mobile layout where the detail panel overlays the list."

A wizard is not one behaviour. It's step management, validation gating, progress tracking, and completion handling, coordinated together. A command palette is keyboard navigation, fuzzy search, group organisation, and action execution, working in concert.

`@web-loom/ui-patterns` composes the atomic behaviours from `@web-loom/ui-core` into these higher-level shells.

---

## Why Patterns Instead of Components

The frontend ecosystem has an abundance of UI component libraries. Material UI, Ant Design, Chakra UI, shadcn/ui, Mantine — these are all excellent libraries that provide complete, styled components. If you want a wizard, you use their wizard. If you want a command palette, you use theirs.

The constraint is that these libraries bundle behaviour with appearance. The wizard component looks a certain way. The master-detail has specific layout assumptions. Using the library's component means accepting its visual defaults, or spending significant effort overriding them with `!important` CSS and prop drilling.

`ui-patterns` takes the opposite approach: patterns without appearance. The package gives you the state machine, the event model, and the wiring between behaviours. The visual design is entirely yours. You decide what the wizard looks like. You decide the layout of the master-detail. The pattern manages what's selected, what step you're on, whether the palette is open, and how actions fire.

---

## Master Detail

The master-detail pattern is a two-panel layout where selecting an item in a list (the "master") shows its details in a secondary panel (the "detail"). It's everywhere: email clients, file browsers, CMS dashboards, contact lists.

```typescript
import { createMasterDetail } from '@web-loom/ui-patterns';

const masterDetail = createMasterDetail({
  items: products,
  getId: (item) => item.id,
  onSelectionChange: (selected) => {
    console.log('Selected product:', selected?.name);
  },
});

// Actions
masterDetail.actions.selectItem(products[0]);
masterDetail.actions.clearSelection();
masterDetail.actions.setDetailView('edit'); // e.g. switch the detail panel between 'view' and 'edit'

// State
const { items, selectedItem, detailView } = masterDetail.getState();

// Events via the internal event bus
masterDetail.eventBus.on('item:selected', (item) => updateDetailPanel(item));
masterDetail.eventBus.on('selection:cleared', () => showEmptyState());

// Cleanup
masterDetail.destroy();
```

The pattern handles:

- Which item is selected (via `ui-core`'s list selection)
- Which detail view is showing
- Emitting typed events when selection changes or is cleared

Previous/next navigation isn't built in; derive it from `items` and `selectedItem` if you need it.

You handle:

- Rendering the list
- Rendering the detail panel
- The layout (two-column, overlay, drawer, etc.)
- Mobile vs desktop breakpoints

```tsx
// React example
function ProductBrowser() {
  const products = useSignal(vm.products$);
  const [detail, setDetail] = useState<Product | null>(null);
  const masterDetail = useMemo(() => createMasterDetail({ items: products, getId: (p) => p.id }), [products]);

  useEffect(() => {
    // eventBus.on returns nothing — remove the listener with off()
    masterDetail.eventBus.on('item:selected', setDetail);
    return () => {
      masterDetail.eventBus.off('item:selected', setDetail);
      masterDetail.destroy();
    };
  }, [masterDetail]);

  return (
    <div className="flex">
      <aside className="w-64 border-r">
        {products.map((p) => (
          <button
            key={p.id}
            className={detail?.id === p.id ? 'bg-blue-50' : ''}
            onClick={() => masterDetail.actions.selectItem(p)}
          >
            {p.name}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6">{detail ? <ProductDetail product={detail} /> : <EmptyState />}</main>
    </div>
  );
}
```

---

## Wizard

Multi-step flows are notoriously tricky to get right. Which steps are complete? Can the user jump to step 3 without completing step 2? What happens when validation fails on step 4? What data has accumulated across steps?

```typescript
import { createWizard } from '@web-loom/ui-patterns';

const wizard = createWizard({
  steps: [
    {
      id: 'account',
      label: 'Account Details',
      // Per-step validation: return an error message, or null/undefined when valid
      validate: (data) => (AccountSchema.safeParse(data).success ? null : 'Please complete your account details'),
    },
    { id: 'profile', label: 'Profile' },
    { id: 'billing', label: 'Payment' },
    { id: 'review', label: 'Review & Submit' },
  ],
  onComplete: async (collectedData) => {
    await api.onboard(collectedData);
  },
  onStepChange: (stepIndex, step) => {
    analytics.track('wizard_step', { index: stepIndex, step: step.id });
  },
});

// Navigation
await wizard.actions.goToNextStep(); // validates the current step; resolves false if invalid
wizard.actions.goToPreviousStep();
wizard.actions.goToStep(1); // jump by index

// Data collection (merged into the wizard's data)
wizard.actions.setStepData({ email: 'user@example.com', password: '...' });

// Finish
await wizard.actions.completeWizard(); // calls onComplete with the collected data

// State
const { steps, currentStepIndex, completedSteps, canProceed, data } = wizard.getState();
```

`goToNextStep()` runs the current step's `validate(data)` before advancing. If it returns an error (or throws), the wizard stays on the current step, sets `canProceed` to `false` and resolves `false`. Steps can also define `getNextStep(data)` for branching flows. There's no built-in "skip" — model optional steps with `getNextStep` or `goToStep`.

---

## Command Palette

The command palette (also called an "omnibox" or "quick action bar") has become a standard pattern in developer tools and power-user applications. VS Code's `Ctrl+Shift+P`. Linear's `Ctrl+K`. GitHub's `Ctrl+K`. Figma's search. It's a fuzzy-searchable list of commands, triggered by a keyboard shortcut.

```typescript
import { createCommandPalette } from '@web-loom/ui-patterns';

const palette = createCommandPalette({
  commands: [
    {
      id: 'new-document',
      label: 'New Document',
      category: 'File',
      shortcut: 'Ctrl+N',
      action: () => createDocument(),
    },
    {
      id: 'export-pdf',
      label: 'Export as PDF',
      category: 'File',
      keywords: ['save', 'download', 'export'],
      action: () => exportAsPDF(),
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark Mode',
      category: 'View',
      action: () => themeStore.actions.toggleMode(),
    },
  ],
  onOpen: () => analytics.track('command_palette_opened'),
  onClose: () => {},
});

// Open/close
palette.actions.open();
palette.actions.close();

// Navigation (keyboard integration)
palette.actions.setQuery('new'); // fuzzy filter
palette.actions.selectNext();
palette.actions.selectPrevious();
await palette.actions.executeSelected(); // execute selected command

// State
const { isOpen, query, filteredCommands, selectedIndex } = palette.getState();
```

The built-in fuzzy search ranks results by how well the query matches the label, category and keywords — partial matches, character subsequences, case-insensitive. You don't implement the search; you provide the commands.

```tsx
function CommandPaletteOverlay() {
  // your hook wrapping createCommandPalette: returns its state plus `actions`
  const palette = usePalette();
  const { actions } = palette;

  if (!palette.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={actions.close}>
      <div
        className="mx-auto mt-20 w-full max-w-lg bg-white rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={palette.query}
          onChange={(e) => actions.setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') actions.selectNext();
            if (e.key === 'ArrowUp') actions.selectPrevious();
            if (e.key === 'Enter') void actions.executeSelected();
            if (e.key === 'Escape') actions.close();
          }}
          placeholder="Type a command..."
          className="w-full px-4 py-3 border-b outline-none"
        />
        <ul>
          {palette.filteredCommands.map((cmd, i) => (
            <li
              key={cmd.id}
              className={i === palette.selectedIndex ? 'bg-blue-50' : ''}
              onClick={() => void actions.executeCommand(cmd.id)}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## Other Patterns

### Modal Stack

Multiple overlapping modals — a confirmation dialog on top of an edit dialog. The stack keeps modals ordered by priority and tells you which one is on top; your View wires Escape and backdrop clicks to `handleEscapeKey()`/`handleBackdropClick(id)`, and handles focus itself.

```typescript
import { createModal } from '@web-loom/ui-patterns';

const modal = createModal({ onStackChange: (stack) => console.log(stack.length) });

modal.actions.openModal('edit-product', { productId: '123' });
modal.actions.openModalWithConfig({ id: 'confirm-delete', content: { productId: '123' }, closeOnEscape: true });
modal.actions.closeTopModal();
modal.actions.closeAllModals();

const { stack, topModalId } = modal.getState();
```

### Toast Queue

Time-limited notification messages with a queue to prevent overwhelming the user.

```typescript
import { createToastQueue } from '@web-loom/ui-patterns';

const toasts = createToastQueue({ position: 'top-right' });

const id = toasts.actions.addToast({ message: 'Saved successfully', type: 'success', duration: 4000 });
toasts.actions.addToast({ message: 'Network error', type: 'error', duration: 8000 });
toasts.actions.removeToast(id);

const { toasts: queued } = toasts.getState();
// Each toast is removed automatically after its own `duration`. The `maxVisible` and
// `defaultDuration` options are stored in state but not currently enforced, so cap the
// rendered list yourself if you need to.
```

### Tabbed Interface

```typescript
import { createTabbedInterface } from '@web-loom/ui-patterns';

const tabs = createTabbedInterface({
  tabs: [
    { id: 'details', label: 'Details' },
    { id: 'activity', label: 'Activity' },
    { id: 'settings', label: 'Settings' },
  ],
  initialActiveTabId: 'details',
  onTabChange: (tabId) => router.setParam('tab', tabId),
});

tabs.actions.activateTab('activity');
tabs.actions.focusNextTab();
tabs.actions.focusPreviousTab();

const { activeTabId, tabs: tabList } = tabs.getState();
```

### Hub and Spoke

The hub-and-spoke navigation pattern — a central hub screen with spoke pages that branch off it. Manages navigation history, breadcrumb state, and back/forward transitions.

```typescript
import { createHubAndSpoke } from '@web-loom/ui-patterns';

const nav = createHubAndSpoke({
  spokes: [
    { id: 'settings', label: 'Settings' },
    { id: 'billing', label: 'Billing' },
  ],
  onSpokeActivate: (spokeId) => router.push(`/${spokeId}`),
  onReturnToHub: () => router.push('/'),
});

nav.actions.activateSpoke('settings');
nav.actions.goBack();
nav.actions.returnToHub();

const { activeSpoke, isOnHub, breadcrumbs } = nav.getState();
```

---

## How Patterns Connect to ViewModels

Patterns are UI behaviour — they belong in the View layer or in a ViewModel that coordinates presentation logic. The right way to think about the division:

- The **ViewModel** manages business state (which products are loaded, which product is being edited)
- The **pattern** manages UI state (which item is selected in the master-detail, which step of the wizard the user is on)

They communicate through the ViewModel when business actions need to happen:

```typescript
import { computed, observe } from '@web-loom/signals-core';
import { createMasterDetail, type MasterDetailBehavior } from '@web-loom/ui-patterns';

class ProductBrowserViewModel extends BaseViewModel<ProductModel> {
  // Business logic
  readonly products$ = computed(() => this.data$.get() ?? []);
  readonly loadCommand = this.registerCommand(new Command(() => this.model.fetchAll()));
  readonly deleteCommand = this.registerCommand(new Command((id: string) => this.model.delete(id)));

  // UI pattern — master-detail has no action to replace its items,
  // so it's (re)created whenever a new product list arrives
  masterDetail: MasterDetailBehavior<Product> | null = null;

  constructor(model: ProductModel) {
    super(model);

    this.addSubscription(
      observe(this.products$, (products) => {
        this.masterDetail?.destroy();
        this.masterDetail = createMasterDetail({ items: products, getId: (p: Product) => p.id });
      }),
    );
  }

  dispose() {
    this.masterDetail?.destroy();
    super.dispose();
  }
}
```

This keeps the ViewModel as the single source of truth for both business data and UI coordination, while keeping the business logic (fetching, deleting) separate from the UI behaviour (which item is selected, what panel is visible).

---

## Installing

```bash
npm install @web-loom/ui-patterns
```

`@web-loom/ui-core` and `@web-loom/store-core` are installed automatically as dependencies.

---

Next in the series: `@web-loom/design-core`, the design token layer that gives your application a typed, themeable, CSS-custom-property-based design system without locking you into any specific component library.
