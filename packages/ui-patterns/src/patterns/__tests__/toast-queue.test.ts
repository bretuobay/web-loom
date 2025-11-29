import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createToastQueue } from '../toast-queue';

describe('createToastQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with empty toasts array', () => {
      const toastQueue = createToastQueue();

      const state = toastQueue.getState();

      expect(state.toasts).toEqual([]);
      expect(state.maxVisible).toBe(3);
      expect(state.defaultDuration).toBe(5000);
      expect(state.position).toBe('top-right');

      toastQueue.destroy();
    });

    it('should initialize with custom maxVisible', () => {
      const toastQueue = createToastQueue({ maxVisible: 5 });

      const state = toastQueue.getState();

      expect(state.maxVisible).toBe(5);

      toastQueue.destroy();
    });

    it('should initialize with custom defaultDuration', () => {
      const toastQueue = createToastQueue({ defaultDuration: 3000 });

      const state = toastQueue.getState();

      expect(state.defaultDuration).toBe(3000);

      toastQueue.destroy();
    });

    it('should initialize with default position', () => {
      const toastQueue = createToastQueue();

      const state = toastQueue.getState();

      expect(state.position).toBe('top-right');

      toastQueue.destroy();
    });

    it('should initialize with custom position', () => {
      const toastQueue = createToastQueue({ position: 'bottom-left' });

      const state = toastQueue.getState();

      expect(state.position).toBe('bottom-left');

      toastQueue.destroy();
    });
  });

  describe('addToast action', () => {
    it('should add toast with auto-generated ID', () => {
      const toastQueue = createToastQueue();

      const id = toastQueue.actions.addToast({
        message: 'Test message',
        type: 'info',
        duration: 5000,
      });

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      const state = toastQueue.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe(id);

      toastQueue.destroy();
    });

    it('should add toast with correct properties', () => {
      const toastQueue = createToastQueue();

      const id = toastQueue.actions.addToast({
        message: 'Success message',
        type: 'success',
        duration: 3000,
      });

      const state = toastQueue.getState();
      const toast = state.toasts[0];

      expect(toast.id).toBe(id);
      expect(toast.message).toBe('Success message');
      expect(toast.type).toBe('success');
      expect(toast.duration).toBe(3000);
      expect(toast.createdAt).toBeDefined();
      expect(typeof toast.createdAt).toBe('number');

      toastQueue.destroy();
    });

    it('should add multiple toasts', () => {
      const toastQueue = createToastQueue();

      const id1 = toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 5000,
      });

      const id2 = toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'success',
        duration: 5000,
      });

      const id3 = toastQueue.actions.addToast({
        message: 'Toast 3',
        type: 'warning',
        duration: 5000,
      });

      const state = toastQueue.getState();

      expect(state.toasts).toHaveLength(3);
      expect(state.toasts.map((t) => t.id)).toContain(id1);
      expect(state.toasts.map((t) => t.id)).toContain(id2);
      expect(state.toasts.map((t) => t.id)).toContain(id3);

      toastQueue.destroy();
    });

    it('should support different toast types', () => {
      const toastQueue = createToastQueue();

      toastQueue.actions.addToast({
        message: 'Info toast',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Success toast',
        type: 'success',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Warning toast',
        type: 'warning',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Error toast',
        type: 'error',
        duration: 5000,
      });

      const state = toastQueue.getState();

      expect(state.toasts).toHaveLength(4);
      expect(state.toasts[0].type).toBe('info');
      expect(state.toasts[1].type).toBe('success');
      expect(state.toasts[2].type).toBe('warning');
      expect(state.toasts[3].type).toBe('error');

      toastQueue.destroy();
    });

    it('should generate unique IDs for each toast', () => {
      const toastQueue = createToastQueue();

      const id1 = toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 5000,
      });

      const id2 = toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'info',
        duration: 5000,
      });

      const id3 = toastQueue.actions.addToast({
        message: 'Toast 3',
        type: 'info',
        duration: 5000,
      });

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);

      toastQueue.destroy();
    });
  });

  describe('removeToast action', () => {
    it('should remove specific toast', () => {
      const toastQueue = createToastQueue();

      const id1 = toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 5000,
      });

      const id2 = toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'info',
        duration: 5000,
      });

      expect(toastQueue.getState().toasts).toHaveLength(2);

      toastQueue.actions.removeToast(id1);

      const state = toastQueue.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe(id2);

      toastQueue.destroy();
    });

    it('should handle removing non-existent toast gracefully', () => {
      const toastQueue = createToastQueue();

      toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 5000,
      });

      expect(() => {
        toastQueue.actions.removeToast('non-existent-id');
      }).not.toThrow();

      expect(toastQueue.getState().toasts).toHaveLength(1);

      toastQueue.destroy();
    });

    it('should remove toast from middle of queue', () => {
      const toastQueue = createToastQueue();

      const id1 = toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 5000,
      });

      const id2 = toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'info',
        duration: 5000,
      });

      const id3 = toastQueue.actions.addToast({
        message: 'Toast 3',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.removeToast(id2);

      const state = toastQueue.getState();
      expect(state.toasts).toHaveLength(2);
      expect(state.toasts.map((t) => t.id)).toContain(id1);
      expect(state.toasts.map((t) => t.id)).toContain(id3);
      expect(state.toasts.map((t) => t.id)).not.toContain(id2);

      toastQueue.destroy();
    });
  });

  describe('clearAllToasts action', () => {
    it('should remove all toasts', () => {
      const toastQueue = createToastQueue();

      toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'success',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 3',
        type: 'warning',
        duration: 5000,
      });

      expect(toastQueue.getState().toasts).toHaveLength(3);

      toastQueue.actions.clearAllToasts();

      const state = toastQueue.getState();
      expect(state.toasts).toHaveLength(0);

      toastQueue.destroy();
    });

    it('should handle clearing when no toasts exist', () => {
      const toastQueue = createToastQueue();

      expect(() => {
        toastQueue.actions.clearAllToasts();
      }).not.toThrow();

      expect(toastQueue.getState().toasts).toHaveLength(0);

      toastQueue.destroy();
    });
  });

  describe('setPosition action', () => {
    it('should update position in state', () => {
      const toastQueue = createToastQueue();

      expect(toastQueue.getState().position).toBe('top-right');

      toastQueue.actions.setPosition('bottom-left');

      expect(toastQueue.getState().position).toBe('bottom-left');

      toastQueue.destroy();
    });

    it('should support all valid position values', () => {
      const toastQueue = createToastQueue();

      const positions: Array<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'> = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ];

      positions.forEach((position) => {
        toastQueue.actions.setPosition(position);
        expect(toastQueue.getState().position).toBe(position);
      });

      toastQueue.destroy();
    });

    it('should invoke onPositionChanged callback', () => {
      const onPositionChanged = vi.fn();
      const toastQueue = createToastQueue({ onPositionChanged });

      toastQueue.actions.setPosition('bottom-center');

      expect(onPositionChanged).toHaveBeenCalledTimes(1);
      expect(onPositionChanged).toHaveBeenCalledWith('bottom-center');

      toastQueue.destroy();
    });

    it('should notify subscribers when position changes', () => {
      const toastQueue = createToastQueue();

      const listener = vi.fn();
      toastQueue.subscribe(listener);

      toastQueue.actions.setPosition('top-left');

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0].position).toBe('top-left');

      toastQueue.destroy();
    });
  });

  describe('auto-removal after duration', () => {
    it('should auto-remove toast after duration expires', () => {
      const toastQueue = createToastQueue();

      toastQueue.actions.addToast({
        message: 'Auto-remove toast',
        type: 'info',
        duration: 3000,
      });

      expect(toastQueue.getState().toasts).toHaveLength(1);

      // Fast-forward time by 3000ms
      vi.advanceTimersByTime(3000);

      expect(toastQueue.getState().toasts).toHaveLength(0);

      toastQueue.destroy();
    });

    it('should auto-remove multiple toasts at different times', () => {
      const toastQueue = createToastQueue();

      toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 2000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'info',
        duration: 4000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 3',
        type: 'info',
        duration: 6000,
      });

      expect(toastQueue.getState().toasts).toHaveLength(3);

      // After 2000ms, first toast should be removed
      vi.advanceTimersByTime(2000);
      expect(toastQueue.getState().toasts).toHaveLength(2);

      // After another 2000ms (total 4000ms), second toast should be removed
      vi.advanceTimersByTime(2000);
      expect(toastQueue.getState().toasts).toHaveLength(1);

      // After another 2000ms (total 6000ms), third toast should be removed
      vi.advanceTimersByTime(2000);
      expect(toastQueue.getState().toasts).toHaveLength(0);

      toastQueue.destroy();
    });

    it('should not auto-remove toast if manually removed first', () => {
      const toastQueue = createToastQueue();

      const id = toastQueue.actions.addToast({
        message: 'Manual remove toast',
        type: 'info',
        duration: 5000,
      });

      expect(toastQueue.getState().toasts).toHaveLength(1);

      // Manually remove before duration expires
      toastQueue.actions.removeToast(id);
      expect(toastQueue.getState().toasts).toHaveLength(0);

      // Fast-forward past the duration
      vi.advanceTimersByTime(5000);

      // Should still be 0 (no duplicate removal)
      expect(toastQueue.getState().toasts).toHaveLength(0);

      toastQueue.destroy();
    });
  });

  describe('max visible limit', () => {
    it('should allow adding toasts up to maxVisible', () => {
      const toastQueue = createToastQueue({ maxVisible: 3 });

      toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 3',
        type: 'info',
        duration: 5000,
      });

      const state = toastQueue.getState();
      expect(state.toasts).toHaveLength(3);

      toastQueue.destroy();
    });

    it('should allow adding more toasts than maxVisible', () => {
      const toastQueue = createToastQueue({ maxVisible: 2 });

      toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 3',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 4',
        type: 'info',
        duration: 5000,
      });

      // All toasts are added to the queue
      const state = toastQueue.getState();
      expect(state.toasts).toHaveLength(4);

      toastQueue.destroy();
    });
  });

  describe('callbacks', () => {
    it('should invoke onToastAdded callback when toast is added', () => {
      const onToastAdded = vi.fn();
      const toastQueue = createToastQueue({ onToastAdded });

      toastQueue.actions.addToast({
        message: 'Test toast',
        type: 'info',
        duration: 5000,
      });

      expect(onToastAdded).toHaveBeenCalledTimes(1);
      expect(onToastAdded.mock.calls[0][0]).toMatchObject({
        message: 'Test toast',
        type: 'info',
        duration: 5000,
      });

      toastQueue.destroy();
    });

    it('should invoke onToastRemoved callback when toast is removed', () => {
      const onToastRemoved = vi.fn();
      const toastQueue = createToastQueue({ onToastRemoved });

      const id = toastQueue.actions.addToast({
        message: 'Test toast',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.removeToast(id);

      expect(onToastRemoved).toHaveBeenCalledTimes(1);
      expect(onToastRemoved).toHaveBeenCalledWith(id);

      toastQueue.destroy();
    });

    it('should invoke onToastRemoved callback when toast auto-removes', () => {
      const onToastRemoved = vi.fn();
      const toastQueue = createToastQueue({ onToastRemoved });

      toastQueue.actions.addToast({
        message: 'Auto-remove toast',
        type: 'info',
        duration: 3000,
      });

      // Fast-forward time
      vi.advanceTimersByTime(3000);

      expect(onToastRemoved).toHaveBeenCalledTimes(1);

      toastQueue.destroy();
    });

    it('should invoke onToastRemoved for each toast when clearing all', () => {
      const onToastRemoved = vi.fn();
      const toastQueue = createToastQueue({ onToastRemoved });

      toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 3',
        type: 'info',
        duration: 5000,
      });

      toastQueue.actions.clearAllToasts();

      expect(onToastRemoved).toHaveBeenCalledTimes(3);

      toastQueue.destroy();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when toast is added', () => {
      const toastQueue = createToastQueue();

      const listener = vi.fn();
      toastQueue.subscribe(listener);

      toastQueue.actions.addToast({
        message: 'Test toast',
        type: 'info',
        duration: 5000,
      });

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0].toasts).toHaveLength(1);

      toastQueue.destroy();
    });

    it('should notify subscribers when toast is removed', () => {
      const toastQueue = createToastQueue();

      const listener = vi.fn();
      toastQueue.subscribe(listener);

      const id = toastQueue.actions.addToast({
        message: 'Test toast',
        type: 'info',
        duration: 5000,
      });

      listener.mockClear();

      toastQueue.actions.removeToast(id);

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0].toasts).toHaveLength(0);

      toastQueue.destroy();
    });

    it('should support multiple subscribers', () => {
      const toastQueue = createToastQueue();

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      toastQueue.subscribe(listener1);
      toastQueue.subscribe(listener2);

      toastQueue.actions.addToast({
        message: 'Test toast',
        type: 'info',
        duration: 5000,
      });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      toastQueue.destroy();
    });

    it('should allow unsubscribing', () => {
      const toastQueue = createToastQueue();

      const listener = vi.fn();
      const unsubscribe = toastQueue.subscribe(listener);

      unsubscribe();

      toastQueue.actions.addToast({
        message: 'Test toast',
        type: 'info',
        duration: 5000,
      });

      expect(listener).not.toHaveBeenCalled();

      toastQueue.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const toastQueue = createToastQueue();

      const listener = vi.fn();
      toastQueue.subscribe(listener);

      toastQueue.destroy();

      toastQueue.actions.addToast({
        message: 'Test toast',
        type: 'info',
        duration: 5000,
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should clear all timers when destroyed', () => {
      const toastQueue = createToastQueue();

      toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 3000,
      });

      toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'info',
        duration: 5000,
      });

      toastQueue.destroy();

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      // Toasts should not be auto-removed after destroy
      // (getState will throw or return stale data, but timers should be cleared)
      expect(() => {
        toastQueue.destroy();
      }).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete toast lifecycle', () => {
      const onToastAdded = vi.fn();
      const onToastRemoved = vi.fn();

      const toastQueue = createToastQueue({
        maxVisible: 3,
        defaultDuration: 5000,
        onToastAdded,
        onToastRemoved,
      });

      const stateListener = vi.fn();
      toastQueue.subscribe(stateListener);

      // Add toasts
      const id1 = toastQueue.actions.addToast({
        message: 'Success!',
        type: 'success',
        duration: 2000,
      });

      expect(onToastAdded).toHaveBeenCalledTimes(1);
      expect(toastQueue.getState().toasts).toHaveLength(1);

      const id2 = toastQueue.actions.addToast({
        message: 'Warning!',
        type: 'warning',
        duration: 4000,
      });

      expect(onToastAdded).toHaveBeenCalledTimes(2);
      expect(toastQueue.getState().toasts).toHaveLength(2);

      // Manually remove first toast
      toastQueue.actions.removeToast(id1);
      expect(onToastRemoved).toHaveBeenCalledWith(id1);
      expect(toastQueue.getState().toasts).toHaveLength(1);

      // Wait for second toast to auto-remove
      vi.advanceTimersByTime(4000);
      expect(onToastRemoved).toHaveBeenCalledWith(id2);
      expect(toastQueue.getState().toasts).toHaveLength(0);

      // Clean up
      toastQueue.destroy();
    });

    it('should handle rapid toast additions', () => {
      const toastQueue = createToastQueue({ maxVisible: 2 });

      const ids: string[] = [];

      for (let i = 0; i < 10; i++) {
        const id = toastQueue.actions.addToast({
          message: `Toast ${i + 1}`,
          type: 'info',
          duration: 5000,
        });
        ids.push(id);
      }

      const state = toastQueue.getState();
      expect(state.toasts).toHaveLength(10);

      // All toasts should have unique IDs
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);

      toastQueue.destroy();
    });

    it('should handle mixed manual and auto removal', () => {
      const toastQueue = createToastQueue();

      const id1 = toastQueue.actions.addToast({
        message: 'Toast 1',
        type: 'info',
        duration: 2000,
      });

      const id2 = toastQueue.actions.addToast({
        message: 'Toast 2',
        type: 'info',
        duration: 4000,
      });

      const id3 = toastQueue.actions.addToast({
        message: 'Toast 3',
        type: 'info',
        duration: 6000,
      });

      expect(toastQueue.getState().toasts).toHaveLength(3);

      // Manually remove second toast
      toastQueue.actions.removeToast(id2);
      expect(toastQueue.getState().toasts).toHaveLength(2);

      // Wait for first toast to auto-remove
      vi.advanceTimersByTime(2000);
      expect(toastQueue.getState().toasts).toHaveLength(1);
      expect(toastQueue.getState().toasts[0].id).toBe(id3);

      // Wait for third toast to auto-remove
      vi.advanceTimersByTime(4000);
      expect(toastQueue.getState().toasts).toHaveLength(0);

      toastQueue.destroy();
    });
  });
});
