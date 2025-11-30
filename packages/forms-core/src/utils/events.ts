import type { EventCallback } from '../types';

/**
 * Type-safe event emitter for form events
 */
export class EventEmitter<EventMap extends Record<string, unknown[]> = Record<string, unknown[]>> {
  private listeners = new Map<keyof EventMap, EventCallback[]>();

  /**
   * Subscribe to an event
   */
  on<K extends keyof EventMap>(event: K, callback: (...args: EventMap[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const callbacks = this.listeners.get(event)!;
    callbacks.push(callback as EventCallback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof EventMap>(event: K, callback: (...args: EventMap[K]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback as EventCallback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
      }
    });
  }

  /**
   * Subscribe to an event once (automatically unsubscribes after first call)
   */
  once<K extends keyof EventMap>(event: K, callback: (...args: EventMap[K]) => void): () => void {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe();
      callback(...args);
    });
    return unsubscribe;
  }

  /**
   * Remove all listeners for an event or all events
   */
  removeAllListeners<K extends keyof EventMap>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount<K extends keyof EventMap>(event: K): number {
    return this.listeners.get(event)?.length || 0;
  }

  /**
   * Check if there are any listeners for an event
   */
  hasListeners<K extends keyof EventMap>(event: K): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): (keyof EventMap)[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Cleanup all listeners
   */
  destroy(): void {
    this.listeners.clear();
  }
}
