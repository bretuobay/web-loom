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
masterDetail.actions.goToPrevious();
masterDetail.actions.goToNext();

// State
const { selectedItem, selectedId, hasPrevious, hasNext } = masterDetail.getState();

// Events via the internal event bus
masterDetail.eventBus.on('item:selected', (item) => updateDetailPanel(item));
masterDetail.eventBus.on('selection:cleared', () => showEmptyState());

// Cleanup
masterDetail.destroy();
```

The pattern handles:
- Which item is selected
- Previous/next navigation (keyboard arrow keys, navigation buttons)
- Whether there's a previous or next item (for disabling navigation buttons)
- Emitting typed events when selection changes

You handle:
- Rendering the list
- Rendering the detail panel
- The layout (two-column, overlay, drawer, etc.)
- Mobile vs desktop breakpoints

```tsx
// React example
function ProductBrowser() {
  const products = useObservable(vm.products$, []);
  const [detail, setDetail] = useState<Product | null>(null);
  const masterDetail = useMemo(() =>
    createMasterDetail({ items: products, getId: p => p.id }), [products]
  );

  useEffect(() => {
    const unsub = masterDetail.eventBus.on('item:selected', setDetail);
    return () => { unsub(); masterDetail.destroy(); };
  }, [masterDetail]);

  return (
    <div className="flex">
      <aside className="w-64 border-r">
        {products.map(p => (
          <button
            key={p.id}
            className={detail?.id === p.id ? 'bg-blue-50' : ''}
            onClick={() => masterDetail.actions.selectItem(p)}
          >
            {p.name}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6">
        {detail ? <ProductDetail product={detail} /> : <EmptyState />}
      </main>
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
    { id: 'account',  label: 'Account Details',  canSkip: false },
    { id: 'profile',  label: 'Profile',           canSkip: true  },
    { id: 'billing',  label: 'Payment',           canSkip: false },
    { id: 'review',   label: 'Review & Submit',   canSkip: false },
  ],
  onComplete: async (collectedData) => {
    await api.onboard(collectedData);
  },
  onStepChange: (from, to) => {
    analytics.track('wizard_step', { from: from.id, to: to.id });
  },
});

// Navigation
await wizard.actions.next();          // validates current step, advances if valid
await wizard.actions.previous();      // always goes back
wizard.actions.goToStep('profile');   // jump navigation (if allowed)
wizard.actions.skip();                // skip current step (if canSkip)

// Data collection
wizard.actions.setStepData('account', { email: 'user@example.com', password: '...' });

// State
const {
  currentStep,
  steps,
  currentIndex,
  isFirstStep,
  isLastStep,
  completedSteps,
  collectedData,
  isCompleting,
} = wizard.getState();
```

The validation hook:

```typescript
const wizard = createWizard({
  steps: [...],
  validate: async (stepId, data) => {
    if (stepId === 'account') {
      const schema = AccountSchema;
      const result = schema.safeParse(data);
      if (!result.success) return result.error.flatten().fieldErrors;
    }
    return null; // null means valid
  },
});
```

`wizard.actions.next()` calls `validate(currentStep.id, stepData)` before advancing. If validation fails, it stays on the current step and returns the errors. No advance without valid data — unless the step is marked `canSkip`.

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
      group: 'File',
      shortcut: 'Ctrl+N',
      action: () => createDocument(),
    },
    {
      id: 'export-pdf',
      label: 'Export as PDF',
      group: 'File',
      keywords: ['save', 'download', 'export'],
      action: () => exportAsPDF(),
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark Mode',
      group: 'View',
      action: () => themeStore.actions.toggleMode(),
    },
  ],
  onOpen:  () => analytics.track('command_palette_opened'),
  onClose: () => {},
});

// Open/close
palette.actions.open();
palette.actions.close();

// Navigation (keyboard integration)
palette.actions.setQuery('new');    // fuzzy filter
palette.actions.moveDown();
palette.actions.moveUp();
palette.actions.execute();          // execute selected command

// State
const { isOpen, query, filteredCommands, selectedIndex } = palette.getState();
```

The built-in fuzzy search ranks results by how well the query matches the label and keywords — partial matches, character subsequences, case-insensitive. You don't implement the search; you provide the commands.

```tsx
function CommandPaletteOverlay() {
  const palette = usePalette(); // your hook wrapping createCommandPalette

  if (!palette.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={palette.close}>
      <div className="mx-auto mt-20 w-full max-w-lg bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <input
          autoFocus
          value={palette.query}
          onChange={e => palette.setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') palette.moveDown();
            if (e.key === 'ArrowUp')   palette.moveUp();
            if (e.key === 'Enter')     palette.execute();
            if (e.key === 'Escape')    palette.close();
          }}
          placeholder="Type a command..."
          className="w-full px-4 py-3 border-b outline-none"
        />
        <ul>
          {palette.filteredCommands.map((cmd, i) => (
            <li
              key={cmd.id}
              className={i === palette.selectedIndex ? 'bg-blue-50' : ''}
              onClick={palette.execute}
              onMouseEnter={() => palette.setSelected(i)}
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

Multiple overlapping modals — a confirmation dialog on top of an edit dialog. The stack manages z-index order, ensures Escape dismisses from the top, and handles focus cycling correctly.

```typescript
import { createModal } from '@web-loom/ui-patterns';

const modal = createModal({ id: 'edit-product' });

modal.actions.push({ id: 'confirm-delete', context: { productId: '123' } });
modal.actions.pop();
modal.actions.clear();

const { stack, topModal } = modal.getState();
```

### Toast Queue

Time-limited notification messages with a queue to prevent overwhelming the user.

```typescript
import { createToastQueue } from '@web-loom/ui-patterns';

const toasts = createToastQueue({ maxVisible: 3, duration: 4000 });

toasts.actions.push({ message: 'Saved successfully', type: 'success' });
toasts.actions.push({ message: 'Network error', type: 'error', duration: 8000 });
toasts.actions.dismiss('toast-id');

const { visibleToasts } = toasts.getState();
```

### Tabbed Interface

```typescript
import { createTabbedInterface } from '@web-loom/ui-patterns';

const tabs = createTabbedInterface({
  tabs: [
    { id: 'details',  label: 'Details'  },
    { id: 'activity', label: 'Activity' },
    { id: 'settings', label: 'Settings' },
  ],
  defaultTab: 'details',
  onTabChange: (tab) => router.setParam('tab', tab.id),
});

tabs.actions.setActive('activity');
tabs.actions.next();
tabs.actions.previous();

const { activeTab, tabs: tabList } = tabs.getState();
```

### Hub and Spoke

The hub-and-spoke navigation pattern — a central hub screen with spoke pages that branch off it. Manages navigation history, breadcrumb state, and back/forward transitions.

```typescript
import { createHubAndSpoke } from '@web-loom/ui-patterns';

const nav = createHubAndSpoke({
  hub: { id: 'home', label: 'Home' },
  onNavigate: (spoke) => router.push(spoke.path),
});

nav.actions.navigate({ id: 'settings', label: 'Settings', path: '/settings' });
nav.actions.back();

const { currentSpoke, isAtHub, breadcrumbs } = nav.getState();
```

---

## How Patterns Connect to ViewModels

Patterns are UI behaviour — they belong in the View layer or in a ViewModel that coordinates presentation logic. The right way to think about the division:

- The **ViewModel** manages business state (which products are loaded, which product is being edited)
- The **pattern** manages UI state (which item is selected in the master-detail, which step of the wizard the user is on)

They communicate through the ViewModel when business actions need to happen:

```typescript
class ProductBrowserViewModel extends BaseViewModel<ProductModel> {
  // Business logic
  readonly products$ = this.data$.pipe(map(data => data ?? []));
  readonly loadCommand = this.registerCommand(new Command(() => this.model.fetchAll()));
  readonly deleteCommand = this.registerCommand(
    new Command((id: string) => this.model.delete(id))
  );

  // UI pattern — created once, lives with the ViewModel
  readonly masterDetail = createMasterDetail({
    items: [],
    getId: (p: Product) => p.id,
  });

  constructor(model: ProductModel) {
    super(model);

    // Keep the pattern's items in sync with the model's data
    this.addSubscription(
      this.products$.subscribe(products => {
        this.masterDetail.actions.setItems(products);
      })
    );
  }

  dispose() {
    this.masterDetail.destroy();
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
