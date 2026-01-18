import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: ShortcutConfig[];
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Allow Escape to work even in inputs
      if (isInputField && event.key !== 'Escape') return;

      const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

      for (const shortcut of shortcutsRef.current) {
        // Check modifier keys
        const ctrlMatch = shortcut.ctrl ? (isMac ? event.metaKey : event.ctrlKey) : !event.ctrlKey && !event.metaKey;

        const metaMatch = shortcut.meta ? event.metaKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // Special handling for Cmd/Ctrl+K style shortcuts
        const modifierMatch =
          shortcut.ctrl !== undefined ? ctrlMatch && shiftMatch && altMatch : metaMatch && shiftMatch && altMatch;

        if (event.key.toLowerCase() === shortcut.key.toLowerCase() && modifierMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [enabled],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
