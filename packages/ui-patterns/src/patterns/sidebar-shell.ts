import { createStore, type Store } from '@web-loom/store-core';
import { createEventBus, type EventBus } from '@web-loom/event-bus-core';
import { createDisclosureBehavior, type DisclosureBehavior } from '@web-loom/ui-core';

/**
 * Represents the state of a sidebar shell pattern.
 */
export interface SidebarShellState {
  /**
   * Whether the sidebar is currently expanded.
   */
  isExpanded: boolean;

  /**
   * The currently active section identifier, or null if no section is active.
   */
  activeSection: string | null;

  /**
   * Whether the sidebar is pinned (remains open).
   */
  isPinned: boolean;

  /**
   * The width of the sidebar in pixels.
   */
  width: number;
}

/**
 * Actions available for controlling the sidebar shell pattern.
 */
export interface SidebarShellActions {
  /**
   * Expands the sidebar.
   */
  expand: () => void;

  /**
   * Collapses the sidebar.
   */
  collapse: () => void;

  /**
   * Toggles the sidebar expanded/collapsed state.
   */
  toggle: () => void;

  /**
   * Sets the active section.
   * @param section The section identifier to activate.
   */
  setActiveSection: (section: string) => void;

  /**
   * Toggles the pinned state of the sidebar.
   */
  togglePin: () => void;

  /**
   * Sets the width of the sidebar.
   * @param width The width in pixels.
   */
  setWidth: (width: number) => void;
}

/**
 * Event map for sidebar shell pattern events.
 */
export interface SidebarShellEvents extends Record<string, any[]> {
  'sidebar:expanded': [];
  'sidebar:collapsed': [];
  'sidebar:pinned': [];
  'sidebar:unpinned': [];
  'section:changed': [section: string];
  'width:changed': [width: number];
}

/**
 * Options for configuring the sidebar shell pattern.
 */
export interface SidebarShellOptions {
  /**
   * Initial expanded state.
   * @default false
   */
  initialExpanded?: boolean;

  /**
   * Initial active section.
   * @default null
   */
  initialActiveSection?: string | null;

  /**
   * Initial pinned state.
   * @default false
   */
  initialPinned?: boolean;

  /**
   * Initial width in pixels.
   * @default 250
   */
  initialWidth?: number;

  /**
   * Optional callback invoked when the sidebar expands.
   */
  onExpand?: () => void;

  /**
   * Optional callback invoked when the sidebar collapses.
   */
  onCollapse?: () => void;

  /**
   * Optional callback invoked when the active section changes.
   * @param section The newly active section identifier.
   */
  onSectionChange?: (section: string) => void;
}

/**
 * The sidebar shell pattern interface returned by createSidebarShell.
 */
export interface SidebarShellBehavior {
  /**
   * Gets the current state of the sidebar shell.
   */
  getState: () => SidebarShellState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: SidebarShellState) => void) => () => void;

  /**
   * Actions for controlling the sidebar shell.
   */
  actions: SidebarShellActions;

  /**
   * Event bus for listening to sidebar shell events.
   */
  eventBus: EventBus<SidebarShellEvents>;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Creates a sidebar shell pattern with collapse/expand behavior.
 * 
 * This pattern composes the disclosure behavior from UI Core with additional
 * sidebar-specific functionality like pinning, section management, and width control.
 * It's ideal for building application layouts with collapsible navigation sidebars.
 * 
 * @example
 * ```typescript
 * const sidebar = createSidebarShell({
 *   initialExpanded: true,
 *   initialWidth: 300,
 *   initialPinned: false,
 *   onExpand: () => console.log('Sidebar expanded'),
 *   onCollapse: () => console.log('Sidebar collapsed'),
 *   onSectionChange: (section) => console.log('Active section:', section),
 * });
 * 
 * // Listen to events
 * sidebar.eventBus.on('sidebar:expanded', () => {
 *   console.log('Sidebar expanded event');
 * });
 * 
 * sidebar.eventBus.on('section:changed', (section) => {
 *   console.log('Section changed to:', section);
 * });
 * 
 * // Expand the sidebar
 * sidebar.actions.expand();
 * console.log(sidebar.getState().isExpanded); // true
 * 
 * // Set active section
 * sidebar.actions.setActiveSection('navigation');
 * console.log(sidebar.getState().activeSection); // 'navigation'
 * 
 * // Pin the sidebar
 * sidebar.actions.togglePin();
 * console.log(sidebar.getState().isPinned); // true
 * 
 * // Set width
 * sidebar.actions.setWidth(350);
 * console.log(sidebar.getState().width); // 350
 * 
 * // Clean up
 * sidebar.destroy();
 * ```
 * 
 * @param options Configuration options for the sidebar shell pattern.
 * @returns A sidebar shell pattern instance.
 */
export function createSidebarShell(
  options?: SidebarShellOptions
): SidebarShellBehavior {
  const initialExpanded = options?.initialExpanded ?? false;
  const initialActiveSection = options?.initialActiveSection ?? null;
  const initialPinned = options?.initialPinned ?? false;
  const initialWidth = options?.initialWidth ?? 250;

  // Create event bus for sidebar shell events
  const eventBus = createEventBus<SidebarShellEvents>();

  // Create disclosure behavior for collapse/expand logic
  const disclosure: DisclosureBehavior = createDisclosureBehavior({
    id: 'sidebar-shell',
    initialExpanded,
    onExpand: () => {
      // Invoke onExpand callback if provided
      if (options?.onExpand) {
        options.onExpand();
      }

      // Emit event
      eventBus.emit('sidebar:expanded');
    },
    onCollapse: () => {
      // Invoke onCollapse callback if provided
      if (options?.onCollapse) {
        options.onCollapse();
      }

      // Emit event
      eventBus.emit('sidebar:collapsed');
    },
  });

  // Subscribe to disclosure state changes to sync with sidebar shell state
  const disclosureUnsubscribe = disclosure.subscribe((disclosureState) => {
    store.actions.syncExpanded(disclosureState.isExpanded);
  });

  // Create store for sidebar shell state
  const initialState: SidebarShellState = {
    isExpanded: initialExpanded,
    activeSection: initialActiveSection,
    isPinned: initialPinned,
    width: initialWidth,
  };

  interface InternalActions {
    syncExpanded: (isExpanded: boolean) => void;
  }

  const store: Store<SidebarShellState, SidebarShellActions & InternalActions> = createStore<
    SidebarShellState,
    SidebarShellActions & InternalActions
  >(initialState, (set) => ({
    expand: () => {
      disclosure.actions.expand();
    },

    collapse: () => {
      disclosure.actions.collapse();
    },

    toggle: () => {
      disclosure.actions.toggle();
    },

    setActiveSection: (section: string) => {
      set((state) => ({
        ...state,
        activeSection: section,
      }));

      // Invoke onSectionChange callback if provided
      if (options?.onSectionChange) {
        options.onSectionChange(section);
      }

      // Emit event
      eventBus.emit('section:changed', section);
    },

    togglePin: () => {
      set((state) => {
        const newPinned = !state.isPinned;

        // Emit event
        if (newPinned) {
          eventBus.emit('sidebar:pinned');
        } else {
          eventBus.emit('sidebar:unpinned');
        }

        return {
          ...state,
          isPinned: newPinned,
        };
      });
    },

    setWidth: (width: number) => {
      set((state) => ({
        ...state,
        width,
      }));

      // Emit event
      eventBus.emit('width:changed', width);
    },

    syncExpanded: (isExpanded: boolean) => {
      set((state) => ({
        ...state,
        isExpanded,
      }));
    },
  }));

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: {
      expand: store.actions.expand,
      collapse: store.actions.collapse,
      toggle: store.actions.toggle,
      setActiveSection: store.actions.setActiveSection,
      togglePin: store.actions.togglePin,
      setWidth: store.actions.setWidth,
    },
    eventBus,
    destroy: () => {
      disclosureUnsubscribe();
      disclosure.destroy();
      store.destroy();
    },
  };
}
