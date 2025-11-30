import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  describe('initial state', () => {
    it('should initialize with empty shortcuts', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.shortcuts.size).toBe(0);
      expect(result.current.activeShortcuts).toEqual([]);
      expect(result.current.enabled).toBe(true);
      expect(result.current.scope).toBe('global');
    });

    it('should initialize with provided scope', () => {
      const { result } = renderHook(() => useKeyboardShortcuts({ scope: 'scoped' }));

      expect(result.current.scope).toBe('scoped');
    });
  });

  describe('state updates trigger re-renders', () => {
    it('should update component when registering shortcut', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());
      const handler = vi.fn();

      expect(result.current.shortcuts.size).toBe(0);

      act(() => {
        result.current.actions.registerShortcut({
          key: 'Ctrl+K',
          handler,
          description: 'Test shortcut',
        });
      });

      expect(result.current.shortcuts.size).toBe(1);
      expect(result.current.activeShortcuts).toContain('Ctrl+K');
    });

    it('should update component when unregistering shortcut', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());
      const handler = vi.fn();

      act(() => {
        result.current.actions.registerShortcut({
          key: 'Ctrl+K',
          handler,
        });
      });

      expect(result.current.shortcuts.size).toBe(1);

      act(() => {
        result.current.actions.unregisterShortcut('Ctrl+K');
      });

      expect(result.current.shortcuts.size).toBe(0);
      expect(result.current.activeShortcuts).toEqual([]);
    });

    it('should update component when changing scope', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.scope).toBe('global');

      act(() => {
        result.current.actions.setScope('scoped');
      });

      expect(result.current.scope).toBe('scoped');
    });

    it('should update component when enabling/disabling', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.enabled).toBe(true);

      act(() => {
        result.current.actions.disable();
      });

      expect(result.current.enabled).toBe(false);

      act(() => {
        result.current.actions.enable();
      });

      expect(result.current.enabled).toBe(true);
    });

    it('should update component when clearing all shortcuts', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());
      const handler = vi.fn();

      act(() => {
        result.current.actions.registerShortcut({ key: 'Ctrl+K', handler });
        result.current.actions.registerShortcut({ key: 'Ctrl+P', handler });
      });

      expect(result.current.shortcuts.size).toBe(2);

      act(() => {
        result.current.actions.clearAllShortcuts();
      });

      expect(result.current.shortcuts.size).toBe(0);
      expect(result.current.activeShortcuts).toEqual([]);
    });
  });

  describe('callbacks', () => {
    it('should invoke onShortcutExecuted callback', () => {
      const onShortcutExecuted = vi.fn();
      const handler = vi.fn();

      const { result } = renderHook(() => useKeyboardShortcuts({ onShortcutExecuted }));

      act(() => {
        result.current.actions.registerShortcut({
          key: 'Ctrl+K',
          handler,
        });
      });

      // Simulate keyboard event
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(onShortcutExecuted).toHaveBeenCalledTimes(1);
      expect(onShortcutExecuted).toHaveBeenCalledWith('Ctrl+K');
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const handler = vi.fn();
      const { result, unmount } = renderHook(() => useKeyboardShortcuts());

      act(() => {
        result.current.actions.registerShortcut({
          key: 'Ctrl+K',
          handler,
        });
      });

      expect(result.current.shortcuts.size).toBe(1);

      // Unmount should trigger cleanup
      unmount();

      // Keyboard events should no longer trigger handler
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);

      // Handler should not be called after unmount
      expect(handler).not.toHaveBeenCalled();
    });

    it('should not update state after unmount', () => {
      const { result, unmount } = renderHook(() => useKeyboardShortcuts());

      const actions = result.current.actions;
      unmount();

      // Actions should not cause errors after unmount
      expect(() => {
        actions.registerShortcut({
          key: 'Ctrl+K',
          handler: vi.fn(),
        });
      }).not.toThrow();
    });
  });

  describe('behavior instance stability', () => {
    it('should maintain same behavior instance across re-renders', () => {
      const { result, rerender } = renderHook(() => useKeyboardShortcuts());

      const firstActions = result.current.actions;

      act(() => {
        result.current.actions.registerShortcut({
          key: 'Ctrl+K',
          handler: vi.fn(),
        });
      });

      rerender();

      // Actions should be the same reference
      expect(result.current.actions).toBe(firstActions);
    });
  });
});
