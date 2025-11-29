# Integration Examples

This document describes the six integration examples added to the UI Patterns Playground to demonstrate the new behaviors and patterns from the UI Core & Patterns Gap Closure project.

## Examples Overview

### 1. Text Editor with Undo/Redo

**Location:** `src/components/examples/TextEditorExample.tsx`

**Demonstrates:**
- `useUndoRedoStack` hook for managing text editing history
- Undo/redo operations with keyboard shortcuts
- State history visualization showing past, present, and future states
- Configurable maximum history length (50 states)

**Key Features:**
- Real-time text editing with automatic state tracking
- Visual indicators for undo/redo availability
- History visualization showing the last 5 past states and next 5 future states
- Character count for each state in history

### 2. Command Palette with Keyboard Shortcuts

**Location:** `src/components/examples/CommandPaletteExample.tsx`

**Demonstrates:**
- `useKeyboardShortcuts` hook for global keyboard shortcuts
- `createCommandPalette` pattern for command search and execution
- Keyboard shortcuts help panel
- Command execution tracking

**Key Features:**
- Ctrl+K to open/close command palette
- Escape to close palette
- Shift+/ (?) to toggle keyboard shortcuts help
- Search and filter commands
- Command execution log

**Registered Shortcuts:**
- `Ctrl+K` - Toggle command palette
- `Escape` - Close command palette
- `Shift+/` - Toggle shortcuts help

### 3. Kanban Board with Drag-and-Drop

**Location:** `src/components/examples/KanbanBoardExample.tsx`

**Demonstrates:**
- `useDragDropBehavior` hook for drag-and-drop operations
- Moving tasks between columns
- Keyboard alternative for accessibility
- Real-time drag state visualization

**Key Features:**
- Drag-and-drop tasks between three columns (To Do, In Progress, Done)
- Visual feedback during drag operations (dragging state, drop target highlighting)
- Keyboard mode with left/right arrow keys for accessibility
- Drag state information panel showing isDragging, draggedItem, and dropTarget

### 4. Photo Gallery with Grid Layout

**Location:** `src/components/examples/PhotoGalleryExample.tsx`

**Demonstrates:**
- `createGridLayout` pattern with responsive breakpoints
- Keyboard navigation with arrow keys
- Breakpoint changes visualization
- Single selection mode

**Key Features:**
- Responsive grid with 4 breakpoints:
  - Mobile: 1 column (0px+)
  - Small Tablet: 2 columns (480px+)
  - Tablet: 3 columns (768px+)
  - Desktop: 4 columns (1024px+)
- Arrow key navigation (up, down, left, right)
- Enter/Space to select photos
- Visual focus and selection indicators
- Real-time viewport width and column count display
- Selected photo detail view

### 5. Settings Interface with Hub & Spoke

**Location:** `src/components/examples/SettingsInterfaceExample.tsx`

**Demonstrates:**
- `createHubAndSpoke` pattern for hierarchical navigation
- Breadcrumb tracking
- Nested spokes for sub-categories
- Navigation history with back button

**Key Features:**
- Central hub with 4 main categories (Account, Appearance, Notifications, Advanced)
- Nested spokes for sub-categories (e.g., Account → Profile, Security, Privacy)
- Breadcrumb navigation showing current path
- Return to Hub and Go Back buttons
- Navigation state visualization
- Settings with toggles and text values

**Navigation Structure:**
```
Settings (Hub)
├── Account
│   ├── Profile
│   ├── Security
│   └── Privacy
├── Appearance
│   ├── Theme
│   └── Layout
├── Notifications
│   ├── Email
│   └── Push
└── Advanced
```

### 6. Scroll-Aware Floating Action Button

**Location:** `src/components/examples/ScrollAwareFABExample.tsx`

**Demonstrates:**
- `createFloatingActionButton` pattern
- Scroll-based visibility control
- hideOnScrollDown behavior
- Configurable threshold

**Key Features:**
- Threshold-based visibility (shows after scrolling past threshold)
- Hide on scroll down behavior (optional)
- Scroll direction detection (up/down)
- Configurable threshold with slider (0-500px)
- Real-time scroll state visualization
- Event logging for visibility changes
- Scroll to top functionality

## Running the Examples

1. Start the playground app:
   ```bash
   cd apps/ui-patterns-playground
   npm run dev
   ```

2. Navigate to the UI Patterns page in the app

3. Select an example from the navigation menu

## Technical Implementation

All examples follow these patterns:

1. **React Hooks Integration:** Use the React adapters (`useUndoRedoStack`, `useKeyboardShortcuts`, `useDragDropBehavior`)

2. **Pattern Creation:** Use the pattern factory functions (`createCommandPalette`, `createGridLayout`, `createHubAndSpoke`, `createFloatingActionButton`)

3. **State Visualization:** Each example includes a state visualization panel showing the current state of the behavior/pattern

4. **Accessibility:** Examples include keyboard alternatives and ARIA-friendly implementations

5. **Responsive Design:** Examples adapt to different screen sizes using CSS Grid and Flexbox

## CSS Styling

All examples share common styles defined in `src/components/examples/examples.css`:

- Consistent color scheme and spacing
- Responsive grid layouts
- Interactive hover and focus states
- Accessibility-friendly visual indicators
- Mobile-responsive breakpoints

## Requirements Validation

These examples validate the following requirements from the spec:

- **Requirement 19.1:** Text Editor example with Undo/Redo
- **Requirement 19.2:** Command Palette example with Keyboard Shortcuts
- **Requirement 19.3:** Kanban Board example with Drag-and-Drop
- **Requirement 19.4:** Photo Gallery example with Grid Layout
- **Requirement 19.5:** Settings Interface example with Hub & Spoke
- **Requirement 19.6:** Scroll-Aware FAB example
- **Requirement 19.8:** Examples available in the playground application

## Future Enhancements

Potential improvements for these examples:

1. Add more commands to the Command Palette
2. Implement task editing in the Kanban Board
3. Add image upload to the Photo Gallery
4. Persist settings in the Settings Interface
5. Add animation transitions for smoother interactions
6. Implement keyboard shortcuts for all examples
