import { createStore, type Store } from '@web-loom/store-core';
import { createDialogBehavior, type DialogBehavior } from '@web-loom/ui-core';
import { createRovingFocus, type RovingFocusBehavior } from '@web-loom/ui-core';

/**
 * Represents a command in the command palette.
 */
export interface Command {
  /**
   * Unique identifier for the command.
   */
  id: string;

  /**
   * Display label for the command.
   */
  label: string;

  /**
   * Optional category for grouping commands.
   */
  category?: string;

  /**
   * Optional keywords for fuzzy search matching.
   */
  keywords?: string[];

  /**
   * Optional keyboard shortcut display (e.g., "Ctrl+S").
   */
  shortcut?: string;

  /**
   * The action to execute when the command is selected.
   */
  action: () => void | Promise<void>;
}

/**
 * Represents the state of a command palette pattern.
 */
export interface CommandPaletteState {
  /**
   * Whether the command palette is currently open.
   */
  isOpen: boolean;

  /**
   * The current search query.
   */
  query: string;

  /**
   * All registered commands.
   */
  commands: Command[];

  /**
   * Commands filtered by the current query.
   */
  filteredCommands: Command[];

  /**
   * The index of the currently selected command in filteredCommands.
   */
  selectedIndex: number;
}

/**
 * Actions available for controlling the command palette pattern.
 */
export interface CommandPaletteActions {
  /**
   * Opens the command palette.
   */
  open: () => void;

  /**
   * Closes the command palette.
   */
  close: () => void;

  /**
   * Sets the search query and filters commands.
   * @param query The search query string.
   */
  setQuery: (query: string) => void;

  /**
   * Executes a command by its ID.
   * @param commandId The ID of the command to execute.
   * @returns Promise that resolves when the command completes.
   */
  executeCommand: (commandId: string) => Promise<void>;

  /**
   * Registers a new command.
   * @param command The command to register.
   */
  registerCommand: (command: Command) => void;

  /**
   * Unregisters a command by its ID.
   * @param commandId The ID of the command to unregister.
   */
  unregisterCommand: (commandId: string) => void;

  /**
   * Moves selection to the next filtered command.
   * Delegates to the underlying roving focus behavior's moveNext action.
   */
  selectNext: () => void;

  /**
   * Moves selection to the previous filtered command.
   * Delegates to the underlying roving focus behavior's movePrevious action.
   */
  selectPrevious: () => void;

  /**
   * Executes the currently selected command.
   * @returns Promise that resolves when the command completes.
   */
  executeSelected: () => Promise<void>;
}

/**
 * Options for configuring the command palette pattern.
 */
export interface CommandPaletteOptions {
  /**
   * Initial commands to register.
   * @default []
   */
  commands?: Command[];

  /**
   * Optional callback invoked when the palette opens.
   */
  onOpen?: () => void;

  /**
   * Optional callback invoked when the palette closes.
   */
  onClose?: () => void;

  /**
   * Optional callback invoked when a command is executed.
   * @param command The command that was executed.
   */
  onCommandExecute?: (command: Command) => void;
}

/**
 * The command palette pattern interface returned by createCommandPalette.
 */
export interface CommandPaletteBehavior {
  /**
   * Gets the current state of the command palette.
   */
  getState: () => CommandPaletteState;

  /**
   * Subscribes to state changes.
   * @param listener Function called when state changes.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: (state: CommandPaletteState) => void) => () => void;

  /**
   * Actions for controlling the command palette.
   */
  actions: CommandPaletteActions;

  /**
   * The roving focus behavior for keyboard navigation.
   */
  rovingFocus: RovingFocusBehavior;

  /**
   * Destroys the behavior and cleans up subscriptions.
   */
  destroy: () => void;
}

/**
 * Performs fuzzy matching on a string against a query.
 * Returns a score (higher is better) or -1 if no match.
 *
 * @param str The string to match against.
 * @param query The search query.
 * @returns Match score or -1 if no match.
 */
function fuzzyMatch(str: string, query: string): number {
  const lowerStr = str.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Empty query matches everything with score 0
  if (lowerQuery.length === 0) {
    return 0;
  }

  let score = 0;
  let queryIndex = 0;
  let lastMatchIndex = -1;

  for (let i = 0; i < lowerStr.length && queryIndex < lowerQuery.length; i++) {
    if (lowerStr[i] === lowerQuery[queryIndex]) {
      // Character match found
      score += 1;

      // Bonus for consecutive matches
      if (lastMatchIndex === i - 1) {
        score += 5;
      }

      // Bonus for match at word boundary
      if (i === 0 || lowerStr[i - 1] === ' ' || lowerStr[i - 1] === '-') {
        score += 10;
      }

      lastMatchIndex = i;
      queryIndex++;
    }
  }

  // If we didn't match all query characters, no match
  if (queryIndex < lowerQuery.length) {
    return -1;
  }

  return score;
}

/**
 * Filters and sorts commands based on a fuzzy search query.
 *
 * @param commands All available commands.
 * @param query The search query.
 * @returns Filtered and sorted commands.
 */
function filterCommands(commands: Command[], query: string): Command[] {
  if (query.trim() === '') {
    // No query, return all commands
    return [...commands];
  }

  // Score each command
  const scoredCommands = commands
    .map((command) => {
      // Match against label
      let score = fuzzyMatch(command.label, query);

      // Also match against category
      if (command.category) {
        const categoryScore = fuzzyMatch(command.category, query);
        if (categoryScore > score) {
          score = categoryScore;
        }
      }

      // Also match against keywords
      if (command.keywords) {
        for (const keyword of command.keywords) {
          const keywordScore = fuzzyMatch(keyword, query);
          if (keywordScore > score) {
            score = keywordScore;
          }
        }
      }

      return { command, score };
    })
    .filter((item) => item.score >= 0) // Only keep matches
    .sort((a, b) => b.score - a.score); // Sort by score descending

  return scoredCommands.map((item) => item.command);
}

/**
 * Creates a command palette pattern for keyboard-driven command interfaces.
 *
 * This pattern composes dialog behavior for open/close state and roving focus
 * for keyboard navigation. It provides fuzzy search filtering to help users
 * quickly find and execute commands.
 *
 * @example
 * ```typescript
 * const commandPalette = createCommandPalette({
 *   commands: [
 *     {
 *       id: 'save',
 *       label: 'Save File',
 *       category: 'File',
 *       keywords: ['write', 'persist'],
 *       shortcut: 'Ctrl+S',
 *       action: () => console.log('Saving file...'),
 *     },
 *     {
 *       id: 'open',
 *       label: 'Open File',
 *       category: 'File',
 *       shortcut: 'Ctrl+O',
 *       action: () => console.log('Opening file...'),
 *     },
 *     {
 *       id: 'search',
 *       label: 'Search in Files',
 *       category: 'Search',
 *       keywords: ['find', 'grep'],
 *       shortcut: 'Ctrl+Shift+F',
 *       action: () => console.log('Searching...'),
 *     },
 *   ],
 *   onCommandExecute: (command) => {
 *     console.log('Executed:', command.label);
 *   },
 * });
 *
 * // Open the palette
 * commandPalette.actions.open();
 *
 * // Search for commands
 * commandPalette.actions.setQuery('save');
 * console.log(commandPalette.getState().filteredCommands.length); // 1
 *
 * // Navigate with keyboard (using convenience methods)
 * commandPalette.actions.selectNext();
 * commandPalette.actions.selectPrevious();
 *
 * // Execute the selected command (using convenience method)
 * await commandPalette.actions.executeSelected();
 *
 * // Or navigate with roving focus directly
 * commandPalette.rovingFocus.actions.moveNext();
 *
 * // Or execute a specific command by ID
 * const state = commandPalette.getState();
 * const selectedCommand = state.filteredCommands[state.selectedIndex];
 * await commandPalette.actions.executeCommand(selectedCommand.id);
 *
 * // Register a new command
 * commandPalette.actions.registerCommand({
 *   id: 'close',
 *   label: 'Close File',
 *   category: 'File',
 *   action: () => console.log('Closing file...'),
 * });
 *
 * // Clean up
 * commandPalette.destroy();
 * ```
 *
 * @param options Configuration options for the command palette pattern.
 * @returns A command palette pattern instance.
 */
export function createCommandPalette(options?: CommandPaletteOptions): CommandPaletteBehavior {
  const initialCommands = options?.commands || [];

  // Create dialog behavior for open/close state
  const dialogBehavior: DialogBehavior = createDialogBehavior({
    id: 'command-palette',
    onOpen: options?.onOpen,
    onClose: options?.onClose,
  });

  // Create roving focus for keyboard navigation
  const rovingFocusBehavior: RovingFocusBehavior = createRovingFocus({
    items: initialCommands.map((cmd) => cmd.id),
    orientation: 'vertical',
    wrap: true,
    initialIndex: 0,
  });

  // Create store for command palette state
  const initialState: CommandPaletteState = {
    isOpen: false,
    query: '',
    commands: initialCommands,
    filteredCommands: initialCommands,
    selectedIndex: 0,
  };

  let storeSet: ((updater: (state: CommandPaletteState) => CommandPaletteState) => void) | null = null;

  const store: Store<CommandPaletteState, CommandPaletteActions> = createStore<
    CommandPaletteState,
    CommandPaletteActions
  >(initialState, (set, get, actions) => {
    // Capture the set function for use in subscriptions
    storeSet = set;

    return {
      open: () => {
        // Open the dialog
        dialogBehavior.actions.open({});

        // Reset query and selection
        set((state) => ({
          ...state,
          isOpen: true,
          query: '',
          filteredCommands: state.commands,
          selectedIndex: 0,
        }));

        // Update roving focus items
        const state = get();
        rovingFocusBehavior.actions.setItems(state.filteredCommands.map((cmd) => cmd.id));
        rovingFocusBehavior.actions.moveTo(0);
      },

      close: () => {
        // Close the dialog
        dialogBehavior.actions.close();

        set((state) => ({
          ...state,
          isOpen: false,
        }));
      },

      setQuery: (query: string) => {
        const state = get();

        // Filter commands based on query
        const filteredCommands = filterCommands(state.commands, query);

        set((state) => ({
          ...state,
          query,
          filteredCommands,
          selectedIndex: 0, // Reset selection to first item
        }));

        // Update roving focus items
        rovingFocusBehavior.actions.setItems(filteredCommands.map((cmd) => cmd.id));
        rovingFocusBehavior.actions.moveTo(0);
      },

      executeCommand: async (commandId: string) => {
        const state = get();

        // Find the command
        const command = state.commands.find((cmd) => cmd.id === commandId);
        if (!command) {
          console.error(`Command not found: ${commandId}`);
          return;
        }

        // Close the palette
        actions.close();

        // Execute the command
        try {
          await Promise.resolve(command.action());

          // Invoke callback
          if (options?.onCommandExecute) {
            options.onCommandExecute(command);
          }
        } catch (err) {
          console.error(`Error executing command ${commandId}:`, err);
        }
      },

      registerCommand: (command: Command) => {
        const state = get();

        // Check if command already exists
        const existingIndex = state.commands.findIndex((cmd) => cmd.id === command.id);
        if (existingIndex !== -1) {
          // Update existing command
          const updatedCommands = [...state.commands];
          updatedCommands[existingIndex] = command;

          set((state) => ({
            ...state,
            commands: updatedCommands,
            filteredCommands: filterCommands(updatedCommands, state.query),
          }));
        } else {
          // Add new command
          const updatedCommands = [...state.commands, command];

          set((state) => ({
            ...state,
            commands: updatedCommands,
            filteredCommands: filterCommands(updatedCommands, state.query),
          }));
        }

        // Update roving focus items
        const newState = get();
        rovingFocusBehavior.actions.setItems(newState.filteredCommands.map((cmd) => cmd.id));
      },

      unregisterCommand: (commandId: string) => {
        const state = get();

        // Remove command
        const updatedCommands = state.commands.filter((cmd) => cmd.id !== commandId);

        set((state) => ({
          ...state,
          commands: updatedCommands,
          filteredCommands: filterCommands(updatedCommands, state.query),
        }));

        // Update roving focus items
        const newState = get();
        rovingFocusBehavior.actions.setItems(newState.filteredCommands.map((cmd) => cmd.id));

        // Adjust selected index if needed
        if (newState.selectedIndex >= newState.filteredCommands.length) {
          set((state) => ({
            ...state,
            selectedIndex: Math.max(0, newState.filteredCommands.length - 1),
          }));
        }
      },

      selectNext: () => {
        // Delegate to roving focus moveNext
        rovingFocusBehavior.actions.moveNext();
      },

      selectPrevious: () => {
        // Delegate to roving focus movePrevious
        rovingFocusBehavior.actions.movePrevious();
      },

      executeSelected: async () => {
        const state = get();

        // Get the currently selected command from filtered commands
        if (state.filteredCommands.length === 0) {
          console.warn('Cannot execute: no commands available');
          return;
        }

        if (state.selectedIndex < 0 || state.selectedIndex >= state.filteredCommands.length) {
          console.error(`Invalid selected index: ${state.selectedIndex}`);
          return;
        }

        const selectedCommand = state.filteredCommands[state.selectedIndex];

        // Execute the selected command
        await actions.executeCommand(selectedCommand.id);
      },
    };
  });

  // Subscribe to roving focus changes to update selected index
  rovingFocusBehavior.subscribe((rovingState) => {
    if (storeSet) {
      storeSet((state) => ({
        ...state,
        selectedIndex: rovingState.currentIndex,
      }));
    }
  });

  // Subscribe to dialog changes to update isOpen state
  dialogBehavior.subscribe((dialogState) => {
    if (storeSet) {
      storeSet((state) => ({
        ...state,
        isOpen: dialogState.isOpen,
      }));
    }
  });

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    actions: store.actions,
    rovingFocus: rovingFocusBehavior,
    destroy: () => {
      dialogBehavior.destroy();
      rovingFocusBehavior.destroy();
      store.destroy();
    },
  };
}
