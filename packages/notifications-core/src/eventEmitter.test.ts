import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from './eventEmitter';

interface TestEvents {
  userLogin: { userId: string; timestamp: number };
  userLogout: { userId: string };
  message: string;
  count: number;
}

describe('EventEmitter', () => {
  let emitter: EventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>();
  });

  describe('subscribe', () => {
    it('should subscribe a callback to an event', () => {
      const callback = vi.fn();
      emitter.subscribe('message', callback);
      emitter.emit('message', 'Hello');
      expect(callback).toHaveBeenCalledWith('Hello');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support multiple subscribers for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      emitter.subscribe('message', callback1);
      emitter.subscribe('message', callback2);
      emitter.subscribe('message', callback3);

      emitter.emit('message', 'Test message');

      expect(callback1).toHaveBeenCalledWith('Test message');
      expect(callback2).toHaveBeenCalledWith('Test message');
      expect(callback3).toHaveBeenCalledWith('Test message');
    });

    it('should return an unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = emitter.subscribe('message', callback);

      emitter.emit('message', 'First');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      emitter.emit('message', 'Second');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle complex event payloads', () => {
      const callback = vi.fn();
      const payload = { userId: 'user123', timestamp: Date.now() };

      emitter.subscribe('userLogin', callback);
      emitter.emit('userLogin', payload);

      expect(callback).toHaveBeenCalledWith(payload);
    });
  });

  describe('emit', () => {
    it('should not throw if no subscribers exist', () => {
      expect(() => emitter.emit('message', 'No subscribers')).not.toThrow();
    });

    it('should invoke all subscribed callbacks', () => {
      const callbacks = [vi.fn(), vi.fn(), vi.fn()];
      callbacks.forEach((cb) => emitter.subscribe('count', cb));

      emitter.emit('count', 42);

      callbacks.forEach((cb) => {
        expect(cb).toHaveBeenCalledWith(42);
      });
    });

    it('should handle callback errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      emitter.subscribe('message', errorCallback);
      emitter.subscribe('message', normalCallback);

      emitter.emit('message', 'Test');

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalledWith('Test');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should emit events to the correct subscribers only', () => {
      const messageCallback = vi.fn();
      const countCallback = vi.fn();

      emitter.subscribe('message', messageCallback);
      emitter.subscribe('count', countCallback);

      emitter.emit('message', 'Hello');

      expect(messageCallback).toHaveBeenCalledWith('Hello');
      expect(countCallback).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe a specific callback', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.subscribe('message', callback1);
      emitter.subscribe('message', callback2);

      emitter.unsubscribe('message', callback1);
      emitter.emit('message', 'Test');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('Test');
    });

    it('should clear all callbacks when called without callback parameter', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.subscribe('message', callback1);
      emitter.subscribe('message', callback2);

      emitter.unsubscribe('message');
      emitter.emit('message', 'Test');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should handle unsubscribing non-existent callbacks gracefully', () => {
      const callback = vi.fn();
      expect(() => emitter.unsubscribe('message', callback)).not.toThrow();
    });

    it('should handle unsubscribing from non-existent events gracefully', () => {
      expect(() => emitter.unsubscribe('message')).not.toThrow();
    });

    it('should clean up listeners map when last callback is removed', () => {
      const callback = vi.fn();
      emitter.subscribe('message', callback);
      emitter.unsubscribe('message', callback);

      // Emit should not throw even after cleanup
      expect(() => emitter.emit('message', 'Test')).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribeAll', () => {
    it('should clear all listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      emitter.subscribe('message', callback1);
      emitter.subscribe('count', callback2);
      emitter.subscribe('userLogin', callback3);

      emitter.unsubscribeAll();

      emitter.emit('message', 'Test');
      emitter.emit('count', 123);
      emitter.emit('userLogin', { userId: 'test', timestamp: Date.now() });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });

    it('should allow new subscriptions after clearing all', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.subscribe('message', callback1);
      emitter.unsubscribeAll();
      emitter.subscribe('message', callback2);

      emitter.emit('message', 'Test');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('Test');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid subscribe/unsubscribe cycles', () => {
      const callback = vi.fn();

      for (let i = 0; i < 100; i++) {
        const unsub = emitter.subscribe('count', callback);
        unsub();
      }

      emitter.emit('count', 42);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle the same callback subscribed multiple times', () => {
      const callback = vi.fn();

      emitter.subscribe('message', callback);
      emitter.subscribe('message', callback);

      emitter.emit('message', 'Test');

      // Set only allows unique values, so callback should be called once
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should maintain separate listener sets for different events', () => {
      const callback = vi.fn();

      emitter.subscribe('message', callback);
      emitter.subscribe('count', callback);

      emitter.emit('message', 'Test');
      emitter.emit('count', 42);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, 'Test');
      expect(callback).toHaveBeenNthCalledWith(2, 42);
    });
  });
});
