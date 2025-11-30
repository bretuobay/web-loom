import { useState, useEffect } from 'react';
import { useKeyboardShortcuts } from '@web-loom/ui-core/react';
import { createCommandPalette } from '@web-loom/ui-patterns';
import './examples.css';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
}

/**
 * Command Palette Example with Keyboard Shortcuts
 *
 * Demonstrates:
 * - useKeyboardShortcuts hook for Ctrl+K shortcut
 * - Command palette pattern with search
 * - Shortcut help panel
 */
export function CommandPaletteExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [executedCommands, setExecutedCommands] = useState<string[]>([]);

  const commands: Command[] = [
    {
      id: 'new-file',
      label: 'New File',
      description: 'Create a new file',
      icon: '📄',
      action: () => addExecutedCommand('Created new file'),
    },
    {
      id: 'open-file',
      label: 'Open File',
      description: 'Open an existing file',
      icon: '📂',
      action: () => addExecutedCommand('Opened file'),
    },
    {
      id: 'save',
      label: 'Save',
      description: 'Save current file',
      icon: '💾',
      action: () => addExecutedCommand('Saved file'),
    },
    {
      id: 'search',
      label: 'Search',
      description: 'Search in files',
      icon: '🔍',
      action: () => addExecutedCommand('Opened search'),
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open settings',
      icon: '⚙️',
      action: () => addExecutedCommand('Opened settings'),
    },
    {
      id: 'theme',
      label: 'Change Theme',
      description: 'Switch color theme',
      icon: '🎨',
      action: () => addExecutedCommand('Changed theme'),
    },
  ];

  const palette = createCommandPalette({
    commands: commands.map((cmd) => ({
      id: cmd.id,
      label: cmd.label,
      keywords: [cmd.label.toLowerCase()],
      action: cmd.action,
    })),
    onCommandExecute: (command) => {
      const localCommand = commands.find((c) => c.id === command.id);
      if (localCommand) {
        localCommand.action();
        setIsOpen(false);
      }
    },
  });

  const shortcuts = useKeyboardShortcuts({ scope: 'global' });

  useEffect(() => {
    // Register Ctrl+K to open command palette
    shortcuts.actions.registerShortcut({
      key: 'Ctrl+K',
      handler: () => {
        setIsOpen((prev) => !prev);
      },
      description: 'Toggle command palette',
      preventDefault: true,
    });

    // Register Escape to close
    shortcuts.actions.registerShortcut({
      key: 'Escape',
      handler: () => {
        if (isOpen) {
          setIsOpen(false);
        }
      },
      description: 'Close command palette',
      preventDefault: true,
    });

    // Register ? to show help
    shortcuts.actions.registerShortcut({
      key: 'Shift+/',
      handler: () => {
        setShowHelp((prev) => !prev);
      },
      description: 'Toggle keyboard shortcuts help',
      preventDefault: true,
    });

    return () => {
      shortcuts.actions.clearAllShortcuts();
    };
  }, [isOpen]);

  const addExecutedCommand = (message: string) => {
    setExecutedCommands((prev) => [message, ...prev].slice(0, 10));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    palette.actions.setQuery(e.target.value);
  };

  const handleCommandClick = (command: Command) => {
    command.action();
    setIsOpen(false);
  };

  const filteredCommands = palette.getState().filteredCommands;
  const displayCommands = filteredCommands.map((fc) => commands.find((c) => c.id === fc.id)!);

  return (
    <div className="example-container">
      <div className="example-header">
        <h2>Command Palette with Keyboard Shortcuts</h2>
        <p>
          This example demonstrates the <code>useKeyboardShortcuts</code> hook integrated with a command palette
          pattern.
        </p>
      </div>

      <div className="example-content">
        <div className="command-palette-demo">
          <div className="demo-instructions">
            <h3>Try it out!</h3>
            <ul>
              <li>
                Press <kbd>Ctrl+K</kbd> to open the command palette
              </li>
              <li>
                Press <kbd>Escape</kbd> to close it
              </li>
              <li>
                Press <kbd>Shift+/</kbd> (?) to toggle keyboard shortcuts help
              </li>
              <li>Type to search for commands</li>
            </ul>
          </div>

          <button onClick={() => setIsOpen(true)} className="control-button primary">
            Open Command Palette (Ctrl+K)
          </button>

          <button onClick={() => setShowHelp((prev) => !prev)} className="control-button secondary">
            {showHelp ? 'Hide' : 'Show'} Shortcuts (?)
          </button>

          {showHelp && (
            <div className="shortcuts-help">
              <h3>Keyboard Shortcuts</h3>
              <div className="shortcuts-list">
                {shortcuts.activeShortcuts.map((key) => (
                  <div key={key} className="shortcut-item">
                    <kbd>{key}</kbd>
                    <span>
                      {key === 'Ctrl+K' && 'Toggle command palette'}
                      {key === 'Escape' && 'Close command palette'}
                      {key === 'Shift+/' && 'Toggle shortcuts help'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOpen && (
            <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
              <div className="command-palette" onClick={(e) => e.stopPropagation()}>
                <div className="command-palette-header">
                  <input
                    type="text"
                    placeholder="Type a command or search..."
                    value={palette.getState().query}
                    onChange={handleSearch}
                    autoFocus
                    className="command-palette-input"
                  />
                </div>
                <div className="command-palette-results">
                  {displayCommands.length === 0 ? (
                    <div className="no-results">No commands found</div>
                  ) : (
                    displayCommands.map((command) => (
                      <button key={command.id} onClick={() => handleCommandClick(command)} className="command-item">
                        <span className="command-icon">{command.icon}</span>
                        <div className="command-info">
                          <div className="command-label">{command.label}</div>
                          <div className="command-description">{command.description}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="executed-commands">
            <h3>Executed Commands</h3>
            {executedCommands.length === 0 ? (
              <p className="empty-state">No commands executed yet</p>
            ) : (
              <ul className="command-log">
                {executedCommands.map((cmd, index) => (
                  <li key={index} className="command-log-item">
                    {cmd}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="example-footer">
        <h3>Key Features</h3>
        <ul>
          <li>Global keyboard shortcuts with Ctrl+K to open palette</li>
          <li>Command search and filtering</li>
          <li>Keyboard shortcuts help panel</li>
          <li>Command execution tracking</li>
        </ul>
      </div>
    </div>
  );
}
