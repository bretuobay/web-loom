import { createStore, type Store } from '@web-loom/store-core';

/**
 * Represents a keyboard shortcut configuration.
 */
export interface KeyboardShortcut {
  /**
   * The key combination (e.g., "Ctrl+K", "Cmd+Shift+P", "Alt+F4").
   * Platform-specific keys (Cmd/Ctrl) are normalized internally.
   */
  key: string;

  /**
   * The handler function to execute when the shortcut is triggered.
   */
  handler: () => void;

  /**
   * Optional description for documentation and help displays.
   */
  description?: string;

  /**
   * Whether to prevent the default browser behavior for this key combination.
   * @default false
   */
  preventDefault?: boolean;

  /**
   * The scope of the shortcut.
   * - 'global': Active anywhere in the application
   * - 'scoped': Active only within a specific component boundary
   * @default 'global'
   */
  scope?: 'global' | 'scoped';
}

/**
 * Represents the state of the keyboard shortcuts behavior.
 */
export interface KeyboardShortcutsState {
  /**
   * Map of normalized key combinations to their shortcut configurations.
   */
  shortcuts: Map<string, KeyboardShortcut>;

  /**
   * The current scope ('global' or 'scoped').
   */
  scope: 'global' | 'scoped';

  /**
   * Array of currently registered shortcut keys (normalized).
   */
  activeShortcuts: string[];

  /**
   * Whether the keyboard shortcuts are currently enabled.
   */
  enabled: boolean;
}

/**
 * Actions available for controlling the keyboard shortcuts behavior.
 */
export interface KeyboardShortcutsActions {
  /**
   * Registers a new keyboard shortcut.
   * If a shortcut with the same key already exists, it will be replaced (last-wins strategy).
   * @param shortcut The shortcut configuration to register.
   */
  registerShortcut: (shortcut: KeyboardShortcut) => void;

  /**
   * Unregisters a keyboard shortcut by its key combination.
   * @param key The key combination to unregister.
   */
  unregisterShortcut: (key: string) => void;

  /**
   * Sets the current scope for shortcut execution.
   * @param scope The scope to set ('global' or 'scoped').
   */
  setScope: (scope: 'global' | 'scoped') => void;

  /**
   * Clears all registered shortcuts.
   */
  clearAllShortcuts: () => void;

  /**
   * Enables keyboard shortcut handling.
   */
  enable: () => void;

  /**
   * Disables keyboard shortcut handling.
   */
  disable: () => void;
}

/**
 * Options for configuring the keyboard shortcuts behavior.
 */
export interface KeyboardShortcutsOptions {
  /**
   * The initial scope for shortcuts.
   * @default 'global'
   */
  scope?: 'global' | 'scoped';

  /**
   * Optional callback invoked when a shortcut is executed.
   * @param key The normalized key combination that was executed.
   */
  onShortcutExecuted?: (key: string) => void;
}

/**
 * The keyboard shortcuts behavior interface returned by createKeyboardShortcuts.
 */
export interface KeyboardShortcutsBehavior {
  /**
   * Gets the current state of the keyboard shortcuts.
   */
  getState: () => KeyboardShortcutsState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: KeyboardShortcutsState) => void) => () => void;

  /**
   * Actions for controlling the keyboard shortcuts.
   */
  actions: KeyboardShortcutsActions;

  /**
   * Destroys the behavior and cleans up subscriptions and event listeners.
   */
  destroy: () => void;
}

/**
 * Parsed key combination structure.
 */
interface ParsedKeyCombo {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
  normalized: string;
  isValid: boolean;
}

/**
 * Parses a key combination string into its components.
 * Normalizes platform-specific keys (Cmd → Meta, Ctrl → Ctrl).
 * 
 * @param combo The key combination string (e.g., "Ctrl+K", "Cmd+Shift+P").
 * @returns Parsed key combination object.
 */
function parseKeyCombo(combo: string): ParsedKeyCombo {
  const parts = combo.split('+').map(p => p.trim());
  
  if (parts.length === 0) {
    return {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      key: '',
      normalized: '',
      isValid: false,
    };
  }

  const modifiers = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
  };

  let primaryKey = '';

  for (const part of parts) {
    const lower = part.toLowerCase();
    
    if (lower === 'ctrl' || lower === 'control') {
      modifiers.ctrl = true;
    } else if (lower === 'shift') {
      modifiers.shift = true;
    } else if (lower === 'alt' || lower === 'option') {
      modifiers.alt = true;
    } else if (lower === 'cmd' || lower === 'command' || lower === 'meta') {
      modifiers.meta = true;
    } else {
      // This is the primary key
      primaryKey = part;
    }
  }

  if (!primaryKey) {
    return {
      ...modifiers,
      key: '',
      normalized: '',
      isValid: false,
    };
  }

  // Build normalized string
  const normalizedParts: string[] = [];
  if (modifiers.ctrl) normalizedParts.push('Ctrl');
  if (modifiers.shift) normalizedParts.push('Shift');
  if (modifiers.alt) normalizedParts.push('Alt');
  if (modifiers.meta) normalizedParts.push('Meta');
  normalizedParts.push(primaryKey);

  return {
    ...modifiers,
    key: primaryKey,
    normalized: normalizedParts.join('+'),
    isValid: true,
  };
}

/**
 * Matches a keyboard event against a parsed key combination.
 * 
 * @param event The keyboard event.
 * @param parsed The parsed key combination.
 * @returns True if the event matches the key combination.
 */
function matchesKeyCombo(event: KeyboardEvent, parsed: ParsedKeyCombo): boolean {
  // Check modifiers
  if (event.ctrlKey !== parsed.ctrl) return false;
  if (event.shiftKey !== parsed.shift) return false;
  if (event.altKey !== parsed.alt) return false;
  if (event.metaKey !== parsed.meta) return false;

  // Check primary key (case-insensitive)
  const eventKey = event.key.toLowerCase();
  const parsedKey = parsed.key.toLowerCase();

  return eventKey === parsedKey;
}

/**
 * Creates a keyboard shortcuts behavior for managing keyboard shortcut registration and execution.
 * 
 * This behavior provides a centralized way to manage keyboard shortcuts with support for:
 * - Key combination parsing with platform normalization (Cmd/Ctrl)
 * - Global and scoped shortcuts
 * - Conflict resolution (last-wins strategy)
 * - Event delegation with a single global listener
 * 
 * @example
 * ```typescript
 * const shortcuts = createKeyboardShortcuts({
 *   scope: 'global',
 *   onShortcutExecuted: (key) => console.log(`Executed: ${key}`),
 * });
 * 
 * // Register a shortcut
 * shortcuts.actions.registerShortcut({
 *   key: 'Ctrl+K',
 *   handler: () => console.log('Command palette opened'),
 *   description: 'Open command palette',
 *   preventDefault: true,
 * });
 * 
 * // On macOS, you can use Cmd instead of Ctrl
 * shortcuts.actions.registerShortcut({
 *   key: 'Cmd+Shift+P',
 *   handler: () => console.log('Command palette opened'),
 *   description: 'Open command palette',
 *   preventDefault: true,
 * });
 * 
 * // Clean up
 * shortcuts.destroy();
 * ```
 * 
 * @param options Configuration options for the keyboard shortcuts behavior.
 * @returns A keyboard shortcuts behavior instance.
 */
export function createKeyboardShortcuts(
  options?: KeyboardShortcutsOptions
): KeyboardShortcutsBehavior {
  const initialState: KeyboardShortcutsState = {
    shortcuts: new Map(),
    scope: options?.scope || 'global',
    activeShortcuts: [],
    enabled: true,
  };

  const store: Store<KeyboardShortcutsState, KeyboardShortcutsActions> = createStore<
    KeyboardShortcutsState,
    KeyboardShortcutsActions
  >(initialState, (set, get) => ({
    registerShortcut: (shortcut: KeyboardShortcut) => {
      try {
        const parsed = parseKeyCombo(shortcut.key);
        
        if (!parsed.isValid) {
          console.error(`Invalid key combination: ${shortcut.key}`);
          return;
        }

        const normalizedKey = parsed.normalized;
        const state = get();

        // Check for duplicate registration (log warning)
        if (state.shortcuts.has(normalizedKey)) {
          console.warn(
            `Keyboard shortcut "${normalizedKey}" is already registered. Replacing with new handler (last-wins strategy).`
          );
        }

        // Create new shortcuts map with the new shortcut
        const newShortcuts = new Map(state.shortcuts);
        newShortcuts.set(normalizedKey, {
          ...shortcut,
          key: normalizedKey, // Store normalized key
          scope: shortcut.scope || 'global',
          preventDefault: shortcut.preventDefault ?? false,
        });

        set((state) => ({
          ...state,
          shortcuts: newShortcuts,
          activeShortcuts: Array.from(newShortcuts.keys()),
        }));
      } catch (error) {
        console.error('Failed to register keyboard shortcut:', error);
      }
    },

    unregisterShortcut: (key: string) => {
      const parsed = parseKeyCombo(key);
      
      if (!parsed.isValid) {
        console.error(`Invalid key combination: ${key}`);
        return;
      }

      const normalizedKey = parsed.normalized;
      const state = get();

      if (!state.shortcuts.has(normalizedKey)) {
        console.warn(`Keyboard shortcut "${normalizedKey}" is not registered.`);
        return;
      }

      const newShortcuts = new Map(state.shortcuts);
      newShortcuts.delete(normalizedKey);

      set((state) => ({
        ...state,
        shortcuts: newShortcuts,
        activeShortcuts: Array.from(newShortcuts.keys()),
      }));
    },

    setScope: (scope: 'global' | 'scoped') => {
      set((state) => ({
        ...state,
        scope,
      }));
    },

    clearAllShortcuts: () => {
      set((state) => ({
        ...state,
        shortcuts: new Map(),
        activeShortcuts: [],
      }));
    },

    enable: () => {
      set((state) => ({
        ...state,
        enabled: true,
      }));
    },

    disable: () => {
      set((state) => ({
        ...state,
        enabled: false,
      }));
    },
  }));

  // Global keyboard event handler
  const handleKeyDown = (event: KeyboardEvent) => {
    const state = store.getState();

    // If disabled, do nothing
    if (!state.enabled) {
      return;
    }

    // Try to match the event against registered shortcuts
    for (const [normalizedKey, shortcut] of state.shortcuts) {
      const parsed = parseKeyCombo(normalizedKey);
      
      if (matchesKeyCombo(event, parsed)) {
        // Check scope
        if (shortcut.scope === 'scoped' && state.scope !== 'scoped') {
          // Scoped shortcut but we're not in scoped mode
          continue;
        }

        // Prevent default if requested
        if (shortcut.preventDefault) {
          event.preventDefault();
        }

        // Execute handler
        try {
          shortcut.handler();
          
          // Invoke callback if provided
          if (options?.onShortcutExecuted) {
            options.onShortcutExecuted(normalizedKey);
          }
        } catch (error) {
          console.error(`Error executing keyboard shortcut "${normalizedKey}":`, error);
        }

        // Only execute the first matching shortcut
        break;
      }
    }
  };

  // Attach global event listener
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', handleKeyDown);
  }

  // Override destroy to clean up event listener
  const originalDestroy = store.destroy;
  const enhancedDestroy = () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', handleKeyDown);
    }
    originalDestroy();
  };

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    destroy: enhancedDestroy,
  };
}
