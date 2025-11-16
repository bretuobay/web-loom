import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDialogBehavior } from '../dialog';

describe('createDialogBehavior', () => {
  describe('initial state', () => {
    it('should initialize with closed state', () => {
      const dialog = createDialogBehavior();
      const state = dialog.getState();

      expect(state.isOpen).toBe(false);
      expect(state.content).toBeNull();
      expect(state.id).toBeNull();
    });

    it('should initialize with provided id', () => {
      const dialog = createDialogBehavior({ id: 'test-dialog' });
      const state = dialog.getState();

      expect(state.id).toBe('test-dialog');
      expect(state.isOpen).toBe(false);
    });
  });

  describe('open action', () => {
    it('should update state correctly when opening dialog', () => {
      const dialog = createDialogBehavior();
      const content = { title: 'Test Dialog', message: 'Hello World' };

      dialog.actions.open(content);
      const state = dialog.getState();

      expect(state.isOpen).toBe(true);
      expect(state.content).toEqual(content);
    });

    it('should handle opening with null content', () => {
      const dialog = createDialogBehavior();

      dialog.actions.open(null);
      const state = dialog.getState();

      expect(state.isOpen).toBe(true);
      expect(state.content).toBeNull();
    });

    it('should handle opening with different content types', () => {
      const dialog = createDialogBehavior();

      // String content
      dialog.actions.open('Simple string');
      expect(dialog.getState().content).toBe('Simple string');

      // Number content
      dialog.actions.open(42);
      expect(dialog.getState().content).toBe(42);

      // Array content
      dialog.actions.open([1, 2, 3]);
      expect(dialog.getState().content).toEqual([1, 2, 3]);
    });
  });

  describe('close action', () => {
    it('should update state correctly when closing dialog', () => {
      const dialog = createDialogBehavior();

      // First open the dialog
      dialog.actions.open({ title: 'Test' });
      expect(dialog.getState().isOpen).toBe(true);

      // Then close it
      dialog.actions.close();
      const state = dialog.getState();

      expect(state.isOpen).toBe(false);
      expect(state.content).toBeNull();
    });

    it('should handle closing an already closed dialog', () => {
      const dialog = createDialogBehavior();

      dialog.actions.close();
      const state = dialog.getState();

      expect(state.isOpen).toBe(false);
      expect(state.content).toBeNull();
    });
  });

  describe('toggle action', () => {
    it('should open dialog when currently closed', () => {
      const dialog = createDialogBehavior();
      const content = { title: 'Toggle Test' };

      dialog.actions.toggle(content);
      const state = dialog.getState();

      expect(state.isOpen).toBe(true);
      expect(state.content).toEqual(content);
    });

    it('should close dialog when currently open', () => {
      const dialog = createDialogBehavior();

      // Open first
      dialog.actions.open({ title: 'Test' });
      expect(dialog.getState().isOpen).toBe(true);

      // Toggle to close
      dialog.actions.toggle();
      const state = dialog.getState();

      expect(state.isOpen).toBe(false);
      expect(state.content).toBeNull();
    });

    it('should toggle multiple times correctly', () => {
      const dialog = createDialogBehavior();

      // First toggle - open
      dialog.actions.toggle({ content: 'first' });
      expect(dialog.getState().isOpen).toBe(true);

      // Second toggle - close
      dialog.actions.toggle();
      expect(dialog.getState().isOpen).toBe(false);

      // Third toggle - open
      dialog.actions.toggle({ content: 'second' });
      expect(dialog.getState().isOpen).toBe(true);
      expect(dialog.getState().content).toEqual({ content: 'second' });
    });

    it('should handle toggle without content parameter', () => {
      const dialog = createDialogBehavior();

      dialog.actions.toggle();
      const state = dialog.getState();

      expect(state.isOpen).toBe(true);
      expect(state.content).toBeNull();
    });
  });

  describe('onOpen callback', () => {
    it('should invoke onOpen callback when dialog opens', () => {
      const onOpen = vi.fn();
      const dialog = createDialogBehavior({ onOpen });
      const content = { title: 'Test' };

      dialog.actions.open(content);

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledWith(content);
    });

    it('should invoke onOpen callback when toggling from closed to open', () => {
      const onOpen = vi.fn();
      const dialog = createDialogBehavior({ onOpen });
      const content = { title: 'Toggle Test' };

      dialog.actions.toggle(content);

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledWith(content);
    });

    it('should not invoke onOpen callback when closing', () => {
      const onOpen = vi.fn();
      const dialog = createDialogBehavior({ onOpen });

      dialog.actions.open({ title: 'Test' });
      onOpen.mockClear();

      dialog.actions.close();

      expect(onOpen).not.toHaveBeenCalled();
    });

    it('should invoke onOpen callback multiple times for multiple opens', () => {
      const onOpen = vi.fn();
      const dialog = createDialogBehavior({ onOpen });

      dialog.actions.open({ content: 'first' });
      dialog.actions.close();
      dialog.actions.open({ content: 'second' });

      expect(onOpen).toHaveBeenCalledTimes(2);
      expect(onOpen).toHaveBeenNthCalledWith(1, { content: 'first' });
      expect(onOpen).toHaveBeenNthCalledWith(2, { content: 'second' });
    });
  });

  describe('onClose callback', () => {
    it('should invoke onClose callback when dialog closes', () => {
      const onClose = vi.fn();
      const dialog = createDialogBehavior({ onClose });

      dialog.actions.open({ title: 'Test' });
      dialog.actions.close();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should invoke onClose callback when toggling from open to closed', () => {
      const onClose = vi.fn();
      const dialog = createDialogBehavior({ onClose });

      dialog.actions.open({ title: 'Test' });
      onClose.mockClear();

      dialog.actions.toggle();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not invoke onClose callback when opening', () => {
      const onClose = vi.fn();
      const dialog = createDialogBehavior({ onClose });

      dialog.actions.open({ title: 'Test' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should invoke onClose callback multiple times for multiple closes', () => {
      const onClose = vi.fn();
      const dialog = createDialogBehavior({ onClose });

      dialog.actions.open({ content: 'first' });
      dialog.actions.close();
      dialog.actions.open({ content: 'second' });
      dialog.actions.close();

      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const dialog = createDialogBehavior();
      const listener = vi.fn();

      dialog.subscribe(listener);
      dialog.actions.open({ title: 'Test' });

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        isOpen: true,
        content: { title: 'Test' },
      });
    });

    it('should support multiple subscribers', () => {
      const dialog = createDialogBehavior();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      dialog.subscribe(listener1);
      dialog.subscribe(listener2);

      dialog.actions.open({ title: 'Test' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const dialog = createDialogBehavior();
      const listener = vi.fn();

      const unsubscribe = dialog.subscribe(listener);
      unsubscribe();

      dialog.actions.open({ title: 'Test' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify subscribers on close', () => {
      const dialog = createDialogBehavior();
      const listener = vi.fn();

      dialog.subscribe(listener);
      dialog.actions.open({ title: 'Test' });
      listener.mockClear();

      dialog.actions.close();

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        isOpen: false,
        content: null,
      });
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const dialog = createDialogBehavior();
      const listener = vi.fn();

      dialog.subscribe(listener);
      dialog.destroy();

      dialog.actions.open({ title: 'Test' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const dialog = createDialogBehavior();

      expect(() => {
        dialog.destroy();
        dialog.destroy();
      }).not.toThrow();
    });

    it('should clean up all subscribers', () => {
      const dialog = createDialogBehavior();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      dialog.subscribe(listener1);
      dialog.subscribe(listener2);
      dialog.subscribe(listener3);

      dialog.destroy();
      dialog.actions.open({ title: 'Test' });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete dialog lifecycle', () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      const listener = vi.fn();

      const dialog = createDialogBehavior({
        id: 'lifecycle-test',
        onOpen,
        onClose,
      });

      dialog.subscribe(listener);

      // Open dialog
      dialog.actions.open({ step: 1 });
      expect(dialog.getState().isOpen).toBe(true);
      expect(onOpen).toHaveBeenCalledWith({ step: 1 });
      expect(listener).toHaveBeenCalled();

      // Close dialog
      listener.mockClear();
      dialog.actions.close();
      expect(dialog.getState().isOpen).toBe(false);
      expect(onClose).toHaveBeenCalled();
      expect(listener).toHaveBeenCalled();

      // Clean up
      dialog.destroy();
    });

    it('should maintain state consistency across multiple operations', () => {
      const dialog = createDialogBehavior({ id: 'consistency-test' });

      // Initial state
      expect(dialog.getState().isOpen).toBe(false);

      // Open
      dialog.actions.open('content1');
      expect(dialog.getState().isOpen).toBe(true);
      expect(dialog.getState().content).toBe('content1');

      // Open again with different content
      dialog.actions.open('content2');
      expect(dialog.getState().isOpen).toBe(true);
      expect(dialog.getState().content).toBe('content2');

      // Toggle to close
      dialog.actions.toggle();
      expect(dialog.getState().isOpen).toBe(false);
      expect(dialog.getState().content).toBeNull();

      // Toggle to open
      dialog.actions.toggle('content3');
      expect(dialog.getState().isOpen).toBe(true);
      expect(dialog.getState().content).toBe('content3');

      dialog.destroy();
    });
  });
});
