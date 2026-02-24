import { useEffect, useRef } from 'react';
import type { CommandPaletteBehavior, CommandPaletteState } from '@web-loom/ui-patterns';

interface CommandPaletteOverlayProps {
  palette: CommandPaletteBehavior;
  state: CommandPaletteState;
}

export function CommandPaletteOverlay({ palette, state }: CommandPaletteOverlayProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (state.isOpen) {
      inputRef.current?.focus();
    }
  }, [state.isOpen]);

  if (!state.isOpen) {
    return null;
  }

  return (
    <div className="palette-backdrop" onClick={() => palette.actions.close()}>
      <div className="palette-dialog" onClick={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          className="palette-input"
          value={state.query}
          onChange={(event) => palette.actions.setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              palette.actions.selectNext();
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              palette.actions.selectPrevious();
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              void palette.actions.executeSelected();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              palette.actions.close();
            }
          }}
          placeholder="Type a command"
        />

        <ul className="palette-list">
          {state.filteredCommands.length === 0 ? (
            <li className="palette-empty">No commands found.</li>
          ) : (
            state.filteredCommands.map((command, index) => (
              <li key={command.id}>
                <button
                  className={`palette-item ${state.selectedIndex === index ? 'active' : ''}`}
                  type="button"
                  onClick={() => {
                    void palette.actions.executeCommand(command.id);
                  }}
                >
                  <span>{command.label}</span>
                  <small>{command.category ?? 'General'}</small>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
