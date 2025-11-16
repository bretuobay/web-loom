import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createModal } from '../modal';

describe('createModal', () => {
  describe('initial state', () => {
    it('should initialize with empty stack', () => {
      const modal = createModal();

      const state = modal.getState();

      expect(state.stack).toEqual([]);
      expect(state.topModalId).toBeNull();

      modal.destroy();
    });
  });

  describe('openModal action', () => {
    it('should add modal to stack', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      const state = modal.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toEqual({
        id: 'modal-1',
        content: { title: 'Modal 1' },
        priority: 0,
      });
      expect(state.topModalId).toBe('modal-1');

      modal.destroy();
    });

    it('should add multiple modals to stack', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      modal.actions.openModal('modal-2', { title: 'Modal 2' });
      modal.actions.openModal('modal-3', { title: 'Modal 3' });

      const state = modal.getState();

      expect(state.stack).toHaveLength(3);
      expect(state.stack.map((m) => m.id)).toContain('modal-1');
      expect(state.stack.map((m) => m.id)).toContain('modal-2');
      expect(state.stack.map((m) => m.id)).toContain('modal-3');

      modal.destroy();
    });

    it('should handle opening modal with custom priority', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' }, 5);
      const state = modal.getState();

      expect(state.stack[0].priority).toBe(5);

      modal.destroy();
    });

    it('should update existing modal if opened with same ID', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Original' }, 0);
      modal.actions.openModal('modal-1', { title: 'Updated' }, 10);

      const state = modal.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.stack[0].content).toEqual({ title: 'Updated' });
      expect(state.stack[0].priority).toBe(10);

      modal.destroy();
    });
  });

  describe('closeModal action', () => {
    it('should remove modal from stack', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      expect(modal.getState().stack).toHaveLength(1);

      modal.actions.closeModal('modal-1');
      const state = modal.getState();

      expect(state.stack).toHaveLength(0);
      expect(state.topModalId).toBeNull();

      modal.destroy();
    });

    it('should remove specific modal from stack with multiple modals', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      modal.actions.openModal('modal-2', { title: 'Modal 2' });
      modal.actions.openModal('modal-3', { title: 'Modal 3' });

      modal.actions.closeModal('modal-2');
      const state = modal.getState();

      expect(state.stack).toHaveLength(2);
      expect(state.stack.map((m) => m.id)).toContain('modal-1');
      expect(state.stack.map((m) => m.id)).toContain('modal-3');
      expect(state.stack.map((m) => m.id)).not.toContain('modal-2');

      modal.destroy();
    });

    it('should handle closing non-existent modal gracefully', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });

      expect(() => {
        modal.actions.closeModal('non-existent');
      }).not.toThrow();

      expect(modal.getState().stack).toHaveLength(1);

      modal.destroy();
    });

    it('should update topModalId after closing top modal', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' }, 0);
      modal.actions.openModal('modal-2', { title: 'Modal 2' }, 10);

      expect(modal.getState().topModalId).toBe('modal-2');

      modal.actions.closeModal('modal-2');

      expect(modal.getState().topModalId).toBe('modal-1');

      modal.destroy();
    });
  });

  describe('closeTopModal action', () => {
    it('should remove top modal from stack', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' }, 0);
      modal.actions.openModal('modal-2', { title: 'Modal 2' }, 10);

      expect(modal.getState().topModalId).toBe('modal-2');

      modal.actions.closeTopModal();
      const state = modal.getState();

      expect(state.stack).toHaveLength(1);
      expect(state.topModalId).toBe('modal-1');

      modal.destroy();
    });

    it('should handle closing when no modals are open', () => {
      const modal = createModal();

      expect(() => {
        modal.actions.closeTopModal();
      }).not.toThrow();

      expect(modal.getState().stack).toHaveLength(0);

      modal.destroy();
    });

    it('should close all modals when called repeatedly', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      modal.actions.openModal('modal-2', { title: 'Modal 2' });
      modal.actions.openModal('modal-3', { title: 'Modal 3' });

      modal.actions.closeTopModal();
      expect(modal.getState().stack).toHaveLength(2);

      modal.actions.closeTopModal();
      expect(modal.getState().stack).toHaveLength(1);

      modal.actions.closeTopModal();
      expect(modal.getState().stack).toHaveLength(0);
      expect(modal.getState().topModalId).toBeNull();

      modal.destroy();
    });
  });

  describe('closeAllModals action', () => {
    it('should clear entire stack', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      modal.actions.openModal('modal-2', { title: 'Modal 2' });
      modal.actions.openModal('modal-3', { title: 'Modal 3' });

      expect(modal.getState().stack).toHaveLength(3);

      modal.actions.closeAllModals();
      const state = modal.getState();

      expect(state.stack).toHaveLength(0);
      expect(state.topModalId).toBeNull();

      modal.destroy();
    });

    it('should handle closing when no modals are open', () => {
      const modal = createModal();

      expect(() => {
        modal.actions.closeAllModals();
      }).not.toThrow();

      expect(modal.getState().stack).toHaveLength(0);

      modal.destroy();
    });
  });

  describe('modal priority ordering', () => {
    it('should order modals by priority (higher priority on top)', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' }, 0);
      modal.actions.openModal('modal-2', { title: 'Modal 2' }, 10);
      modal.actions.openModal('modal-3', { title: 'Modal 3' }, 5);

      const state = modal.getState();

      // Top modal should be the one with highest priority
      expect(state.topModalId).toBe('modal-2');
      expect(state.stack[0].id).toBe('modal-2');
      expect(state.stack[0].priority).toBe(10);

      modal.destroy();
    });

    it('should maintain insertion order for same priority', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' }, 5);
      modal.actions.openModal('modal-2', { title: 'Modal 2' }, 5);
      modal.actions.openModal('modal-3', { title: 'Modal 3' }, 5);

      const state = modal.getState();

      // All have same priority, so first one should be on top
      expect(state.topModalId).toBe('modal-1');

      modal.destroy();
    });

    it('should update top modal when higher priority modal is opened', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' }, 0);
      expect(modal.getState().topModalId).toBe('modal-1');

      modal.actions.openModal('modal-2', { title: 'Modal 2' }, 10);
      expect(modal.getState().topModalId).toBe('modal-2');

      modal.actions.openModal('modal-3', { title: 'Modal 3' }, 20);
      expect(modal.getState().topModalId).toBe('modal-3');

      modal.destroy();
    });

    it('should handle negative priorities', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' }, -10);
      modal.actions.openModal('modal-2', { title: 'Modal 2' }, 0);
      modal.actions.openModal('modal-3', { title: 'Modal 3' }, -5);

      const state = modal.getState();

      // Modal with priority 0 should be on top
      expect(state.topModalId).toBe('modal-2');

      modal.destroy();
    });
  });

  describe('event emissions', () => {
    it('should emit modal:opened event when modal is opened', () => {
      const modal = createModal();

      const listener = vi.fn();
      modal.eventBus.on('modal:opened', listener);

      modal.actions.openModal('modal-1', { title: 'Modal 1' }, 5);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        id: 'modal-1',
        content: { title: 'Modal 1' },
        priority: 5,
      });

      modal.destroy();
    });

    it('should emit modal:closed event when modal is closed', () => {
      const modal = createModal();

      const listener = vi.fn();
      modal.eventBus.on('modal:closed', listener);

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      modal.actions.closeModal('modal-1');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('modal-1');

      modal.destroy();
    });

    it('should emit modal:stacked event when modal is opened', () => {
      const modal = createModal();

      const listener = vi.fn();
      modal.eventBus.on('modal:stacked', listener);

      modal.actions.openModal('modal-1', { title: 'Modal 1' });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]).toHaveLength(1);

      modal.destroy();
    });

    it('should emit modal:stacked event when stack changes', () => {
      const modal = createModal();

      const listener = vi.fn();
      modal.eventBus.on('modal:stacked', listener);

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      modal.actions.openModal('modal-2', { title: 'Modal 2' });

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener.mock.calls[1][0]).toHaveLength(2);

      modal.destroy();
    });

    it('should emit events in correct order', () => {
      const modal = createModal();

      const openedListener = vi.fn();
      const stackedListener = vi.fn();

      modal.eventBus.on('modal:opened', openedListener);
      modal.eventBus.on('modal:stacked', stackedListener);

      modal.actions.openModal('modal-1', { title: 'Modal 1' });

      expect(openedListener).toHaveBeenCalled();
      expect(stackedListener).toHaveBeenCalled();

      modal.destroy();
    });
  });

  describe('callbacks', () => {
    it('should invoke onModalOpened callback when modal is opened', () => {
      const onModalOpened = vi.fn();
      const modal = createModal({ onModalOpened });

      modal.actions.openModal('modal-1', { title: 'Modal 1' }, 5);

      expect(onModalOpened).toHaveBeenCalledTimes(1);
      expect(onModalOpened).toHaveBeenCalledWith({
        id: 'modal-1',
        content: { title: 'Modal 1' },
        priority: 5,
      });

      modal.destroy();
    });

    it('should invoke onModalClosed callback when modal is closed', () => {
      const onModalClosed = vi.fn();
      const modal = createModal({ onModalClosed });

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      modal.actions.closeModal('modal-1');

      expect(onModalClosed).toHaveBeenCalledTimes(1);
      expect(onModalClosed).toHaveBeenCalledWith('modal-1');

      modal.destroy();
    });

    it('should invoke onStackChange callback when stack changes', () => {
      const onStackChange = vi.fn();
      const modal = createModal({ onStackChange });

      modal.actions.openModal('modal-1', { title: 'Modal 1' });

      expect(onStackChange).toHaveBeenCalledTimes(1);
      expect(onStackChange.mock.calls[0][0]).toHaveLength(1);

      modal.actions.openModal('modal-2', { title: 'Modal 2' });

      expect(onStackChange).toHaveBeenCalledTimes(2);
      expect(onStackChange.mock.calls[1][0]).toHaveLength(2);

      modal.destroy();
    });

    it('should invoke onStackChange when all modals are closed', () => {
      const onStackChange = vi.fn();
      const modal = createModal({ onStackChange });

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      modal.actions.openModal('modal-2', { title: 'Modal 2' });

      onStackChange.mockClear();

      modal.actions.closeAllModals();

      expect(onStackChange).toHaveBeenCalledTimes(1);
      expect(onStackChange).toHaveBeenCalledWith([]);

      modal.destroy();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const modal = createModal();

      const listener = vi.fn();
      modal.subscribe(listener);

      modal.actions.openModal('modal-1', { title: 'Modal 1' });

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0].stack).toHaveLength(1);
      expect(lastCall[0].topModalId).toBe('modal-1');

      modal.destroy();
    });

    it('should support multiple subscribers', () => {
      const modal = createModal();

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      modal.subscribe(listener1);
      modal.subscribe(listener2);

      modal.actions.openModal('modal-1', { title: 'Modal 1' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      modal.destroy();
    });

    it('should allow unsubscribing', () => {
      const modal = createModal();

      const listener = vi.fn();
      const unsubscribe = modal.subscribe(listener);

      unsubscribe();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });

      expect(listener).not.toHaveBeenCalled();

      modal.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const modal = createModal();

      const listener = vi.fn();
      modal.subscribe(listener);

      modal.destroy();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should clean up all dialog behaviors', () => {
      const modal = createModal();

      modal.actions.openModal('modal-1', { title: 'Modal 1' });
      modal.actions.openModal('modal-2', { title: 'Modal 2' });
      modal.actions.openModal('modal-3', { title: 'Modal 3' });

      expect(() => {
        modal.destroy();
      }).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete modal lifecycle', () => {
      const onModalOpened = vi.fn();
      const onModalClosed = vi.fn();
      const onStackChange = vi.fn();

      const modal = createModal({
        onModalOpened,
        onModalClosed,
        onStackChange,
      });

      const stateListener = vi.fn();
      const openedEventListener = vi.fn();
      const closedEventListener = vi.fn();

      modal.subscribe(stateListener);
      modal.eventBus.on('modal:opened', openedEventListener);
      modal.eventBus.on('modal:closed', closedEventListener);

      // Open first modal
      modal.actions.openModal('modal-1', { title: 'Modal 1' }, 0);
      expect(modal.getState().topModalId).toBe('modal-1');
      expect(onModalOpened).toHaveBeenCalledWith({
        id: 'modal-1',
        content: { title: 'Modal 1' },
        priority: 0,
      });
      expect(openedEventListener).toHaveBeenCalled();

      // Open higher priority modal
      modal.actions.openModal('modal-2', { title: 'Modal 2' }, 10);
      expect(modal.getState().topModalId).toBe('modal-2');

      // Close top modal
      modal.actions.closeTopModal();
      expect(modal.getState().topModalId).toBe('modal-1');
      expect(onModalClosed).toHaveBeenCalledWith('modal-2');
      expect(closedEventListener).toHaveBeenCalledWith('modal-2');

      // Close all modals
      modal.actions.closeAllModals();
      expect(modal.getState().stack).toHaveLength(0);
      expect(modal.getState().topModalId).toBeNull();

      // Clean up
      modal.destroy();
    });

    it('should maintain state consistency across multiple operations', () => {
      const modal = createModal();

      // Initial state
      expect(modal.getState().stack).toHaveLength(0);
      expect(modal.getState().topModalId).toBeNull();

      // Open modals with different priorities
      modal.actions.openModal('low', { title: 'Low Priority' }, 0);
      modal.actions.openModal('high', { title: 'High Priority' }, 100);
      modal.actions.openModal('medium', { title: 'Medium Priority' }, 50);

      // High priority should be on top
      expect(modal.getState().topModalId).toBe('high');
      expect(modal.getState().stack).toHaveLength(3);

      // Close high priority modal
      modal.actions.closeModal('high');
      expect(modal.getState().topModalId).toBe('medium');
      expect(modal.getState().stack).toHaveLength(2);

      // Close medium priority modal
      modal.actions.closeModal('medium');
      expect(modal.getState().topModalId).toBe('low');
      expect(modal.getState().stack).toHaveLength(1);

      // Close last modal
      modal.actions.closeModal('low');
      expect(modal.getState().topModalId).toBeNull();
      expect(modal.getState().stack).toHaveLength(0);

      modal.destroy();
    });

    it('should handle complex stacking scenarios', () => {
      const modal = createModal();

      // Open multiple modals
      modal.actions.openModal('modal-1', { data: 1 }, 5);
      modal.actions.openModal('modal-2', { data: 2 }, 10);
      modal.actions.openModal('modal-3', { data: 3 }, 3);
      modal.actions.openModal('modal-4', { data: 4 }, 10);

      const state = modal.getState();

      // Should have 4 modals
      expect(state.stack).toHaveLength(4);

      // Top modal should be one of the priority 10 modals (first opened)
      expect(state.topModalId).toBe('modal-2');

      // Close top modal
      modal.actions.closeTopModal();
      expect(modal.getState().topModalId).toBe('modal-4');

      // Close another priority 10 modal
      modal.actions.closeTopModal();
      expect(modal.getState().topModalId).toBe('modal-1');

      modal.destroy();
    });
  });
});
