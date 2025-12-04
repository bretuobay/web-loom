# UI Core & Patterns Examples

This directory contains interactive examples demonstrating the usage of `@web-loom/ui-core` behaviors and `@web-loom/ui-patterns` in React applications.

## Examples

### 1. Dialog Behavior Example (`DialogExample.tsx`)

Demonstrates the `useDialogBehavior` hook from `@web-loom/ui-core/react`.

**Features:**

- Open/close dialog with content
- Toggle dialog state
- Lifecycle callbacks (onOpen, onClose)
- Modal overlay with click-outside-to-close
- State visualization

**Requirements Covered:** 7.1 (React Framework Adapter)

### 2. List Selection Example (`ListSelectionExample.tsx`)

Demonstrates the `useListSelection` hook with different selection modes.

**Features:**

- Single selection mode
- Multi-selection mode (Ctrl/Cmd + Click)
- Range selection mode (Shift + Click)
- Select all / Clear selection
- Visual feedback for selected items
- State visualization

**Requirements Covered:** 7.1 (React Framework Adapter)

### 3. Master-Detail Pattern Example (`MasterDetailExample.tsx`)

Demonstrates the `createMasterDetail` pattern from `@web-loom/ui-patterns`.

**Features:**

- Product list (master view)
- Synchronized detail view
- Selection change callbacks
- Event-driven architecture
- Rich detail display with product information
- State visualization

**Requirements Covered:** 10.1 (Master-Detail Pattern Implementation)

### 4. Wizard Pattern Example (`WizardExample.tsx`)

Demonstrates the `createWizard` pattern from `@web-loom/ui-patterns`.

**Features:**

- Multi-step form flow
- Step validation before progression
- Personal information step
- Preferences step
- Confirmation/review step
- Visual step indicator
- Navigation controls (Previous/Next/Complete)
- Form state management
- State visualization

**Requirements Covered:** 13.1 (Wizard Pattern Implementation)

### 5. Media Examples

- `MediaCoreExample.tsx` shows how to initialize `MediaCorePlayer` directly, mount it into a container, and interact with plugins/state.
- `MediaReactExample.tsx` demonstrates the `<MediaPlayer />` component and hooks from `@web-loom/media-react`, including snapshot visualization.

Both examples assume media assets live under `apps/ui-patterns-playground/src/assets` (add your own files and adjust the paths accordingly).

## Usage

All examples are accessible through the UI Patterns page at `/ui-patterns` route.

### Running the Examples

1. Ensure dependencies are installed:

   ```bash
   npm install
   ```

2. Build the required packages:

   ```bash
   npm run build --workspace=@web-loom/ui-core
   npm run build --workspace=@web-loom/ui-patterns
   ```

3. Start the development server:

   ```bash
   cd apps/ui-patterns-playground
   npm run dev
   ```

4. Navigate to `http://localhost:5173/ui-patterns`

## File Structure

```
examples/
├── DialogExample.tsx           # Dialog behavior demo
├── ListSelectionExample.tsx    # List selection demo
├── MasterDetailExample.tsx     # Master-detail pattern demo
├── WizardExample.tsx           # Wizard pattern demo
├── examples.css                # Shared styles for all examples
├── index.ts                    # Exports all examples
└── README.md                   # This file
```

## Styling

All examples use the shared `examples.css` file which provides:

- Consistent button styles
- Dialog/modal styling
- List and selection styling
- Master-detail layout
- Wizard step indicators
- Form controls
- Responsive design

## Integration

The examples are integrated into the main app through:

- `UIPatterns.tsx` - Main page component with navigation
- `App.tsx` - Route configuration
- `Header.tsx` - Navigation link

## Notes

- All examples demonstrate framework-agnostic behaviors adapted for React
- State is visualized in real-time for educational purposes
- Examples follow React best practices (hooks, cleanup, etc.)
- TypeScript types are fully utilized for type safety
