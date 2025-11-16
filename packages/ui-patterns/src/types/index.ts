/**
 * Type definitions for UI Patterns
 * 
 * This module exports all TypeScript type definitions for UI Patterns.
 * These types provide full type safety and excellent IDE autocomplete support.
 * 
 * @packageDocumentation
 */

// ============================================================================
// Master-Detail Pattern Types
// ============================================================================

export {
  type MasterDetailState,
  type MasterDetailActions,
  type MasterDetailEvents,
  type MasterDetailOptions,
  type MasterDetailBehavior,
} from '../patterns/master-detail';

// ============================================================================
// Tabbed Interface Pattern Types
// ============================================================================

export {
  type Tab,
  type TabbedInterfaceState,
  type TabbedInterfaceActions,
  type TabbedInterfaceOptions,
  type TabbedInterfaceBehavior,
} from '../patterns/tabbed-interface';

// ============================================================================
// Sidebar Shell Pattern Types
// ============================================================================

export {
  type SidebarShellState,
  type SidebarShellActions,
  type SidebarShellEvents,
  type SidebarShellOptions,
  type SidebarShellBehavior,
} from '../patterns/sidebar-shell';

// ============================================================================
// Wizard Pattern Types
// ============================================================================

export {
  type WizardStep,
  type WizardState,
  type WizardActions,
  type WizardOptions,
  type WizardBehavior,
} from '../patterns/wizard';

// ============================================================================
// Modal Pattern Types
// ============================================================================

export {
  type Modal,
  type ModalState,
  type ModalActions,
  type ModalEvents,
  type ModalOptions,
  type ModalBehavior,
} from '../patterns/modal';

// ============================================================================
// Toast Queue Pattern Types
// ============================================================================

export {
  type ToastType,
  type Toast,
  type ToastQueueState,
  type ToastQueueActions,
  type ToastQueueOptions,
  type ToastQueueBehavior,
} from '../patterns/toast-queue';

// ============================================================================
// Command Palette Pattern Types
// ============================================================================

export {
  type Command,
  type CommandPaletteState,
  type CommandPaletteActions,
  type CommandPaletteOptions,
  type CommandPaletteBehavior,
} from '../patterns/command-palette';
