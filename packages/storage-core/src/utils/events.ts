/**
 * Simple event emitter for storage events
 */

type Listener<T = any> = (data: T) => void;

export class EventEmitter<T = any> {
  private listeners: Map<string, Set<Listener<T>>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, listener: Listener<T>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, data: T): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Check if event has listeners
   */
  hasListeners(event: string): boolean {
    return this.listeners.has(event) && this.listeners.get(event)!.size > 0;
  }
}

/**
 * Match a key against a pattern (supports wildcards)
 */
export function matchPattern(key: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (!pattern.includes('*')) return key === pattern;

  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(key);
}
