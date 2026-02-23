# `@web-loom/ui-core` — The Behaviour Layer Below Your Components

---

In 2016, Ryan Florence gave a talk at React Rally that changed how a lot of people thought about component libraries. He argued that most UI library components are over-specified: they own the markup, the styles, and the behaviour, bundled together with no seams. When you need to change any one of them, you're fighting the library.

His alternative was "compound components" — components that provide behaviour through React context while leaving markup to the consumer. This was a step in the right direction, but it was still React-specific.

The idea matured into what the community now calls "headless UI." Libraries like Radix UI, Headless UI (from Tailwind Labs), and React Aria took the concept further: behaviour and accessibility semantics, with no assumptions about markup or styles. You provide the JSX structure, the library manages focus, keyboard navigation, ARIA attributes, and state transitions.

`@web-loom/ui-core` brings this pattern to the framework layer below React.

---

## What "Headless" Actually Means

A dialog is a well-defined interaction pattern. It has rules:

- When it opens, focus moves inside it
- Pressing Escape closes it
- Clicking outside it closes it (usually)
- Background content is `aria-hidden` while it's open
- Focus returns to the triggering element when it closes
- It has `role="dialog"` and `aria-modal="true"`

None of these rules are about what the dialog looks like. They're about how it behaves and how screen readers understand it. They apply equally whether your dialog is a Material Design modal, a Tailwind-styled popup, or a custom design-system component.

A headless UI library encodes these rules. You connect the rules to your markup. The library doesn't care what your markup looks like.

---

## The Behaviours

`@web-loom/ui-core` ships eight behaviour factories. Each returns a store (built on `store-core`) with typed state and actions, plus optional React hooks.

### Dialog

```typescript
import { createDialogBehavior } from '@web-loom/ui-core';

const dialog = createDialogBehavior({
  id: 'confirm-delete',
  onOpen: () => console.log('Dialog opened'),
  onClose: () => console.log('Dialog closed'),
});

// Actions
dialog.actions.open();
dialog.actions.close();
dialog.actions.toggle();

// State
dialog.getState(); // → { isOpen: boolean, id: string }

// Subscribe
dialog.subscribe((state) => {
  document.getElementById('my-dialog')?.setAttribute(
    'aria-hidden',
    String(!state.isOpen)
  );
});
```

In React, the `useDialogBehavior` hook handles subscription and cleanup:

```tsx
import { useDialogBehavior } from '@web-loom/ui-core';

function DeleteConfirmation() {
  const dialog = useDialogBehavior({ id: 'confirm-delete' });

  return (
    <>
      <button onClick={dialog.open}>Delete</button>

      {dialog.isOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <h2 id="dialog-title">Confirm Deletion</h2>
          <p>This cannot be undone.</p>
          <button onClick={dialog.close}>Cancel</button>
          <button onClick={handleConfirm}>Delete</button>
        </div>
      )}
    </>
  );
}
```

You own the markup. You choose where to put the `<div>`, what classes to apply, whether it's a portal or inline. The behaviour — `isOpen` state, `open()`, `close()` — comes from the library.

### List Selection

```typescript
import { createListSelectionBehavior } from '@web-loom/ui-core';

const list = createListSelectionBehavior({
  mode: 'single',  // or 'multiple'
  items: products,
  getId: (p) => p.id,
  onSelectionChange: (selected) => {
    vm.selectedProducts$.next(selected);
  },
});

list.actions.select('product-123');
list.actions.deselect('product-123');
list.actions.selectAll();
list.actions.clearSelection();
list.actions.toggle('product-456');

const { selectedIds, selectedItems, isAllSelected } = list.getState();
```

Multi-select with keyboard support is a well-known source of accessibility bugs. Getting Shift+click range selection, Ctrl+click individual toggle, and keyboard arrow navigation correct takes a surprising amount of code. `createListSelectionBehavior` encodes these rules once and makes them available everywhere.

### Roving Focus

The roving `tabindex` pattern is how ARIA-compliant widget toolbars, radio groups, and menu items handle keyboard navigation. Instead of every item being in the tab order, only one item at a time has `tabindex="0"` — the currently "active" item. Arrow keys move the active item; Tab moves focus out of the widget entirely.

```typescript
import { createRovingFocusBehavior } from '@web-loom/ui-core';

const rovingFocus = createRovingFocusBehavior({
  orientation: 'horizontal',
  loop: true, // wrap around at the ends
});

// Register items (usually via refs)
rovingFocus.actions.setItems(['tab-1', 'tab-2', 'tab-3']);
rovingFocus.actions.setActive('tab-1');

// Navigate
rovingFocus.actions.movePrevious();
rovingFocus.actions.moveNext();
rovingFocus.actions.moveToFirst();
rovingFocus.actions.moveToLast();

rovingFocus.getState().activeId; // → 'tab-1'
```

```tsx
// In a tab bar component
function TabBar({ tabs }: { tabs: Tab[] }) {
  const roving = useRovingFocusBehavior({ orientation: 'horizontal', loop: true });

  return (
    <div role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          tabIndex={roving.activeId === tab.id ? 0 : -1}
          aria-selected={roving.activeId === tab.id}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') roving.moveNext();
            if (e.key === 'ArrowLeft')  roving.movePrevious();
          }}
          onClick={() => roving.setActive(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

### Form Behaviour

```typescript
import { createFormBehavior } from '@web-loom/ui-core';

const form = createFormBehavior({
  fields: ['email', 'password'],
  initialValues: { email: '', password: '' },
  validate: (values) => {
    const errors: Record<string, string> = {};
    if (!values.email.includes('@')) errors.email = 'Invalid email';
    if (values.password.length < 8)  errors.password = 'Too short';
    return errors;
  },
});

form.actions.setValue('email', 'user@example.com');
form.actions.setTouched('email');
form.actions.submit();

const { values, errors, touched, isSubmitting, isValid } = form.getState();
```

The form behaviour manages field values, validation errors, touched state (whether the user has interacted with a field), and submission state. It doesn't render inputs — you bind the values and callbacks to whatever inputs you're using.

### Other Behaviours

- **`createDisclosureBehavior`** — toggle show/hide for accordions, expandable sections, tooltips
- **`createDragDropBehavior`** — drag-and-drop state management (drag source, drop target, dragging item)
- **`createKeyboardShortcutsBehavior`** — register named shortcuts with callbacks, handle conflicts
- **`createUndoRedoBehavior`** — undo/redo stack for any serialisable state

---

## How This Differs From Radix UI and Headless UI

**Radix UI** provides fully-composed React components with headless behaviour. You import `<Dialog.Root>`, `<Dialog.Trigger>`, `<Dialog.Content>` etc. and compose them. The behaviour and markup structure are React-specific. Excellent library — but you can't use it in Vue, Angular, or Vanilla JS.

**Headless UI** (Tailwind Labs) is also React/Vue specific, providing compound components that manage ARIA and keyboard behaviour. The API is elegant but framework-bound.

**React Aria** (Adobe) goes furthest in the accessibility direction — built to meet WAI-ARIA 1.2 compliance. Also React-specific.

`@web-loom/ui-core` takes a different position: the behaviour state is framework-agnostic, implemented in `store-core`. Framework integration is thin optional adapters. The same `createDialogBehavior` works in a React hook, a Vue composable, a Web Component lifecycle, or a vanilla JS module.

The tradeoff is that `ui-core` doesn't provide the full ARIA-attribute wiring that Radix or React Aria does — you're responsible for applying the right attributes to your markup based on the behaviour state. The behaviour tells you `isOpen: true`; you put `aria-expanded="true"` on the trigger. This is more work than Radix, but it works everywhere.

---

## The Table Helper

`ui-core` also exports a table helper for managing complex table state — sorting, filtering, pagination, column visibility:

```typescript
import { createTable } from '@web-loom/ui-core';

const table = createTable({
  data: products,
  columns: [
    { id: 'name',  accessor: p => p.name,  sortable: true },
    { id: 'price', accessor: p => p.price, sortable: true },
    { id: 'stock', accessor: p => p.stock, sortable: false },
  ],
  pageSize: 25,
});

table.actions.sort('price', 'desc');
table.actions.setPage(2);
table.actions.setFilter('name', 'headphone');
table.actions.toggleColumn('stock');

const { rows, totalPages, currentPage, sortState } = table.getState();
```

This covers the table interaction state that's tedious to implement correctly and usually ends up re-implemented in every project that has a data-heavy view.

---

## Composing Behaviours

Behaviours compose naturally because they're independent stores. A `MasterDetail` view might combine list selection with a roving focus manager and a disclosure for the detail panel:

```typescript
const selection  = createListSelectionBehavior({ mode: 'single', items, getId });
const rovingFocus = createRovingFocusBehavior({ orientation: 'vertical' });
const detailPanel = createDisclosureBehavior({ open: false });

// When selection changes, open the detail panel
selection.subscribe(({ selectedItems }) => {
  if (selectedItems.length > 0) detailPanel.actions.open();
  else detailPanel.actions.close();
});
```

Because each behaviour is an independent store, they can be subscribed to and reacted to without any coupling between them. The composition logic lives in your ViewModel or component, which is where it belongs.

---

## Why the Behaviour Layer Matters

Frontend teams generally have two choices for UI complexity: build it themselves or use a component library. Building it themselves means repeated, often incorrect, implementations of focus management, keyboard navigation, and ARIA semantics across every project. Using a component library means accepting its design system and, often, its framework.

The behaviour layer is a third option: encode the correctness rules once, in plain TypeScript, and connect them to whatever markup and styles you're using. The work of getting dialog focus management right happens once. The visual design remains entirely yours.

This is how the platform should work. The browser gives you `<dialog>`, `role="dialog"`, `tabIndex`, and `addEventListener`. `ui-core` gives you the state machine on top of those primitives. Your components give them a face.

---

## Installing

```bash
npm install @web-loom/ui-core
```

`@web-loom/store-core` is the only dependency. React adapters (hooks) are included in the package and imported from `@web-loom/ui-core/react`.

---

Next in the series: `@web-loom/ui-patterns`, which composes `ui-core` behaviours into complete higher-level interaction shells — wizard flows, master-detail layouts, command palettes, and more.
