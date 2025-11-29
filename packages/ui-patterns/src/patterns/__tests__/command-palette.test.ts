import { describe, it, expect, vi } from 'vitest';
import { createCommandPalette, type Command } from '../command-palette';

describe('createCommandPalette', () => {
  const createTestCommands = (): Command[] => [
    {
      id: 'save',
      label: 'Save File',
      category: 'File',
      keywords: ['write', 'persist'],
      shortcut: 'Ctrl+S',
      action: vi.fn(),
    },
    {
      id: 'open',
      label: 'Open File',
      category: 'File',
      shortcut: 'Ctrl+O',
      action: vi.fn(),
    },
    {
      id: 'search',
      label: 'Search in Files',
      category: 'Search',
      keywords: ['find', 'grep'],
      shortcut: 'Ctrl+Shift+F',
      action: vi.fn(),
    },
    {
      id: 'close',
      label: 'Close Editor',
      category: 'File',
      action: vi.fn(),
    },
  ];

  describe('initial state', () => {
    it('should initialize with closed state', () => {
      const palette = createCommandPalette();

      const state = palette.getState();

      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.commands).toEqual([]);
      expect(state.filteredCommands).toEqual([]);
      expect(state.selectedIndex).toBe(0);

      palette.destroy();
    });

    it('should initialize with provided commands', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      const state = palette.getState();

      expect(state.commands).toHaveLength(4);
      expect(state.filteredCommands).toHaveLength(4);
      expect(state.commands).toEqual(commands);

      palette.destroy();
    });
  });

  describe('open action', () => {
    it('should open the palette', () => {
      const palette = createCommandPalette();

      palette.actions.open();
      const state = palette.getState();

      expect(state.isOpen).toBe(true);

      palette.destroy();
    });

    it('should reset query when opened', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('test');
      expect(palette.getState().query).toBe('test');

      palette.actions.open();
      const state = palette.getState();

      expect(state.query).toBe('');
      expect(state.filteredCommands).toHaveLength(4);

      palette.destroy();
    });

    it('should reset selection to first item when opened', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.rovingFocus.actions.moveTo(2);
      palette.actions.open();

      const state = palette.getState();

      expect(state.selectedIndex).toBe(0);

      palette.destroy();
    });

    it('should invoke onOpen callback', () => {
      const onOpen = vi.fn();
      const palette = createCommandPalette({ onOpen });

      palette.actions.open();

      expect(onOpen).toHaveBeenCalledTimes(1);

      palette.destroy();
    });
  });

  describe('close action', () => {
    it('should close the palette', () => {
      const palette = createCommandPalette();

      palette.actions.open();
      expect(palette.getState().isOpen).toBe(true);

      palette.actions.close();
      const state = palette.getState();

      expect(state.isOpen).toBe(false);

      palette.destroy();
    });

    it('should invoke onClose callback', () => {
      const onClose = vi.fn();
      const palette = createCommandPalette({ onClose });

      palette.actions.open();
      palette.actions.close();

      expect(onClose).toHaveBeenCalledTimes(1);

      palette.destroy();
    });
  });

  describe('setQuery action', () => {
    it('should update query state', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('save');
      const state = palette.getState();

      expect(state.query).toBe('save');

      palette.destroy();
    });

    it('should filter commands based on query', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('save');
      const state = palette.getState();

      expect(state.filteredCommands).toHaveLength(1);
      expect(state.filteredCommands[0].id).toBe('save');

      palette.destroy();
    });

    it('should filter commands by label', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('file');
      const state = palette.getState();

      // Should match "Save File", "Open File"
      expect(state.filteredCommands.length).toBeGreaterThanOrEqual(2);
      expect(state.filteredCommands.some((cmd) => cmd.id === 'save')).toBe(true);
      expect(state.filteredCommands.some((cmd) => cmd.id === 'open')).toBe(true);

      palette.destroy();
    });

    it('should filter commands by category', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('search');
      const state = palette.getState();

      // Should match "Search in Files" by both label and category
      expect(state.filteredCommands.some((cmd) => cmd.id === 'search')).toBe(true);

      palette.destroy();
    });

    it('should filter commands by keywords', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('find');
      const state = palette.getState();

      // Should match "Search in Files" by keyword
      expect(state.filteredCommands.some((cmd) => cmd.id === 'search')).toBe(true);

      palette.destroy();
    });

    it('should reset selection to first item when query changes', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.rovingFocus.actions.moveTo(2);
      palette.actions.setQuery('file');

      const state = palette.getState();

      expect(state.selectedIndex).toBe(0);

      palette.destroy();
    });

    it('should return all commands when query is empty', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('save');
      expect(palette.getState().filteredCommands).toHaveLength(1);

      palette.actions.setQuery('');
      const state = palette.getState();

      expect(state.filteredCommands).toHaveLength(4);

      palette.destroy();
    });
  });

  describe('fuzzy matching', () => {
    it('should match partial strings', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('sv');
      const state = palette.getState();

      // Should match "Save File" (s...v)
      expect(state.filteredCommands.some((cmd) => cmd.id === 'save')).toBe(true);

      palette.destroy();
    });

    it('should match non-consecutive characters', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('sf');
      const state = palette.getState();

      // Should match "Save File" and "Search in Files"
      expect(state.filteredCommands.length).toBeGreaterThan(0);

      palette.destroy();
    });

    it('should be case insensitive', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('SAVE');
      const state = palette.getState();

      expect(state.filteredCommands.some((cmd) => cmd.id === 'save')).toBe(true);

      palette.destroy();
    });

    it('should not match if characters are not in order', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('xyz');
      const state = palette.getState();

      expect(state.filteredCommands).toHaveLength(0);

      palette.destroy();
    });

    it('should rank exact matches higher', () => {
      const commands: Command[] = [
        { id: 'save', label: 'Save', action: vi.fn() },
        { id: 'save-as', label: 'Save As', action: vi.fn() },
        { id: 'autosave', label: 'Enable Autosave', action: vi.fn() },
      ];
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('save');
      const state = palette.getState();

      // "Save" should rank higher than "Save As" or "Enable Autosave"
      expect(state.filteredCommands[0].id).toBe('save');

      palette.destroy();
    });
  });

  describe('executeCommand action', () => {
    it('should execute command action', async () => {
      const action = vi.fn();
      const commands: Command[] = [
        { id: 'test', label: 'Test Command', action },
      ];
      const palette = createCommandPalette({ commands });

      await palette.actions.executeCommand('test');

      expect(action).toHaveBeenCalledTimes(1);

      palette.destroy();
    });

    it('should close palette after executing command', async () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.open();
      expect(palette.getState().isOpen).toBe(true);

      await palette.actions.executeCommand('save');

      const state = palette.getState();
      expect(state.isOpen).toBe(false);

      palette.destroy();
    });

    it('should invoke onCommandExecute callback', async () => {
      const onCommandExecute = vi.fn();
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands, onCommandExecute });

      await palette.actions.executeCommand('save');

      expect(onCommandExecute).toHaveBeenCalledTimes(1);
      expect(onCommandExecute).toHaveBeenCalledWith(commands[0]);

      palette.destroy();
    });

    it('should handle async command actions', async () => {
      const action = vi.fn().mockResolvedValue(undefined);
      const commands: Command[] = [
        { id: 'async', label: 'Async Command', action },
      ];
      const palette = createCommandPalette({ commands });

      await palette.actions.executeCommand('async');

      expect(action).toHaveBeenCalledTimes(1);

      palette.destroy();
    });

    it('should handle non-existent command gracefully', async () => {
      const palette = createCommandPalette();

      await expect(
        palette.actions.executeCommand('non-existent')
      ).resolves.not.toThrow();

      palette.destroy();
    });

    it('should handle command action errors', async () => {
      const action = vi.fn().mockRejectedValue(new Error('Command failed'));
      const commands: Command[] = [
        { id: 'error', label: 'Error Command', action },
      ];
      const palette = createCommandPalette({ commands });

      await expect(
        palette.actions.executeCommand('error')
      ).resolves.not.toThrow();

      expect(action).toHaveBeenCalledTimes(1);

      palette.destroy();
    });
  });

  describe('registerCommand action', () => {
    it('should add new command', () => {
      const palette = createCommandPalette();

      const newCommand: Command = {
        id: 'new',
        label: 'New Command',
        action: vi.fn(),
      };

      palette.actions.registerCommand(newCommand);
      const state = palette.getState();

      expect(state.commands).toHaveLength(1);
      expect(state.commands[0]).toEqual(newCommand);

      palette.destroy();
    });

    it('should update existing command with same ID', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      const updatedCommand: Command = {
        id: 'save',
        label: 'Save File (Updated)',
        action: vi.fn(),
      };

      palette.actions.registerCommand(updatedCommand);
      const state = palette.getState();

      expect(state.commands).toHaveLength(4);
      const saveCommand = state.commands.find((cmd) => cmd.id === 'save');
      expect(saveCommand?.label).toBe('Save File (Updated)');

      palette.destroy();
    });

    it('should update filtered commands after registration', () => {
      const palette = createCommandPalette();

      palette.actions.setQuery('test');
      expect(palette.getState().filteredCommands).toHaveLength(0);

      palette.actions.registerCommand({
        id: 'test',
        label: 'Test Command',
        action: vi.fn(),
      });

      const state = palette.getState();
      expect(state.filteredCommands).toHaveLength(1);

      palette.destroy();
    });

    it('should update roving focus items', () => {
      const palette = createCommandPalette();

      palette.actions.registerCommand({
        id: 'cmd1',
        label: 'Command 1',
        action: vi.fn(),
      });

      palette.actions.registerCommand({
        id: 'cmd2',
        label: 'Command 2',
        action: vi.fn(),
      });

      const rovingState = palette.rovingFocus.getState();
      expect(rovingState.items).toHaveLength(2);

      palette.destroy();
    });
  });

  describe('unregisterCommand action', () => {
    it('should remove command', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.unregisterCommand('save');
      const state = palette.getState();

      expect(state.commands).toHaveLength(3);
      expect(state.commands.some((cmd) => cmd.id === 'save')).toBe(false);

      palette.destroy();
    });

    it('should update filtered commands after unregistration', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('save');
      expect(palette.getState().filteredCommands).toHaveLength(1);

      palette.actions.unregisterCommand('save');
      const state = palette.getState();

      expect(state.filteredCommands).toHaveLength(0);

      palette.destroy();
    });

    it('should adjust selected index if out of bounds', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.rovingFocus.actions.moveLast();
      const indexBefore = palette.getState().selectedIndex;
      expect(indexBefore).toBe(3);

      palette.actions.unregisterCommand('close');
      const state = palette.getState();

      expect(state.selectedIndex).toBeLessThan(state.filteredCommands.length);

      palette.destroy();
    });

    it('should handle unregistering non-existent command', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      expect(() => {
        palette.actions.unregisterCommand('non-existent');
      }).not.toThrow();

      expect(palette.getState().commands).toHaveLength(4);

      palette.destroy();
    });

    it('should update roving focus items', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.unregisterCommand('save');

      const rovingState = palette.rovingFocus.getState();
      expect(rovingState.items).toHaveLength(3);
      expect(rovingState.items).not.toContain('save');

      palette.destroy();
    });
  });

  describe('keyboard navigation integration', () => {
    it('should sync selected index with roving focus', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.rovingFocus.actions.moveNext();
      const state = palette.getState();

      expect(state.selectedIndex).toBe(1);

      palette.destroy();
    });

    it('should navigate through filtered commands', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.actions.setQuery('file');
      
      palette.rovingFocus.actions.moveNext();
      expect(palette.getState().selectedIndex).toBe(1);

      palette.rovingFocus.actions.moveNext();
      expect(palette.getState().selectedIndex).toBe(2);

      palette.destroy();
    });

    it('should wrap navigation when enabled', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.rovingFocus.actions.moveLast();
      palette.rovingFocus.actions.moveNext();

      const state = palette.getState();
      expect(state.selectedIndex).toBe(0);

      palette.destroy();
    });

    it('should navigate to first and last commands', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.rovingFocus.actions.moveLast();
      expect(palette.getState().selectedIndex).toBe(3);

      palette.rovingFocus.actions.moveFirst();
      expect(palette.getState().selectedIndex).toBe(0);

      palette.destroy();
    });

    it('should navigate to specific index', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      palette.rovingFocus.actions.moveTo(2);
      const state = palette.getState();

      expect(state.selectedIndex).toBe(2);

      palette.destroy();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const palette = createCommandPalette();

      const listener = vi.fn();
      palette.subscribe(listener);

      palette.actions.open();

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0].isOpen).toBe(true);

      palette.destroy();
    });

    it('should support multiple subscribers', () => {
      const palette = createCommandPalette();

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      palette.subscribe(listener1);
      palette.subscribe(listener2);

      palette.actions.open();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      palette.destroy();
    });

    it('should allow unsubscribing', () => {
      const palette = createCommandPalette();

      const listener = vi.fn();
      const unsubscribe = palette.subscribe(listener);

      unsubscribe();

      palette.actions.open();

      expect(listener).not.toHaveBeenCalled();

      palette.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const palette = createCommandPalette();

      const listener = vi.fn();
      palette.subscribe(listener);

      palette.destroy();

      palette.actions.open();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should clean up composed behaviors', () => {
      const palette = createCommandPalette();

      expect(() => {
        palette.destroy();
      }).not.toThrow();
    });
  });

  describe('convenience methods', () => {
    describe('selectNext', () => {
      it('should delegate to roving focus moveNext', () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        expect(palette.getState().selectedIndex).toBe(0);

        palette.actions.selectNext();
        expect(palette.getState().selectedIndex).toBe(1);

        palette.actions.selectNext();
        expect(palette.getState().selectedIndex).toBe(2);

        palette.destroy();
      });

      it('should wrap to first item when at end', () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        // Move to last item
        palette.rovingFocus.actions.moveLast();
        expect(palette.getState().selectedIndex).toBe(3);

        // selectNext should wrap to first
        palette.actions.selectNext();
        expect(palette.getState().selectedIndex).toBe(0);

        palette.destroy();
      });
    });

    describe('selectPrevious', () => {
      it('should delegate to roving focus movePrevious', () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        // Move to index 2
        palette.rovingFocus.actions.moveTo(2);
        expect(palette.getState().selectedIndex).toBe(2);

        palette.actions.selectPrevious();
        expect(palette.getState().selectedIndex).toBe(1);

        palette.actions.selectPrevious();
        expect(palette.getState().selectedIndex).toBe(0);

        palette.destroy();
      });

      it('should wrap to last item when at beginning', () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        expect(palette.getState().selectedIndex).toBe(0);

        // selectPrevious should wrap to last
        palette.actions.selectPrevious();
        expect(palette.getState().selectedIndex).toBe(3);

        palette.destroy();
      });
    });

    describe('executeSelected', () => {
      it('should execute the currently selected command', async () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        palette.actions.open();
        
        // Select the second command
        palette.actions.selectNext();
        expect(palette.getState().selectedIndex).toBe(1);

        // Execute selected (should execute 'open' command)
        await palette.actions.executeSelected();

        expect(commands[1].action).toHaveBeenCalledTimes(1);
        expect(palette.getState().isOpen).toBe(false);

        palette.destroy();
      });

      it('should work with filtered commands', async () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        palette.actions.open();
        palette.actions.setQuery('file');

        // Should have filtered commands
        const state = palette.getState();
        expect(state.filteredCommands.length).toBeGreaterThan(0);
        expect(state.selectedIndex).toBe(0);

        // Execute the first filtered command
        await palette.actions.executeSelected();

        // Should execute the first filtered command's action
        const firstFilteredCommand = state.filteredCommands[0];
        const originalCommand = commands.find(cmd => cmd.id === firstFilteredCommand.id);
        expect(originalCommand?.action).toHaveBeenCalledTimes(1);

        palette.destroy();
      });

      it('should handle empty filtered commands gracefully', async () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        palette.actions.setQuery('nonexistent');
        expect(palette.getState().filteredCommands).toHaveLength(0);

        await expect(
          palette.actions.executeSelected()
        ).resolves.not.toThrow();

        palette.destroy();
      });

      it('should handle invalid selected index gracefully', async () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        // Manually set an invalid index (this shouldn't happen in normal use)
        palette.rovingFocus.actions.moveTo(999);

        await expect(
          palette.actions.executeSelected()
        ).resolves.not.toThrow();

        palette.destroy();
      });

      it('should close palette after executing selected command', async () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        palette.actions.open();
        expect(palette.getState().isOpen).toBe(true);

        await palette.actions.executeSelected();

        expect(palette.getState().isOpen).toBe(false);

        palette.destroy();
      });

      it('should invoke onCommandExecute callback', async () => {
        const onCommandExecute = vi.fn();
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands, onCommandExecute });

        await palette.actions.executeSelected();

        expect(onCommandExecute).toHaveBeenCalledTimes(1);
        expect(onCommandExecute).toHaveBeenCalledWith(commands[0]);

        palette.destroy();
      });
    });

    describe('convenience methods integration', () => {
      it('should work together for keyboard-driven workflow', async () => {
        const commands = createTestCommands();
        const palette = createCommandPalette({ commands });

        palette.actions.open();
        palette.actions.setQuery('file');

        // Navigate with convenience methods
        palette.actions.selectNext();
        palette.actions.selectNext();
        palette.actions.selectPrevious();

        // Execute with convenience method
        await palette.actions.executeSelected();

        expect(palette.getState().isOpen).toBe(false);

        palette.destroy();
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete command palette workflow', async () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      const onCommandExecute = vi.fn();

      const commands = createTestCommands();
      const palette = createCommandPalette({
        commands,
        onOpen,
        onClose,
        onCommandExecute,
      });

      // Open palette
      palette.actions.open();
      expect(palette.getState().isOpen).toBe(true);
      expect(onOpen).toHaveBeenCalled();

      // Search for command
      palette.actions.setQuery('save');
      expect(palette.getState().filteredCommands).toHaveLength(1);

      // Navigate (should stay at 0 since only one result)
      palette.rovingFocus.actions.moveNext();
      expect(palette.getState().selectedIndex).toBe(0);

      // Execute command
      await palette.actions.executeCommand('save');
      expect(commands[0].action).toHaveBeenCalled();
      expect(onCommandExecute).toHaveBeenCalled();

      // Palette should be closed
      expect(palette.getState().isOpen).toBe(false);
      expect(onClose).toHaveBeenCalled();

      palette.destroy();
    });

    it('should handle dynamic command registration', () => {
      const palette = createCommandPalette();

      // Start with no commands
      expect(palette.getState().commands).toHaveLength(0);

      // Register commands dynamically
      palette.actions.registerCommand({
        id: 'cmd1',
        label: 'Command 1',
        action: vi.fn(),
      });

      palette.actions.registerCommand({
        id: 'cmd2',
        label: 'Command 2',
        action: vi.fn(),
      });

      expect(palette.getState().commands).toHaveLength(2);

      // Search should work with dynamically registered commands
      palette.actions.setQuery('command');
      expect(palette.getState().filteredCommands).toHaveLength(2);

      // Unregister a command
      palette.actions.unregisterCommand('cmd1');
      expect(palette.getState().commands).toHaveLength(1);

      palette.destroy();
    });

    it('should maintain state consistency across operations', () => {
      const commands = createTestCommands();
      const palette = createCommandPalette({ commands });

      // Initial state
      expect(palette.getState().isOpen).toBe(false);
      expect(palette.getState().commands).toHaveLength(4);

      // Open and search
      palette.actions.open();
      palette.actions.setQuery('file');

      const filteredCount = palette.getState().filteredCommands.length;
      expect(filteredCount).toBeGreaterThan(0);

      // Navigate
      palette.rovingFocus.actions.moveNext();
      expect(palette.getState().selectedIndex).toBe(1);

      // Clear search
      palette.actions.setQuery('');
      expect(palette.getState().filteredCommands).toHaveLength(4);
      expect(palette.getState().selectedIndex).toBe(0);

      // Close
      palette.actions.close();
      expect(palette.getState().isOpen).toBe(false);

      palette.destroy();
    });
  });
});
