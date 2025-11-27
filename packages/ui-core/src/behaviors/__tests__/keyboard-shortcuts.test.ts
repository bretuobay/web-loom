import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createKeyboardShortcuts } from '../keyboard-shortcuts';

describe('createKeyboardShortcuts', () => {
  describe('initial state', () => {
    it('should initialize with default state', () => {
      const shortcuts = createKeyboardShortcuts();
      const state = shortcuts.getState();

      expect(state.shortcuts.size).toBe(0);
      expect(state.scope).toBe('global');
      expect(state.activeShortcuts).toEqual([]);
      expect(state.enabled).toBe(true);

      shortcuts.destroy();
    });

    it('should initialize with provided scope', () => {
      const shortcuts = createKeyboardShortcuts({ scope: 'scoped' });
      const state = shortcuts.getState();

      expect(state.scope).toBe('scoped');

      shortcuts.destroy();
    });
  });

  describe('registerShortcut action', () => {
    it('should register a valid shortcut', () => {
      const shortcuts = createKeyboardShortcuts();
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
        description: 'Test shortcut',
      });

      const state = shortcuts.getState();
      expect(state.shortcuts.size).toBe(1);
      expect(state.activeShortcuts).toContain('Ctrl+K');

      shortcuts.destroy();
    });

    it('should normalize key combinations', () => {
      const shortcuts = createKeyboardShortcuts();
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+Shift+K',
        handler,
      });

      const state = shortcuts.getState();
      expect(state.activeShortcuts).toContain('Ctrl+Shift+K');

      shortcuts.destroy();
    });

    it('should handle Cmd as Meta', () => {
      const shortcuts = createKeyboardShortcuts();
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Cmd+K',
        handler,
      });

      const state = shortcuts.getState();
      expect(state.activeShortcuts).toContain('Meta+K');

      shortcuts.destroy();
    });

    it('should replace existing shortcut with same key (last-wins)', () => {
      const shortcuts = createKeyboardShortcuts();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler: handler1,
      });

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler: handler2,
      });

      const state = shortcuts.getState();
      expect(state.shortcuts.size).toBe(1);

      shortcuts.destroy();
    });

    it('should handle invalid key combinations gracefully', () => {
      const shortcuts = createKeyboardShortcuts();
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: '',
        handler,
      });

      const state = shortcuts.getState();
      expect(state.shortcuts.size).toBe(0);

      shortcuts.destroy();
    });
  });

  describe('unregisterShortcut action', () => {
    it('should unregister an existing shortcut', () => {
      const shortcuts = createKeyboardShortcuts();
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });

      shortcuts.actions.unregisterShortcut('Ctrl+K');

      const state = shortcuts.getState();
      expect(state.shortcuts.size).toBe(0);
      expect(state.activeShortcuts).toEqual([]);

      shortcuts.destroy();
    });

    it('should handle unregistering non-existent shortcut', () => {
      const shortcuts = createKeyboardShortcuts();

      shortcuts.actions.unregisterShortcut('Ctrl+K');

      const state = shortcuts.getState();
      expect(state.shortcuts.size).toBe(0);

      shortcuts.destroy();
    });
  });

  describe('setScope action', () => {
    it('should change the scope', () => {
      const shortcuts = createKeyboardShortcuts();

      shortcuts.actions.setScope('scoped');
      expect(shortcuts.getState().scope).toBe('scoped');

      shortcuts.actions.setScope('global');
      expect(shortcuts.getState().scope).toBe('global');

      shortcuts.destroy();
    });
  });

  describe('clearAllShortcuts action', () => {
    it('should clear all registered shortcuts', () => {
      const shortcuts = createKeyboardShortcuts();
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({ key: 'Ctrl+K', handler });
      shortcuts.actions.registerShortcut({ key: 'Ctrl+P', handler });

      shortcuts.actions.clearAllShortcuts();

      const state = shortcuts.getState();
      expect(state.shortcuts.size).toBe(0);
      expect(state.activeShortcuts).toEqual([]);

      shortcuts.destroy();
    });
  });

  describe('enable/disable actions', () => {
    it('should enable and disable shortcuts', () => {
      const shortcuts = createKeyboardShortcuts();

      shortcuts.actions.disable();
      expect(shortcuts.getState().enabled).toBe(false);

      shortcuts.actions.enable();
      expect(shortcuts.getState().enabled).toBe(true);

      shortcuts.destroy();
    });
  });

  describe('keyboard event handling', () => {
    let shortcuts: ReturnType<typeof createKeyboardShortcuts>;

    beforeEach(() => {
      shortcuts = createKeyboardShortcuts();
    });

    afterEach(() => {
      shortcuts.destroy();
    });

    it('should execute handler when matching key is pressed', () => {
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });

      // Simulate Ctrl+K press
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalledOnce();
    });

    it('should not execute handler when disabled', () => {
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });

      shortcuts.actions.disable();

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should call onShortcutExecuted callback', () => {
      const onShortcutExecuted = vi.fn();
      const handler = vi.fn();

      shortcuts.destroy();
      shortcuts = createKeyboardShortcuts({ onShortcutExecuted });

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onShortcutExecuted).toHaveBeenCalledWith('Ctrl+K');
    });

    it('should prevent default when preventDefault is true', () => {
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
        preventDefault: true,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should respect scope settings', () => {
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
        scope: 'scoped',
      });

      // Global scope - should not execute scoped shortcut
      shortcuts.actions.setScope('global');

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();

      // Scoped mode - should execute scoped shortcut
      shortcuts.actions.setScope('scoped');
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalledOnce();
    });

    it('should handle multiple modifiers', () => {
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+Shift+Alt+K',
        handler,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('subscription', () => {
    it('should notify subscribers on state changes', () => {
      const shortcuts = createKeyboardShortcuts();
      const listener = vi.fn();

      shortcuts.subscribe(listener);

      const handler = vi.fn();
      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });

      expect(listener).toHaveBeenCalled();

      shortcuts.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners', () => {
      const shortcuts = createKeyboardShortcuts();
      const handler = vi.fn();

      shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });

      shortcuts.destroy();

      // After destroy, handler should not be called
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
