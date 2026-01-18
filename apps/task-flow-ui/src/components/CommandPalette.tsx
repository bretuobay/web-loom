import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { createCommandPalette, type Command } from '@web-loom/ui-patterns';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useReducedMotion } from '../hooks/useReducedMotion';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
  onToggleTheme: () => void;
  onLogout?: () => void;
  isAuthenticated: boolean;
  onReady?: (open: () => void) => void;
}

export function CommandPalette({ onToggleTheme, onLogout, isAuthenticated, onReady }: CommandPaletteProps) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const palette = useMemo(() => {
    const commands: Command[] = [
      {
        id: 'nav-projects',
        label: 'Go to Projects',
        category: 'Navigation',
        keywords: ['projects', 'list', 'home'],
        shortcut: 'G P',
        action: () => navigate('/projects'),
      },
      {
        id: 'nav-tasks',
        label: 'Go to Task Board',
        category: 'Navigation',
        keywords: ['tasks', 'board', 'kanban'],
        shortcut: 'G T',
        action: () => navigate('/tasks'),
      },
      {
        id: 'nav-todos',
        label: 'Go to Todos',
        category: 'Navigation',
        keywords: ['todos', 'checklist', 'daily', 'personal'],
        shortcut: 'G D',
        action: () => navigate('/todos'),
      },
      {
        id: 'theme-toggle',
        label: 'Toggle Theme',
        category: 'Preferences',
        keywords: ['dark', 'light', 'mode', 'theme', 'night', 'day'],
        action: onToggleTheme,
      },
    ];

    if (isAuthenticated && onLogout) {
      commands.push({
        id: 'auth-logout',
        label: 'Sign Out',
        category: 'Account',
        keywords: ['logout', 'sign out', 'exit'],
        action: onLogout,
      });
    }

    return createCommandPalette({ commands });
  }, [navigate, onToggleTheme, onLogout, isAuthenticated]);

  const [state, setState] = useState(() => palette.getState());

  // Subscribe to state changes - use callback to ignore oldState argument
  useEffect(() => {
    // Sync state immediately when palette changes
    setState(palette.getState());

    // Subscribe with a wrapper that handles the (newState, oldState) signature
    const unsubscribe = palette.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [palette]);

  // Cleanup on unmount
  useEffect(() => {
    return () => palette.destroy();
  }, [palette]);

  // Keep a ref to the current palette so the open function is always stable
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  // Create a stable open function that always uses the current palette
  const stableOpen = useCallback(() => {
    paletteRef.current.actions.open();
  }, []);

  // Notify parent when palette is ready (only once with stable function)
  useEffect(() => {
    if (onReady) {
      onReady(stableOpen);
    }
  }, [onReady, stableOpen]);

  // Global keyboard shortcuts to open command palette
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'k',
        ctrl: true,
        action: () => palette.actions.open(),
      },
      {
        key: 'p',
        ctrl: true,
        shift: true,
        action: () => palette.actions.open(),
      },
    ],
  });

  // Handle keyboard navigation within palette
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          palette.actions.selectNext();
          break;
        case 'ArrowUp':
          event.preventDefault();
          palette.actions.selectPrevious();
          break;
        case 'Enter':
          event.preventDefault();
          palette.actions.executeSelected();
          break;
        case 'Escape':
          event.preventDefault();
          palette.actions.close();
          break;
      }
    },
    [palette],
  );

  if (!state.isOpen) return null;

  const animationClass = reducedMotion ? styles.noAnimation : styles.animated;

  return createPortal(
    <div className={styles.overlay} onClick={() => palette.actions.close()}>
      <div
        className={`${styles.container} ${animationClass}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <input
          type="text"
          className={styles.input}
          placeholder="Type a command or search..."
          value={state.query}
          onChange={(e) => palette.actions.setQuery(e.target.value)}
          autoFocus
        />
        <ul className={styles.list} role="listbox">
          {state.filteredCommands.map((command, index) => (
            <li
              key={command.id}
              className={`${styles.item} ${index === state.selectedIndex ? styles.selected : ''}`}
              role="option"
              aria-selected={index === state.selectedIndex}
              onClick={() => palette.actions.executeCommand(command.id)}
            >
              <div className={styles.itemContent}>
                <span className={styles.label}>{command.label}</span>
                {command.category && <span className={styles.category}>{command.category}</span>}
              </div>
              {command.shortcut && <kbd className={styles.shortcut}>{command.shortcut}</kbd>}
            </li>
          ))}
          {state.filteredCommands.length === 0 && <li className={styles.empty}>No commands found</li>}
        </ul>
        <footer className={styles.footer}>
          <span>
            <kbd>↑↓</kbd> Navigate
          </span>
          <span>
            <kbd>Enter</kbd> Select
          </span>
          <span>
            <kbd>Esc</kbd> Close
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
